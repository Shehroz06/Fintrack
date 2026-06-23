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

module.exports = {
    TransactionService,
    GoalTrackerService
};
