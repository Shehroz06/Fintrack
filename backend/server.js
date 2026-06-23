const express = require('express');
const cors = require('cors');
require('dotenv').config();

const DatabaseSingleton = require('./DatabaseSingleton');
const RecommendationEngine = require('./RecommendationEngine');
const { TransactionService, GoalTrackerService } = require('./Services');
const { FinancialStateManager, BudgetingState, SavingsState, InvestmentState } = require('./FinancialState');
const { BudgetPlanner, ZeroBasedBudgetingStrategy, FiftyThirtyTwentyStrategy } = require('./BudgetingStrategy');
const { PortfolioManager, SimpleAccount } = require('./CompositeAccount');
const authRouter = require('./auth');
const authenticate = require('./middleware/authenticate');

const app = express();
const db = DatabaseSingleton.getInstance();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transactionService = new TransactionService();
const goalTrackerService = new GoalTrackerService();
const recommendationEngine = new RecommendationEngine();

// In-memory composite account store (stateless per-request; accounts persisted in DB)
const portfolioManagers = new Map();

function getOrCreatePortfolio(userId) {
  if (!portfolioManagers.has(userId)) {
    portfolioManagers.set(userId, new PortfolioManager());
  }
  return portfolioManagers.get(userId);
}

// ==================== PUBLIC ROUTES ====================

app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ==================== PROTECTED ROUTES (require JWT) ====================

app.use('/api', authenticate);

// ---------- TRANSACTIONS ----------

app.post('/api/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, amount, category, description, transactionDate } = req.body;

    const normalizedType = String(type || '').trim().toLowerCase();
    if (!['income', 'expense', 'investment', 'savings'].includes(normalizedType)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction type.' });
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
    }

    const desc = String(description || '').trim();
    if (!desc) {
      return res.status(400).json({ success: false, error: 'Description is required.' });
    }

    // Get user's default account id
    const accounts = await db.query('SELECT id FROM accounts WHERE user_id = ? LIMIT 1', [userId]);
    const accountId = accounts.length > 0 ? accounts[0].id : null;

    const resolvedCategory = category || await recommendationEngine.categorizeTransaction(desc);

    const result = await transactionService.addTransaction(userId, accountId, {
      type: normalizedType,
      amount: numAmount,
      category: resolvedCategory,
      description: desc.slice(0, 255),
      transactionDate: transactionDate || new Date().toISOString().split('T')[0]
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, category, startDate, endDate, limit, offset } = req.query;
    const result = await transactionService.getUserTransactions(userId, {
      type, category, startDate, endDate,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions/category-breakdown', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;
    const result = await transactionService.getCategoryBreakdown(userId, month);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions/monthly-summary/:month', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.params;
    const result = await transactionService.getMonthlySummary(userId, month);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await transactionService.deleteTransaction(id, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- GOALS ----------

app.post('/api/goals', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, targetAmount, deadline } = req.body;

    if (!String(name || '').trim()) {
      return res.status(400).json({ success: false, error: 'Goal name is required.' });
    }
    const numTarget = Number(targetAmount);
    if (!Number.isFinite(numTarget) || numTarget <= 0) {
      return res.status(400).json({ success: false, error: 'Target amount must be a positive number.' });
    }
    if (!deadline) {
      return res.status(400).json({ success: false, error: 'Deadline is required.' });
    }

    const result = await goalTrackerService.createGoal(userId, {
      name: String(name).trim().slice(0, 255),
      targetAmount: numTarget,
      deadline
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/goals', async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await goalTrackerService.getUserGoals(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/goals/:goalId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { goalId } = req.params;
    const { currentAmount } = req.body;
    const num = Number(currentAmount);
    if (!Number.isFinite(num) || num < 0) {
      return res.status(400).json({ success: false, error: 'Current amount must be a non-negative number.' });
    }
    const result = await goalTrackerService.updateGoalProgress(goalId, userId, num);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/goals/:goalId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { goalId } = req.params;
    const result = await goalTrackerService.deleteGoal(goalId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- FINANCIAL STATE (DB-persisted) ----------

app.post('/api/financial-state/switch', async (req, res) => {
  try {
    const userId = req.user.userId;
    const state = String(req.body.state || '').trim().toUpperCase();
    const valid = ['BUDGETING', 'SAVINGS', 'INVESTMENT'];
    if (!valid.includes(state)) {
      return res.status(400).json({ success: false, error: 'Invalid state. Use BUDGETING, SAVINGS, or INVESTMENT.' });
    }

    await db.query(
      'INSERT INTO user_settings (user_id, financial_state) VALUES (?, ?) ON DUPLICATE KEY UPDATE financial_state = ?',
      [userId, state, state]
    );

    res.json({
      success: true,
      currentState: state,
      availableStates: getAvailableStates()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/financial-state', async (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = await db.query('SELECT financial_state FROM user_settings WHERE user_id = ?', [userId]);
    const currentState = rows.length > 0 ? rows[0].financial_state : 'BUDGETING';

    res.json({
      currentState,
      availableStates: getAvailableStates()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function getAvailableStates() {
  return [
    { id: 'BUDGETING', name: 'Budgeting Mode', description: 'Focus on tracking and controlling expenses' },
    { id: 'SAVINGS', name: 'Savings Mode', description: 'Focus on maximizing savings and building security' },
    { id: 'INVESTMENT', name: 'Investment Mode', description: 'Focus on growing wealth through investments' }
  ];
}

// ---------- RECOMMENDATIONS ----------

app.post('/api/recommendations/generate', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [transResult, goalsResult, stateRows] = await Promise.all([
      transactionService.getUserTransactions(userId),
      goalTrackerService.getUserGoals(userId),
      db.query('SELECT financial_state FROM user_settings WHERE user_id = ?', [userId])
    ]);

    if (!transResult.success) {
      return res.status(400).json(transResult);
    }

    const transactions = transResult.transactions;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const investmentAmount = transactions.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const categorySpending = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const financialState = stateRows.length > 0 ? stateRows[0].financial_state : 'BUDGETING';

    // Build state-based recommendations using the State pattern
    const manager = new FinancialStateManager();
    manager.transactions = transactions;
    manager.savingsGoals = goalsResult.goals || [];
    if (financialState === 'SAVINGS') manager.setState(new SavingsState());
    else if (financialState === 'INVESTMENT') manager.setState(new InvestmentState());
    else manager.setState(new BudgetingState());

    const stateRecommendations = manager.getRecommendations();

    const aiResult = await recommendationEngine.generateRecommendations({
      totalIncome,
      totalExpenses,
      savingsRate,
      savingsGoals: goalsResult.goals || [],
      categorySpending,
      currentSavings: totalIncome - totalExpenses,
      investmentAmount,
      financialState
    });

    res.json({
      success: true,
      userMetrics: { totalIncome, totalExpenses, savingsRate, investmentAmount, categorySpending },
      stateRecommendations,
      aiRecommendations: aiResult.recommendations || aiResult.fallbackRecommendations
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- PORTFOLIO / ACCOUNTS ----------

app.post('/api/portfolio/accounts', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountName, accountType, initialBalance } = req.body;

    if (!accountName) {
      return res.status(400).json({ success: false, error: 'Account name is required.' });
    }

    const validTypes = ['checking', 'savings', 'investment', 'credit'];
    const type = validTypes.includes(accountType) ? accountType : 'checking';
    const balance = Number(initialBalance) || 0;

    const result = await db.query(
      'INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)',
      [userId, String(accountName).trim(), type, balance]
    );

    res.json({
      success: true,
      message: 'Account added successfully',
      account: { id: result.insertId, name: accountName, type, balance }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/portfolio', async (req, res) => {
  try {
    const userId = req.user.userId;
    const accounts = await db.query(
      'SELECT id, name, type, balance FROM accounts WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );

    const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
    const breakdown = {};
    accounts.forEach(a => {
      breakdown[a.type] = (breakdown[a.type] || 0) + Number(a.balance);
    });

    res.json({
      success: true,
      portfolio: { name: 'My Portfolio', totalBalance, accountCount: accounts.length, accounts },
      balanceBreakdown: breakdown
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- BUDGETING STRATEGY ----------

app.post('/api/budgeting-strategy', (req, res) => {
  try {
    const { strategy, income } = req.body;
    const numIncome = Number(income);
    if (!Number.isFinite(numIncome) || numIncome <= 0) {
      return res.status(400).json({ success: false, error: 'Income must be a positive number.' });
    }

    let budgetStrategy;
    if (strategy === 'zero-based') {
      budgetStrategy = new ZeroBasedBudgetingStrategy();
    } else if (strategy === 'fifty-thirty-twenty') {
      budgetStrategy = new FiftyThirtyTwentyStrategy();
    } else {
      return res.status(400).json({ success: false, error: 'Strategy must be zero-based or fifty-thirty-twenty.' });
    }

    const planner = new BudgetPlanner(budgetStrategy);
    const budget = planner.getBudget(numIncome);
    res.json({ success: true, budget, strategy: budget.strategy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await DatabaseSingleton.getInstance().initializePool();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
