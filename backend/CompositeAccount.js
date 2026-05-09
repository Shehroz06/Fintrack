/**
 * COMPOSITE PATTERN - ACCOUNT HIERARCHY
 * Allows treating individual accounts and compositions of accounts uniformly
 */

// Abstract Component
class Account {
    constructor(id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type; // 'savings', 'checking', 'investment'
    }

    getBalance() {
        throw new Error('getBalance() must be implemented');
    }

    addTransaction(transaction) {
        throw new Error('addTransaction() must be implemented');
    }

    getTransactions() {
        throw new Error('getTransactions() must be implemented');
    }

    display(indent = 0) {
        throw new Error('display() must be implemented');
    }
}

// Leaf Component - Simple Account
class SimpleAccount extends Account {
    constructor(id, name, type, initialBalance = 0) {
        super(id, name, type);
        this.balance = initialBalance;
        this.transactions = [];
    }

    getBalance() {
        return this.balance;
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
        
        if (transaction.type === 'income' || transaction.type === 'investment') {
            this.balance += transaction.amount;
        } else {
            this.balance -= transaction.amount;
        }

        return {
            success: true,
            newBalance: this.balance,
            transaction: transaction
        };
    }

    getTransactions() {
        return this.transactions;
    }

    display(indent = 0) {
        const prefix = ' '.repeat(indent);
        return `${prefix}[${this.type}] ${this.name}: $${this.balance.toFixed(2)}`;
    }

    getAccountInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            balance: this.balance,
            transactionCount: this.transactions.length
        };
    }
}

// Composite Component - Account Group
class CompositeAccount extends Account {
    constructor(id, name, description = '') {
        super(id, name, 'portfolio');
        this.children = [];
        this.description = description;
    }

    addAccount(account) {
        if (!this.children.includes(account)) {
            this.children.push(account);
            return true;
        }
        return false;
    }

    removeAccount(account) {
        const index = this.children.indexOf(account);
        if (index > -1) {
            this.children.splice(index, 1);
            return true;
        }
        return false;
    }

    getBalance() {
        return this.children.reduce((total, account) => {
            return total + account.getBalance();
        }, 0);
    }

    addTransaction(transaction) {
        // Find appropriate account and add transaction
        // This delegates to child accounts
        throw new Error('Use addTransactionToAccount(accountIndex, transaction)');
    }

    addTransactionToAccount(accountIndex, transaction) {
        if (accountIndex >= 0 && accountIndex < this.children.length) {
            return this.children[accountIndex].addTransaction(transaction);
        }
        throw new Error('Invalid account index');
    }

    getTransactions() {
        return this.children.flatMap(account => account.getTransactions());
    }

    getChildren() {
        return this.children;
    }

    display(indent = 0) {
        const prefix = ' '.repeat(indent);
        let result = `${prefix}📊 Portfolio: ${this.name} (Total: $${this.getBalance().toFixed(2)})\n`;

        this.children.forEach(child => {
            result += child.display(indent + 2) + '\n';
        });

        return result;
    }

    getCompositeInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            totalBalance: this.getBalance(),
            accountCount: this.children.length,
            accounts: this.children.map(child => {
                if (child instanceof CompositeAccount) {
                    return child.getCompositeInfo();
                } else {
                    return child.getAccountInfo();
                }
            })
        };
    }

    // Get balance breakdown by account type
    getBalanceBreakdown() {
        const breakdown = {};

        const traverse = (account) => {
            if (account instanceof SimpleAccount) {
                if (!breakdown[account.type]) {
                    breakdown[account.type] = 0;
                }
                breakdown[account.type] += account.getBalance();
            } else if (account instanceof CompositeAccount) {
                account.children.forEach(child => traverse(child));
            }
        };

        this.children.forEach(child => traverse(child));
        return breakdown;
    }
}

// Portfolio Manager - uses Composite Pattern
class PortfolioManager {
    constructor() {
        this.portfolios = new Map();
    }

    createPortfolio(id, name, description) {
        const portfolio = new CompositeAccount(id, name, description);
        this.portfolios.set(id, portfolio);
        return portfolio;
    }

    getPortfolio(id) {
        return this.portfolios.get(id);
    }

    addAccountToPortfolio(portfolioId, account) {
        const portfolio = this.getPortfolio(portfolioId);
        if (portfolio) {
            portfolio.addAccount(account);
            return true;
        }
        return false;
    }

    getTotalPortfolioValue() {
        let total = 0;
        this.portfolios.forEach(portfolio => {
            total += portfolio.getBalance();
        });
        return total;
    }

    getAllPortfolios() {
        return Array.from(this.portfolios.values());
    }

    displayAllPortfolios() {
        let display = '\n=== YOUR FINANCIAL ACCOUNTS ===\n';
        this.portfolios.forEach(portfolio => {
            display += portfolio.display() + '\n';
        });
        display += `\nTotal Portfolio Value: $${this.getTotalPortfolioValue().toFixed(2)}\n`;
        return display;
    }
}

module.exports = {
    Account,
    SimpleAccount,
    CompositeAccount,
    PortfolioManager
};
