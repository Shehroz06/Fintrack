import React from 'react';
import { money, percent } from '../utils';

function Dashboard({ transactions, goals, financialState }) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInvested = transactions
    .filter(t => t.type === 'investment')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const activeGoals = goals ? goals.filter(g => g.status === 'active').length : 0;

  const cards = [
    { label: 'Total Income', value: `$${money(totalIncome)}`, cls: 'income' },
    { label: 'Total Expenses', value: `$${money(totalExpenses)}`, cls: 'expense' },
    { label: 'Net Savings', value: `$${money(netSavings)}`, cls: netSavings >= 0 ? 'savings' : 'expense' },
    { label: 'Savings Rate', value: `${percent(savingsRate)}%`, cls: '' },
    { label: 'Total Invested', value: `$${money(totalInvested)}`, cls: '' },
    { label: 'Active Goals', value: activeGoals, cls: '' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {cards.map(({ label, value, cls }) => (
          <div key={label} className="dashboard-card">
            <h3>{label}</h3>
            <p className={`large-number ${cls}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="dashboard-footer">
        <p className="financial-state">
          Current Mode: <strong>{financialState}</strong>
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
