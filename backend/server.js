/**
 * EXPRESS SERVER SETUP
 * Main server file with all routes configured
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const DatabaseSingleton = require('./DatabaseSingleton');
const RecommendationEngine = require('./RecommendationEngine');
const { TransactionService, GoalTrackerService } = require('./Services');
const { FinancialStateManager, BudgetingState, SavingsState, InvestmentState } = require('./FinancialState');
const { BudgetPlanner, ZeroBasedBudgetingStrategy, FiftyThirtyTwentyStrategy } = require('./BudgetingStrategy');
const { PortfolioManager, SimpleAccount } = require('./CompositeAccount');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Services
const transactionService = new TransactionService();
const goalTrackerService = new GoalTrackerService();
const recommendationEngine = new RecommendationEngine();

// In-memory storage for demo (use database in production)
const userFinancialStates = new Map();
const userPortfolios = new Map();

/**
 * ==================== UTILITY FUNCTIONS ====================
 */

function normalizeUserId(userId) {
    return String(userId ?? '').trim();
}

function getOrCreateFinancialState(userId) {
    const normalizedUserId = normalizeUserId(userId);

    if (!userFinancialStates.has(normalizedUserId)) {
        const manager = new FinancialStateManager();
        manager.setState(new BudgetingState());
        userFinancialStates.set(normalizedUserId, manager);
    }
    return userFinancialStates.get(normalizedUserId);
}

function getOrCreatePortfolio(userId) {
    const normalizedUserId = normalizeUserId(userId);

    if (!userPortfolios.has(normalizedUserId)) {
        const manager = new PortfolioManager();
        const portfolio = manager.createPortfolio(normalizedUserId, `Portfolio for User ${normalizedUserId}`, 'Main portfolio');
        userPortfolios.set(normalizedUserId, manager);
    }
    return userPortfolios.get(normalizedUserId);
}

/**
 * ==================== TRANSACTION ROUTES ====================
 */

app.post('/api/transactions', async (req, res) => {
    try {
        const { userId, accountId, type, amount, description, transactionDate } = req.body;

        // Auto-categorize using Gemini
        let category = req.body.category;
        if (!category) {
            category = await recommendationEngine.categorizeTransaction(description);
        }

        const result = await transactionService.addTransaction(userId, accountId, {
            type,
            amount,
            category,
            description,
            transactionDate: transactionDate || new Date().toISOString().split('T')[0]
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, category, startDate, endDate } = req.query;

        const result = await transactionService.getUserTransactions(userId, {
            type,
            category,
            startDate,
            endDate
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/transactions/category-breakdown/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month } = req.query;

        const result = await transactionService.getCategoryBreakdown(userId, month);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/transactions/monthly-summary/:userId/:month', async (req, res) => {
    try {
        const { userId, month } = req.params;

        const result = await transactionService.getMonthlySummary(userId, month);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/transactions/:id/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;

        const result = await transactionService.deleteTransaction(id, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ==================== GOAL ROUTES ====================
 */

app.post('/api/goals', async (req, res) => {
    try {
        const { userId, name, targetAmount, deadline } = req.body;

        const result = await goalTrackerService.createGoal(userId, {
            name,
            targetAmount,
            deadline
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/goals/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await goalTrackerService.getUserGoals(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/goals/:goalId/:userId', async (req, res) => {
    try {
        const { goalId, userId } = req.params;
        const { currentAmount } = req.body;

        const result = await goalTrackerService.updateGoalProgress(goalId, userId, currentAmount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/goals/:goalId/:userId', async (req, res) => {
    try {
        const { goalId, userId } = req.params;

        const result = await goalTrackerService.deleteGoal(goalId, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ==================== FINANCIAL STATE ROUTES ====================
 */

app.post('/api/financial-state/switch', (req, res) => {
    try {
        const { userId } = req.body;
        const state = String(req.body.state || '').trim().toUpperCase();

        const manager = getOrCreateFinancialState(userId);

        if (state === 'BUDGETING') manager.switchToBudgetingMode();
        else if (state === 'SAVINGS') manager.switchToSavingsMode();
        else if (state === 'INVESTMENT') manager.switchToInvestmentMode();
        else {
            return res.status(400).json({ error: 'Invalid state' });
        }

        res.json({
            success: true,
            currentState: manager.getCurrentState(),
            availableStates: manager.getAvailableStates()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/financial-state/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const manager = getOrCreateFinancialState(userId);

        res.json({
            currentState: manager.getCurrentState(),
            availableStates: manager.getAvailableStates()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ==================== RECOMMENDATION ROUTES ====================
 */

app.post('/api/recommendations/generate', async (req, res) => {
    try {
        const { userId } = req.body;

        // Fetch user's financial data
        const transResult = await transactionService.getUserTransactions(userId);
        const goalsResult = await goalTrackerService.getUserGoals(userId);

        if (!transResult.success) {
            return res.status(400).json(transResult);
        }

        // Calculate financial metrics
        const transactions = transResult.transactions;
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const investmentAmount = transactions
            .filter(t => t.type === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);

        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

        // Category breakdown
        const categorySpending = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
            });

        // Get state-specific recommendations
        const manager = getOrCreateFinancialState(userId);
        const stateRecommendations = manager.getRecommendations();

        // Get AI recommendations
        const aiResult = await recommendationEngine.generateRecommendations({
            totalIncome,
            totalExpenses,
            savingsRate,
            savingsGoals: goalsResult.goals || [],
            categorySpending,
            currentSavings: totalIncome - totalExpenses,
            investmentAmount,
            financialState: manager.currentState.getStateName()
        });

        res.json({
            success: true,
            userMetrics: {
                totalIncome,
                totalExpenses,
                savingsRate,
                investmentAmount,
                categorySpending
            },
            stateRecommendations,
            aiRecommendations: aiResult.recommendations || aiResult.fallbackRecommendations
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ==================== PORTFOLIO/ACCOUNT ROUTES ====================
 */

app.post('/api/portfolio/accounts', (req, res) => {
    try {
        const { userId, accountName, accountType, initialBalance } = req.body;

        const portfolioManager = getOrCreatePortfolio(userId);
        const account = new SimpleAccount(
            `acc_${Date.now()}`,
            accountName,
            accountType,
            initialBalance
        );

        const portfolio = portfolioManager.getPortfolio(userId);
        portfolio.addAccount(account);

        res.json({
            success: true,
            message: 'Account added successfully',
            account: account.getAccountInfo(),
            portfolioValue: portfolio.getBalance()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/portfolio/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const portfolioManager = getOrCreatePortfolio(userId);
        const portfolio = portfolioManager.getPortfolio(userId);

        res.json({
            success: true,
            portfolio: portfolio.getCompositeInfo(),
            balanceBreakdown: portfolio.getBalanceBreakdown()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ==================== BUDGETING STRATEGY ROUTES ====================
 */

app.post('/api/budgeting-strategy', (req, res) => {
    try {
        const { strategy, income } = req.body; // 'zero-based', 'fifty-thirty-twenty', 'custom'

        let budgetStrategy;

        if (strategy === 'zero-based') {
            budgetStrategy = new ZeroBasedBudgetingStrategy();
        } else if (strategy === 'fifty-thirty-twenty') {
            budgetStrategy = new FiftyThirtyTwentyStrategy();
        } else {
            return res.status(400).json({ error: 'Invalid strategy' });
        }

        const planner = new BudgetPlanner(budgetStrategy);
        const budget = planner.getBudget(income);

        res.json({
            success: true,
            budget,
            strategy: budget.strategy
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ==================== HEALTH CHECK ====================
 */

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Personal Finance Management System API',
        timestamp: new Date().toISOString()
    });
});

/**
 * ==================== START SERVER ====================
 */

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Initialize database
        await DatabaseSingleton.getInstance().initializePool();

        app.listen(PORT, () => {
            console.log(`🚀 Finance Management Server running on http://localhost:${PORT}`);
            console.log('📚 API Documentation available at /api/docs');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
