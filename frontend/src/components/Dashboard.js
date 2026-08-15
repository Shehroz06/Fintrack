import React from 'react';
import { money, monthKey } from '../utils';

function Dashboard({ transactions, financialState }) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthKey = monthKey(new Date());
  const currentMonthExpenses = transactions
    .filter(t => t.type === 'expense' && monthKey(t.transaction_date) === currentMonthKey)
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  const cards = [
    { label: 'Current Balance', value: money(currentBalance), cls: currentBalance >= 0 ? 'savings' : 'expense' },
    { label: 'Total Income', value: money(totalIncome), cls: 'income' },
    { label: 'Total Expenses', value: money(totalExpenses), cls: 'expense' },
    { label: "This Month's Expenses", value: money(currentMonthExpenses), cls: 'expense' },
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
