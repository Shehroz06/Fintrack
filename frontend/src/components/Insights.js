import React, { useMemo } from 'react';
import { money, monthKey } from '../utils';

function sumByType(transactions, type) {
  return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
}

function computeInsights(transactions) {
  const now = new Date();
  const thisMonthKey = monthKey(now);
  const lastMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const thisMonthTxns = transactions.filter(t => monthKey(t.transaction_date) === thisMonthKey);
  const lastMonthTxns = transactions.filter(t => monthKey(t.transaction_date) === lastMonthKey);

  const thisMonthIncome = sumByType(thisMonthTxns, 'income');
  const thisMonthExpenses = sumByType(thisMonthTxns, 'expense');
  const lastMonthExpenses = sumByType(lastMonthTxns, 'expense');
  const savedThisMonth = thisMonthIncome - thisMonthExpenses;

  const insights = [
    savedThisMonth >= 0
      ? `You saved ${money(savedThisMonth)} this month.`
      : `You spent ${money(Math.abs(savedThisMonth))} more than you earned this month.`
  ];

  if (lastMonthExpenses > 0) {
    const change = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
    const direction = change >= 0 ? 'increased' : 'decreased';
    insights.push(`Your expenses ${direction} ${Math.abs(change).toFixed(0)}% compared to last month.`);
  }

  const categorySpending = {};
  thisMonthTxns.filter(t => t.type === 'expense').forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });
  const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    const [name] = topCategory;
    insights.push(`Your highest spending category this month is ${name.charAt(0).toUpperCase() + name.slice(1)}.`);
  }

  return insights;
}

function Insights({ transactions }) {
  const insights = useMemo(() => computeInsights(transactions), [transactions]);

  return (
    <div className="section">
      <h2>Insights</h2>
      {transactions.length === 0 ? (
        <p className="empty-state">Add some transactions to see insights here.</p>
      ) : (
        <ul className="insights-list">
          {insights.map((text, i) => <li key={i}>{text}</li>)}
        </ul>
      )}
    </div>
  );
}

export default Insights;
