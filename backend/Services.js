/**
 * TRANSACTION SERVICE - Handle transaction operations
 */

const DatabaseSingleton = require('./DatabaseSingleton');

function normalizeTransactionType(type) {
    return String(type || '').trim().toLowerCase();
}

function normalizeAmount(amount) {
    const numericValue = Number(amount);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeTransactionRow(row) {
    return {
        ...row,
        type: normalizeTransactionType(row.type),
        amount: normalizeAmount(row.amount),
        category: String(row.category || '').trim().toLowerCase()
    };
}

class TransactionService {
    constructor() {
        this.db = DatabaseSingleton.getInstance();
    }

    /**
     * Add a new transaction
     */
    async addTransaction(userId, accountId, transaction) {
        try {
            const {
                type,
                amount,
                category,
                description,
                transactionDate
            } = transaction;
            const normalizedType = normalizeTransactionType(type);
            const normalizedAmount = normalizeAmount(amount);

            const query = `
                INSERT INTO transactions 
                (user_id, account_id, type, amount, category, description, transaction_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await this.db.query(query, [
                userId,
                accountId,
                normalizedType,
                normalizedAmount,
                category,
                description,
                transactionDate
            ]);

            return {
                success: true,
                transactionId: result.insertId,
                message: 'Transaction added successfully'
            };
        } catch (error) {
            console.error('Error adding transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update an existing transaction. Scoped to userId so one user can never
     * edit another user's transaction, even by guessing an id.
     */
    async updateTransaction(transactionId, userId, transaction) {
        try {
            const { type, amount, category, description, transactionDate } = transaction;
            const normalizedType = normalizeTransactionType(type);
            const normalizedAmount = normalizeAmount(amount);

            const result = await this.db.query(
                `UPDATE transactions
                 SET type = ?, amount = ?, category = ?, description = ?, transaction_date = ?
                 WHERE id = ? AND user_id = ?`,
                [normalizedType, normalizedAmount, category, description, transactionDate, transactionId, userId]
            );

            if (result.affectedRows === 0) {
                return { success: false, error: 'Transaction not found.' };
            }

            return { success: true, message: 'Transaction updated successfully' };
        } catch (error) {
            console.error('Error updating transaction:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all transactions for a user
     */
    async getUserTransactions(userId, filters = {}) {
        try {
            let query = `
                SELECT t.*, a.name as account_name, a.type as account_type
                FROM transactions t
                LEFT JOIN accounts a ON t.account_id = a.id
                WHERE t.user_id = ?
            `;

            const params = [userId];

            if (filters.type) {
                query += ` AND t.type = ?`;
                params.push(filters.type);
            }

            if (filters.category) {
                query += ` AND t.category = ?`;
                params.push(filters.category);
            }

            if (filters.startDate && filters.endDate) {
                query += ` AND t.transaction_date BETWEEN ? AND ?`;
                params.push(filters.startDate, filters.endDate);
            }

            query += ` ORDER BY t.transaction_date DESC`;

            const limit = Number(filters.limit);
            const offset = Number(filters.offset);
            if (Number.isFinite(limit) && limit > 0) {
                query += ` LIMIT ?`;
                params.push(limit);
                if (Number.isFinite(offset) && offset >= 0) {
                    query += ` OFFSET ?`;
                    params.push(offset);
                }
            }

            const results = await this.db.query(query, params);
            return {
                success: true,
                transactions: results.map(normalizeTransactionRow),
                count: results.length
            };
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get category-wise spending breakdown
     */
    async getCategoryBreakdown(userId, month = null) {
        try {
            let query = `
                SELECT 
                    category,
                    type,
                    COUNT(*) as count,
                    SUM(amount) as total
                FROM transactions
                WHERE user_id = ? AND LOWER(type) = 'expense'
            `;

            const params = [userId];

            if (month) {
                query += ` AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`;
                params.push(month);
            }

            query += ` GROUP BY category, type ORDER BY total DESC`;

            const results = await this.db.query(query, params);
            return {
                success: true,
                breakdown: results.map(row => ({
                    ...row,
                    type: normalizeTransactionType(row.type),
                    total: normalizeAmount(row.total),
                    category: String(row.category || '').trim().toLowerCase()
                }))
            };
        } catch (error) {
            console.error('Error getting category breakdown:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get monthly summary
     */
    async getMonthlySummary(userId, month) {
        try {
            const query = `
                SELECT 
                    type,
                    COUNT(*) as count,
                    SUM(amount) as total
                FROM transactions
                WHERE user_id = ? 
                    AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
                GROUP BY type
            `;

            const results = await this.db.query(query, [userId, month]);

            const summary = {
                month: month,
                income: 0,
                expenses: 0,
                investments: 0,
                savings: 0,
                netSavings: 0
            };

            results.forEach(row => {
                const normalizedType = normalizeTransactionType(row.type);
                const normalizedTotal = normalizeAmount(row.total);

                if (normalizedType === 'income') summary.income = normalizedTotal;
                if (normalizedType === 'expense') summary.expenses = normalizedTotal;
                if (normalizedType === 'investment') summary.investments = normalizedTotal;
                if (normalizedType === 'savings') summary.savings = normalizedTotal;
            });

            summary.netSavings = summary.income - summary.expenses;
            summary.savingsRate = summary.income > 0 
                ? ((summary.netSavings / summary.income) * 100).toFixed(2)
                : 0;

            return {
                success: true,
                summary: summary
            };
        } catch (error) {
            console.error('Error getting monthly summary:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete a transaction
     */
    async deleteTransaction(transactionId, userId) {
        try {
            const query = `DELETE FROM transactions WHERE id = ? AND user_id = ?`;
            await this.db.query(query, [transactionId, userId]);

            return {
                success: true,
                message: 'Transaction deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * GOAL TRACKER SERVICE - Handle financial goals
 */
class GoalTrackerService {
    constructor() {
        this.db = DatabaseSingleton.getInstance();
    }

    /**
     * Create a financial goal
     */
    async createGoal(userId, goal) {
        try {
            const { name, targetAmount, deadline } = goal;

            const query = `
                INSERT INTO financial_goals 
                (user_id, name, target_amount, deadline)
                VALUES (?, ?, ?, ?)
            `;

            const result = await this.db.query(query, [
                userId,
                name,
                targetAmount,
                deadline
            ]);

            return {
                success: true,
                goalId: result.insertId,
                message: 'Goal created successfully'
            };
        } catch (error) {
            console.error('Error creating goal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all goals for a user
     */
    async getUserGoals(userId) {
        try {
            const query = `
                SELECT *
                FROM financial_goals
                WHERE user_id = ?
                ORDER BY deadline ASC
            `;

            const results = await this.db.query(query, [userId]);

            // Calculate progress percentage
            const goals = results.map(goal => ({
                ...goal,
                current_amount: goal.current_amount || 0,
                progressPercentage: Math.min(((goal.current_amount || 0) / goal.target_amount * 100), 100).toFixed(2),
                remainingAmount: Math.max((goal.target_amount - (goal.current_amount || 0)), 0).toFixed(2),
                daysRemaining: this._calculateDaysRemaining(goal.deadline)
            }));

            return {
                success: true,
                goals: goals
            };
        } catch (error) {
            console.error('Error fetching goals:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update goal progress
     */
    async updateGoalProgress(goalId, userId, currentAmount) {
        try {
            const query = `
                UPDATE financial_goals
                SET current_amount = ?
                WHERE id = ? AND user_id = ?
            `;

            await this.db.query(query, [currentAmount, goalId, userId]);

            // Check if goal is completed
            const goalQuery = `SELECT target_amount, current_amount FROM financial_goals WHERE id = ?`;
            const [goal] = await this.db.query(goalQuery, [goalId]);

            if (goal && currentAmount >= goal.target_amount) {
                await this.db.query(
                    `UPDATE financial_goals SET status = 'completed' WHERE id = ?`,
                    [goalId]
                );
            }

            return {
                success: true,
                message: 'Goal progress updated'
            };
        } catch (error) {
            console.error('Error updating goal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete a goal
     */
    async deleteGoal(goalId, userId) {
        try {
            const query = `DELETE FROM financial_goals WHERE id = ? AND user_id = ?`;
            await this.db.query(query, [goalId, userId]);

            return {
                success: true,
                message: 'Goal deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting goal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper: Calculate days remaining until deadline
     */
    _calculateDaysRemaining(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const difference = deadlineDate - today;
        return Math.ceil(difference / (1000 * 60 * 60 * 24));
    }
}

/**
 * mysql2 returns DATE columns as JS Date objects anchored to local midnight
 * (not UTC midnight), so all date math here must use local getters/setters —
 * mixing in UTC ones would silently shift the calendar day.
 */
function formatDateForSQL(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Advance a date by one interval. Monthly steps clamp to the target month's
 * length (e.g. Jan 31 -> Feb 28/29, not Mar 3 like a naive setMonth() would
 * produce).
 */
function addInterval(date, frequency) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);

    if (frequency === 'daily') {
        next.setDate(next.getDate() + 1);
        return next;
    }

    const originalDay = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const daysInTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(originalDay, daysInTargetMonth));
    return next;
}

/**
 * RECURRING TRANSACTION SERVICE
 * Lets a user schedule a transaction that repeats daily or monthly, and
 * materializes due occurrences into `transactions` as real time passes
 * (there is no background worker in this app, so this runs lazily whenever
 * a user's transactions are fetched — see processDue()).
 */
class RecurringTransactionService {
    constructor() {
        this.db = DatabaseSingleton.getInstance();
    }

    async createRule(userId, accountId, rule) {
        try {
            const { type, amount, category, description, frequency, startDate } = rule;
            const normalizedType = normalizeTransactionType(type);
            const normalizedAmount = normalizeAmount(amount);

            const result = await this.db.query(
                `INSERT INTO recurring_transactions
                 (user_id, account_id, type, amount, category, description, frequency, next_run_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, accountId, normalizedType, normalizedAmount, category, description, frequency, startDate]
            );

            return { success: true, ruleId: result.insertId, message: 'Recurring transaction scheduled' };
        } catch (error) {
            console.error('Error creating recurring rule:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserRules(userId) {
        try {
            const results = await this.db.query(
                `SELECT * FROM recurring_transactions WHERE user_id = ? AND active = 1 ORDER BY next_run_date ASC`,
                [userId]
            );
            return { success: true, rules: results.map(normalizeTransactionRow) };
        } catch (error) {
            console.error('Error fetching recurring rules:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteRule(ruleId, userId) {
        try {
            await this.db.query(
                `DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?`,
                [ruleId, userId]
            );
            return { success: true, message: 'Recurring transaction cancelled' };
        } catch (error) {
            console.error('Error deleting recurring rule:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Materialize any occurrences due as of today. Catches up on missed
     * periods (e.g. the app wasn't opened for 2 months) rather than
     * skipping them, capped so a stale rule can't loop unboundedly.
     */
    async processDue(userId) {
        const MAX_OCCURRENCES_PER_RULE = 366;

        try {
            const dueRules = await this.db.query(
                `SELECT * FROM recurring_transactions
                 WHERE user_id = ? AND active = 1 AND next_run_date <= CURDATE()`,
                [userId]
            );

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const rule of dueRules) {
                let nextRun = new Date(rule.next_run_date);
                nextRun.setHours(0, 0, 0, 0);
                let occurrences = 0;

                while (nextRun <= today && occurrences < MAX_OCCURRENCES_PER_RULE) {
                    await this.db.query(
                        `INSERT INTO transactions
                         (user_id, account_id, type, amount, category, description, transaction_date)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [userId, rule.account_id, rule.type, rule.amount, rule.category, rule.description, formatDateForSQL(nextRun)]
                    );
                    nextRun = addInterval(nextRun, rule.frequency);
                    occurrences += 1;
                }

                await this.db.query(
                    `UPDATE recurring_transactions SET next_run_date = ? WHERE id = ?`,
                    [formatDateForSQL(nextRun), rule.id]
                );
            }

            return { success: true, processedRules: dueRules.length };
        } catch (error) {
            console.error('Error processing recurring transactions:', error);
            return { success: false, error: error.message };
        }
    }
}

/**
 * Pure calculation, kept separate from the DB-touching service so it's
 * trivial to unit test and reuse (e.g. if per-category budgets are added later).
 */
function calculateBudgetUsage(budgetAmount, spent) {
    const amount = normalizeAmount(budgetAmount);
    const spentAmount = normalizeAmount(spent);
    const remaining = amount - spentAmount;
    const percentageUsed = amount > 0 ? (spentAmount / amount) * 100 : 0;

    let status = 'healthy';
    if (percentageUsed >= 100) status = 'exceeded';
    else if (percentageUsed >= 80) status = 'near-limit';

    return {
        amount,
        spent: spentAmount,
        remaining,
        percentageUsed: Math.round(percentageUsed * 10) / 10,
        overBudgetAmount: remaining < 0 ? Math.abs(remaining) : 0,
        status
    };
}

/**
 * MONTHLY BUDGET SERVICE
 * One overall budget amount per user per calendar month (not per-category —
 * kept simple per the current scope). "Spent" is summed from expense
 * transactions in that month, so it always reflects real transaction data.
 */
class BudgetService {
    constructor() {
        this.db = DatabaseSingleton.getInstance();
    }

    async setBudget(userId, month, amount) {
        try {
            await this.db.query(
                `INSERT INTO budgets (user_id, month, amount)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE amount = ?`,
                [userId, month, amount, amount]
            );
            return { success: true };
        } catch (error) {
            console.error('Error setting budget:', error);
            return { success: false, error: error.message };
        }
    }

    async getBudgetSummary(userId, month) {
        try {
            const [budgetRows, spentRows] = await Promise.all([
                this.db.query('SELECT amount FROM budgets WHERE user_id = ? AND month = ?', [userId, month]),
                this.db.query(
                    `SELECT COALESCE(SUM(amount), 0) AS spent
                     FROM transactions
                     WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
                    [userId, month]
                )
            ]);

            const budgetAmount = budgetRows.length > 0 ? budgetRows[0].amount : 0;
            const spent = spentRows[0]?.spent || 0;

            return {
                success: true,
                month,
                hasBudget: budgetRows.length > 0,
                ...calculateBudgetUsage(budgetAmount, spent)
            };
        } catch (error) {
            console.error('Error getting budget summary:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = {
    TransactionService,
    GoalTrackerService,
    RecurringTransactionService,
    BudgetService,
    calculateBudgetUsage
};
