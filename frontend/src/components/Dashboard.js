import React from 'react';

function Dashboard({ transactions, goals, portfolio, financialState }) {
  const money = (value) => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00';
  };

  const percent = (value) => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const activeGoals = goals ? goals.filter(g => g.status === 'active').length : 0;
  const portfolioValue = portfolio ? portfolio.totalBalance : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Income</h3>
          <p className="large-number income">${money(totalIncome)}</p>
        </div>
        <div className="dashboard-card">
          <h3>Total Expenses</h3>
          <p className="large-number expense">${money(totalExpenses)}</p>
        </div>
        <div className="dashboard-card">
          <h3>Net Savings</h3>
          <p className="large-number savings">${money(netSavings)}</p>
        </div>
        <div className="dashboard-card">
          <h3>Savings Rate</h3>
          <p className="large-number">{percent(savingsRate)}%</p>
        </div>
        <div className="dashboard-card">
          <h3>Portfolio Value</h3>
          <p className="large-number">${money(portfolioValue)}</p>
        </div>
        <div className="dashboard-card">
          <h3>Active Goals</h3>
          <p className="large-number">{activeGoals}</p>
        </div>
      </div>

      <div className="dashboard-footer">
        <p className="financial-state">
          Current Mode: <strong>{financialState}</strong>
        </p>
      </div>
    </div>
  );
}

// ==================== TRANSACTION FORM ====================

export default Dashboard;
