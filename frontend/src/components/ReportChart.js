import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { money, monthKey } from '../utils';

const CHART_COLORS = ['#667eea', '#48bb78', '#f6ad55', '#f56565', '#764ba2', '#4299e1', '#ed8936', '#38b2ac'];

const CURRENCY_FORMATTER = (value) => `Rs. ${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

function buildMonthlyData(transactions) {
  const map = {};
  transactions.forEach(t => {
    if (!t.transaction_date) return;
    const month = monthKey(t.transaction_date); // YYYY-MM, in local time
    if (!map[month]) map[month] = { month, income: 0, expenses: 0, savings: 0 };
    if (t.type === 'income') map[month].income += t.amount;
    if (t.type === 'expense') map[month].expenses += t.amount;
    if (t.type === 'savings' || t.type === 'investment') map[month].savings += t.amount;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
}

function buildCategoryData(transactions) {
  const map = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {money(p.value)}
        </p>
      ))}
    </div>
  );
};

const CustomTooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p style={{ color: payload[0].payload.fill }}>
        {payload[0].name}: {money(payload[0].value)}
      </p>
    </div>
  );
};

function ReportChart({ transactions, periodTransactions, periodLabel, goals }) {
  const monthlyData = useMemo(() => buildMonthlyData(transactions), [transactions]);
  const categoryData = useMemo(() => buildCategoryData(periodTransactions), [periodTransactions]);

  const totalExpenses = categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="reports">

      <div className="section">
        <h2>Monthly Income vs Expenses</h2>
        {monthlyData.length === 0 ? (
          <p className="empty-state">No transaction data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={CURRENCY_FORMATTER} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltipBar />} />
              <Legend />
              <Bar dataKey="income"   name="Income"   fill="#48bb78" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f56565" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings"  name="Invested/Saved" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="section">
        <h2>Spending by Category — {periodLabel}</h2>
        {categoryData.length === 0 ? (
          <p className="empty-state">No expense transactions in this period.</p>
        ) : (
          <div className="pie-row">
            <ResponsiveContainer width="50%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pie-legend">
              {categoryData.map((item, i) => (
                <div key={item.name} className="pie-legend-item">
                  <span className="pie-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="pie-name">{item.name}</span>
                  <span className="pie-amount">{money(item.value)}</span>
                  <span className="pie-pct">
                    {totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <h2>Goal Progress</h2>
        {!goals || goals.length === 0 ? (
          <p className="empty-state">No goals created yet.</p>
        ) : (
          <div className="goals-report">
            {goals.map((goal) => (
              <div key={goal.id} className="goal-report-item">
                <h4>{goal.name}</h4>
                <div className="progress-wrapper">
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${goal.progressPercentage}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {goal.progressPercentage}% — {money(goal.current_amount)} of {money(goal.target_amount)}
                  </span>
                </div>
                {goal.daysRemaining > 0 && (
                  <p className="goal-days">{goal.daysRemaining} days remaining</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default ReportChart;
