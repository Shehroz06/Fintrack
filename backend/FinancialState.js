/**
 * STATE PATTERN - FINANCIAL STATES
 * Allows different behavior based on current financial state
 * States: BudgetingState, SavingsState, InvestmentMode
 */

// Abstract State
class FinancialState {
    enter(context) {
        throw new Error('enter() must be implemented');
    }

    exit(context) {
        throw new Error('exit() must be implemented');
    }

    getRecommendations(context) {
        throw new Error('getRecommendations() must be implemented');
    }

    processTransaction(context, transaction) {
        throw new Error('processTransaction() must be implemented');
    }

    getStateName() {
        throw new Error('getStateName() must be implemented');
    }
}

const money = (value) => {
    const numericValue = Number(value || 0);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return safeValue.toFixed(2);
};

const percent = (value) => {
    const numericValue = Number(value || 0);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return safeValue.toFixed(1);
};

// State 1: Budgeting Mode
class BudgetingState extends FinancialState {
    /**
     * In budgeting mode:
     * - Focus on tracking and controlling expenses
     * - Recommendations focus on reducing spending
     * - Alerts on overspending
     */

    enter(context) {
        console.log('📋 Entered BUDGETING MODE');
        context.mode = 'budgeting';
        context.focusArea = 'expense-control';
    }

    exit(context) {
        console.log('📋 Exiting BUDGETING MODE');
    }

    getRecommendations(context) {
        const recommendations = [];

        const totalExpenses = context.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalIncome = context.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        // Track by category
        const categorySpending = {};
        context.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
            });

        // Find highest spending category
        const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

        if (topCategory) {
            const percentage = percent((Number(topCategory[1]) / Number(totalExpenses)) * 100);
            recommendations.push({
                priority: 'high',
                category: 'budgeting',
                message: `Your highest expense is ${topCategory[0]} at $${money(topCategory[1])} (${percentage}% of total spending)`
            });

            if (percentage > 30) {
                recommendations.push({
                    priority: 'high',
                    category: 'budgeting',
                    action: `Consider reducing ${topCategory[0]} spending to 20-30% of budget`
                });
            }
        }

        // Overall spending ratio
        if (totalIncome > 0) {
            const savingsRate = percent(((Number(totalIncome) - Number(totalExpenses)) / Number(totalIncome)) * 100);
            recommendations.push({
                priority: 'medium',
                category: 'budgeting',
                message: `Current savings rate: ${savingsRate}%. Target: 20%+`
            });
        }

        return recommendations;
    }

    processTransaction(context, transaction) {
        const processed = {
            ...transaction,
            state: 'budgeting',
            tracked: true
        };

        // In budgeting mode, flag large expenses
        if (transaction.type === 'expense' && transaction.amount > 100) {
            processed.flag = 'LARGE_EXPENSE';
            processed.alert = true;
        }

        return processed;
    }

    getStateName() {
        return 'BUDGETING';
    }

    getStateDescription() {
        return 'Focus on tracking and controlling expenses';
    }
}

// State 2: Savings Mode
class SavingsState extends FinancialState {
    /**
     * In savings mode:
     * - Focus on maximizing savings rate
     * - Recommendations focus on increasing income/reducing expenses
     * - Track progress towards savings goals
     */

    enter(context) {
        console.log('💰 Entered SAVINGS MODE');
        context.mode = 'savings';
        context.focusArea = 'savings-accumulation';
    }

    exit(context) {
        console.log('💰 Exiting SAVINGS MODE');
    }

    getRecommendations(context) {
        const recommendations = [];

        const totalIncome = context.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = context.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const currentSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (currentSavings / totalIncome) * 100 : 0;

        // Encourage high savings
        if (savingsRate >= 20) {
            recommendations.push({
                priority: 'low',
                category: 'savings',
                message: `✅ Great job! Your savings rate is ${percent(savingsRate)}%`
            });
        } else {
            recommendations.push({
                priority: 'high',
                category: 'savings',
                message: `Your savings rate is ${percent(savingsRate)}%. Target: 20%+`,
                action: 'Reduce discretionary spending to increase savings'
            });
        }

        // Goal tracking
        if (context.savingsGoals && context.savingsGoals.length > 0) {
            const activeGoals = context.savingsGoals.filter(g => g.status === 'active');
            recommendations.push({
                priority: 'medium',
                category: 'savings',
                message: `You have ${activeGoals.length} active savings goals. Current savings: $${money(currentSavings)}`
            });
        }

        // Emergency fund check
        if (context.emergencyFund) {
            const fundPercentage = (context.emergencyFund / (totalExpenses * 6)) * 100;
            if (fundPercentage < 100) {
                recommendations.push({
                    priority: 'high',
                    category: 'savings',
                    message: `Emergency fund is ${Math.round(Number(fundPercentage || 0))}% funded. Target: 6 months expenses`
                });
            }
        }

        return recommendations;
    }

    processTransaction(context, transaction) {
        const processed = {
            ...transaction,
            state: 'savings',
            tracked: true
        };

        // In savings mode, track all income and categorize expenses by priority
        if (transaction.type === 'income') {
            processed.priority = 'HIGH';
            processed.action = 'Allocate to savings goal';
        }

        if (transaction.type === 'expense') {
            processed.isEssential = ['food', 'housing', 'utilities', 'healthcare'].includes(transaction.category);
        }

        return processed;
    }

    getStateName() {
        return 'SAVINGS';
    }

    getStateDescription() {
        return 'Focus on maximizing savings and building financial security';
    }
}

// State 3: Investment Mode
class InvestmentState extends FinancialState {
    /**
     * In investment mode:
     * - Focus on growing wealth through investments
     * - Recommendations focus on investment opportunities
     * - Portfolio rebalancing suggestions
     */

    enter(context) {
        console.log('📈 Entered INVESTMENT MODE');
        context.mode = 'investment';
        context.focusArea = 'wealth-growth';
    }

    exit(context) {
        console.log('📈 Exiting INVESTMENT MODE');
    }

    getRecommendations(context) {
        const recommendations = [];

        const totalIncome = context.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const investmentAmount = context.transactions
            .filter(t => t.type === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);

        const investmentRate = totalIncome > 0 ? (investmentAmount / totalIncome) * 100 : 0;

        // Investment recommendations
        if (investmentRate < 10) {
            recommendations.push({
                priority: 'high',
                category: 'investment',
                message: `Current investment rate: ${percent(investmentRate)}%. Consider increasing to 10-15%`,
                action: 'Open a brokerage account or increase existing investments'
            });
        } else if (investmentRate >= 10) {
            recommendations.push({
                priority: 'low',
                category: 'investment',
                message: `✅ Good investment rate: ${percent(investmentRate)}%`
            });
        }

        // Portfolio diversification
        if (context.portfolio && context.portfolio.accounts) {
            const accountTypes = {};
            context.portfolio.accounts.forEach(acc => {
                accountTypes[acc.type] = (accountTypes[acc.type] || 0) + acc.balance;
            });

            recommendations.push({
                priority: 'medium',
                category: 'investment',
                message: 'Portfolio Breakdown:',
                breakdown: accountTypes
            });

            // Suggest rebalancing
            if (!accountTypes['investment'] || accountTypes['investment'] < investmentAmount * 0.5) {
                recommendations.push({
                    priority: 'medium',
                    category: 'investment',
                    action: 'Consider rebalancing: increase investment account allocation'
                });
            }
        }

        // Long-term wealth building
        recommendations.push({
            priority: 'low',
            category: 'investment',
            message: 'Focus on consistent, long-term investing. Compound growth takes time.'
        });

        return recommendations;
    }

    processTransaction(context, transaction) {
        const processed = {
            ...transaction,
            state: 'investment',
            tracked: true
        };

        // In investment mode, prioritize investment transactions
        if (transaction.type === 'investment') {
            processed.priority = 'HIGH';
            processed.requiresAction = false;
        }

        return processed;
    }

    getStateName() {
        return 'INVESTMENT';
    }

    getStateDescription() {
        return 'Focus on growing wealth through strategic investments';
    }
}

// Context: User Financial State Manager
class FinancialStateManager {
    constructor() {
        this.currentState = null;
        this.transactions = [];
        this.savingsGoals = [];
        this.portfolio = null;
        this.emergencyFund = 0;
        this.mode = null;
        this.focusArea = null;
    }

    setState(state) {
        if (this.currentState) {
            this.currentState.exit(this);
        }
        this.currentState = state;
        this.currentState.enter(this);
    }

    // Transition methods
    switchToBudgetingMode() {
        this.setState(new BudgetingState());
    }

    switchToSavingsMode() {
        this.setState(new SavingsState());
    }

    switchToInvestmentMode() {
        this.setState(new InvestmentState());
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
        return this.currentState.processTransaction(this, transaction);
    }

    getRecommendations() {
        if (!this.currentState) {
            return { error: 'No state set. Please select a financial mode.' };
        }
        return {
            currentState: this.currentState.getStateName(),
            description: this.currentState.getStateDescription(),
            recommendations: this.currentState.getRecommendations(this)
        };
    }

    getCurrentState() {
        return this.currentState ? this.currentState.getStateName() : 'NONE';
    }

    getAvailableStates() {
        return [
            { id: 'BUDGETING', name: 'Budgeting Mode', description: 'Focus on tracking and controlling expenses' },
            { id: 'SAVINGS', name: 'Savings Mode', description: 'Focus on maximizing savings and building financial security' },
            { id: 'INVESTMENT', name: 'Investment Mode', description: 'Focus on growing wealth through strategic investments' }
        ];
    }
}

module.exports = {
    FinancialState,
    BudgetingState,
    SavingsState,
    InvestmentState,
    FinancialStateManager
};
