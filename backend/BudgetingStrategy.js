/**
 * STRATEGY PATTERN - BUDGETING STRATEGIES
 * Implements different budgeting approaches that can be switched at runtime
 */

// Abstract Strategy Interface
class BudgetingStrategy {
    calculateBudget(income) {
        throw new Error('calculateBudget() must be implemented');
    }

    getRecommendations(income, expenses) {
        throw new Error('getRecommendations() must be implemented');
    }
}

// Strategy 1: Zero-Based Budgeting
class ZeroBasedBudgetingStrategy extends BudgetingStrategy {
    /**
     * In zero-based budgeting, income - expenses = 0
     * Every dollar is assigned a specific purpose
     */
    calculateBudget(income) {
        return {
            strategy: 'Zero-Based Budgeting',
            totalIncome: income,
            allocation: {
                necessities: income * 0.50,  // Housing, utilities, food
                wants: income * 0.30,        // Entertainment, dining
                savings: income * 0.20       // Emergency fund, investments
            }
        };
    }

    getRecommendations(income, expenses) {
        const budget = this.calculateBudget(income);
        const recommendations = [];

        // Check if spending exceeds allocations
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        if (totalExpenses > income) {
            recommendations.push({
                priority: 'high',
                message: 'WARNING: Total expenses exceed income. Implement strict zero-based budgeting.'
            });
        }

        recommendations.push({
            priority: 'medium',
            message: 'Track every expense to ensure allocation matches budget categories.'
        });

        return recommendations;
    }
}

// Strategy 2: 50/30/20 Rule
class FiftyThirtyTwentyStrategy extends BudgetingStrategy {
    /**
     * 50% - Needs (housing, food, utilities)
     * 30% - Wants (entertainment, dining out)
     * 20% - Savings & Debt
     */
    calculateBudget(income) {
        return {
            strategy: '50/30/20 Rule',
            totalIncome: income,
            allocation: {
                needs: income * 0.50,
                wants: income * 0.30,
                savings: income * 0.20
            }
        };
    }

    getRecommendations(income, expenses) {
        const budget = this.calculateBudget(income);
        const recommendations = [];

        // Categorize expenses
        const categories = {
            needs: 0,
            wants: 0,
            savings: 0
        };

        expenses.forEach(expense => {
            if (['food', 'housing', 'utilities', 'healthcare'].includes(expense.category)) {
                categories.needs += expense.amount;
            } else if (['entertainment', 'dining', 'shopping'].includes(expense.category)) {
                categories.wants += expense.amount;
            } else {
                categories.savings += expense.amount;
            }
        });

        // Generate recommendations
        if (categories.needs > budget.allocation.needs) {
            recommendations.push({
                priority: 'high',
                message: `Needs spending (${((categories.needs/income)*100).toFixed(1)}%) exceeds 50% allocation.`
            });
        }

        if (categories.wants > budget.allocation.wants) {
            recommendations.push({
                priority: 'medium',
                message: `Wants spending (${((categories.wants/income)*100).toFixed(1)}%) exceeds 30% allocation. Consider cutting discretionary expenses.`
            });
        }

        if (categories.savings < budget.allocation.savings) {
            recommendations.push({
                priority: 'high',
                message: `Savings are only ${((categories.savings/income)*100).toFixed(1)}%. Aim for 20% allocation.`
            });
        }

        return recommendations;
    }
}

// Strategy 3: Custom Percentage Strategy
class CustomPercentageStrategy extends BudgetingStrategy {
    constructor(customAllocation = {}) {
        super();
        this.customAllocation = {
            necessities: customAllocation.necessities || 0.50,
            wants: customAllocation.wants || 0.30,
            savings: customAllocation.savings || 0.20,
            investments: customAllocation.investments || 0.00
        };
    }

    calculateBudget(income) {
        return {
            strategy: 'Custom Percentage Strategy',
            totalIncome: income,
            allocation: {
                necessities: income * this.customAllocation.necessities,
                wants: income * this.customAllocation.wants,
                savings: income * this.customAllocation.savings,
                investments: income * this.customAllocation.investments
            }
        };
    }

    getRecommendations(income, expenses) {
        const budget = this.calculateBudget(income);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const recommendations = [];

        const allocation = budget.allocation;
        const totalAllocated = Object.values(allocation).reduce((a, b) => a + b, 0);

        if (totalExpenses > totalAllocated) {
            recommendations.push({
                priority: 'high',
                message: `Spending exceeds budget by $${(totalExpenses - totalAllocated).toFixed(2)}`
            });
        }

        recommendations.push({
            priority: 'medium',
            message: 'Review custom allocation percentages quarterly to ensure they still match your goals.'
        });

        return recommendations;
    }
}

// Budget Context - uses the strategy pattern
class BudgetPlanner {
    constructor(strategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy) {
        this.strategy = strategy;
    }

    getBudget(income) {
        return this.strategy.calculateBudget(income);
    }

    getRecommendations(income, expenses) {
        return this.strategy.getRecommendations(income, expenses);
    }
}

module.exports = {
    BudgetingStrategy,
    ZeroBasedBudgetingStrategy,
    FiftyThirtyTwentyStrategy,
    CustomPercentageStrategy,
    BudgetPlanner
};
