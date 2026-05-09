import React from 'react';

function ReportChart({ transactions, goals }) {
  const money = (value) => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00';
  };

  const categorySpending = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="reports">
      <div className="section">
        <h2>📊 Expense Breakdown</h2>
        <div className="chart-container">
          {Object.entries(categorySpending).map(([category, amount]) => (
            <div key={category} className="chart-bar-item">
              <div className="category-name">{category}</div>
              <div className="chart-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${totalExpenses > 0 ? (amount / totalExpenses * 100) : 0}%`
                  }}
                ></div>
              </div>
              <div className="amount">${money(amount)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>🎯 Goal Progress</h2>
        <div className="goals-report">
          {goals && goals.map((goal, idx) => (
            <div key={idx} className="goal-report-item">
              <h4>{goal.name}</h4>
              <div className="progress-wrapper">
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${goal.progressPercentage}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {goal.progressPercentage}% (${money(goal.current_amount)} / ${money(goal.target_amount)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportChart;
