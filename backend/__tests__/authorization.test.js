'use strict';

/**
 * Integration test against the real Express app + dev database
 * (server.js only auto-listens when run directly, so requiring it here is
 * safe — see the `require.main === module` guard at the bottom of server.js).
 *
 * Verifies the single most important security property of a multi-tenant
 * finance app: User A can never read, modify, or delete User B's data,
 * even by guessing/incrementing an id.
 */

const request = require('supertest');
const app = require('../server');
const DatabaseSingleton = require('../DatabaseSingleton');

const db = DatabaseSingleton.getInstance();

const suffix = Date.now();
const userA = { name: 'Test User A', email: `test-a-${suffix}@fintrack.test`, password: 'TestPass123!' };
const userB = { name: 'Test User B', email: `test-b-${suffix}@fintrack.test`, password: 'TestPass123!' };

let tokenA, tokenB, userAId, userBId, transactionAId, goalAId;

async function register(user) {
  const res = await request(app).post('/api/auth/register').send(user);
  return res.body;
}

afterAll(async () => {
  // Clean up the throwaway accounts (cascades to their transactions/goals via FK).
  await db.query('DELETE FROM users WHERE email IN (?, ?)', [userA.email, userB.email]);
  await db.closePool();
});

describe('Authentication', () => {
  test('registers two distinct users', async () => {
    const a = await register(userA);
    const b = await register(userB);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    tokenA = a.token; userAId = a.user.id;
    tokenB = b.token; userBId = b.user.id;
    expect(userAId).not.toBe(userBId);
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: userA.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects requests with no token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  test('rejects requests with a garbage token', async () => {
    const res = await request(app).get('/api/transactions').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('Cross-user data isolation', () => {
  test('User A creates a transaction and a goal', async () => {
    const txRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'expense', amount: 42, category: 'food', description: 'Isolation test transaction' });
    expect(txRes.body.success).toBe(true);
    transactionAId = txRes.body.transactionId;

    const goalRes = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Isolation test goal', targetAmount: 1000, deadline: '2027-01-01' });
    expect(goalRes.body.success).toBe(true);
    goalAId = goalRes.body.goalId;
  });

  test("User B's transaction list never contains User A's transaction", async () => {
    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${tokenB}`);
    const ids = res.body.transactions.map(t => t.id);
    expect(ids).not.toContain(transactionAId);
  });

  test("User B cannot delete User A's transaction by guessing its id", async () => {
    await request(app)
      .delete(`/api/transactions/${transactionAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // Still visible to A afterwards — proves B's delete request was a no-op.
    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${tokenA}`);
    const ids = res.body.transactions.map(t => t.id);
    expect(ids).toContain(transactionAId);
  });

  test("User B cannot edit User A's transaction by guessing its id", async () => {
    await request(app)
      .put(`/api/transactions/${transactionAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ type: 'expense', amount: 999999, category: 'other', description: 'hijacked', transactionDate: '2026-01-01' });

    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${tokenA}`);
    const tx = res.body.transactions.find(t => t.id === transactionAId);
    expect(tx.amount).toBe(42);
    expect(tx.description).toBe('Isolation test transaction');
  });

  test("User B's goal list never contains User A's goal", async () => {
    const res = await request(app).get('/api/goals').set('Authorization', `Bearer ${tokenB}`);
    const ids = res.body.goals.map(g => g.id);
    expect(ids).not.toContain(goalAId);
  });

  test("User B cannot update User A's goal progress by guessing its id", async () => {
    await request(app)
      .put(`/api/goals/${goalAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ currentAmount: 999 });

    const res = await request(app).get('/api/goals').set('Authorization', `Bearer ${tokenA}`);
    const goal = res.body.goals.find(g => g.id === goalAId);
    expect(Number(goal.current_amount)).toBe(0);
  });

  test("User B cannot delete User A's goal by guessing its id", async () => {
    await request(app).delete(`/api/goals/${goalAId}`).set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app).get('/api/goals').set('Authorization', `Bearer ${tokenA}`);
    const ids = res.body.goals.map(g => g.id);
    expect(ids).toContain(goalAId);
  });

  test("User A and User B each see their own independent budget", async () => {
    const setA = await request(app).post('/api/budget').set('Authorization', `Bearer ${tokenA}`).send({ amount: 10000 });
    expect(setA.body.success).toBe(true);

    const getB = await request(app).get('/api/budget').set('Authorization', `Bearer ${tokenB}`);
    expect(getB.body.hasBudget).toBe(false);
  });

  test('User A cleans up own test data', async () => {
    await request(app).delete(`/api/transactions/${transactionAId}`).set('Authorization', `Bearer ${tokenA}`);
    await request(app).delete(`/api/goals/${goalAId}`).set('Authorization', `Bearer ${tokenA}`);
  });
});
