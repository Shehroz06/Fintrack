'use strict';

const { calculateBudgetUsage } = require('../Services');

describe('calculateBudgetUsage', () => {
  test('healthy status under 80% used', () => {
    const result = calculateBudgetUsage(50000, 20000);
    expect(result.status).toBe('healthy');
    expect(result.remaining).toBe(30000);
    expect(result.percentageUsed).toBe(40);
    expect(result.overBudgetAmount).toBe(0);
  });

  test('near-limit status between 80% and 100% used', () => {
    const result = calculateBudgetUsage(10000, 8500);
    expect(result.status).toBe('near-limit');
    expect(result.percentageUsed).toBe(85);
    expect(result.remaining).toBe(1500);
  });

  test('exceeded status over 100% used, reports overBudgetAmount', () => {
    const result = calculateBudgetUsage(10000, 12000);
    expect(result.status).toBe('exceeded');
    expect(result.remaining).toBe(-2000);
    expect(result.overBudgetAmount).toBe(2000);
    expect(result.percentageUsed).toBe(120);
  });

  test('exactly 100% used counts as exceeded, not near-limit', () => {
    const result = calculateBudgetUsage(5000, 5000);
    expect(result.status).toBe('exceeded');
    expect(result.remaining).toBe(0);
    expect(result.overBudgetAmount).toBe(0);
  });

  test('zero spent is fully healthy', () => {
    const result = calculateBudgetUsage(5000, 0);
    expect(result.status).toBe('healthy');
    expect(result.percentageUsed).toBe(0);
    expect(result.remaining).toBe(5000);
  });

  test('zero or invalid budget amount does not divide by zero', () => {
    const result = calculateBudgetUsage(0, 100);
    expect(result.percentageUsed).toBe(0);
    expect(Number.isFinite(result.percentageUsed)).toBe(true);
  });

  test('handles non-numeric input safely', () => {
    const result = calculateBudgetUsage('abc', null);
    expect(result.amount).toBe(0);
    expect(result.spent).toBe(0);
    expect(result.status).toBe('healthy');
  });
});
