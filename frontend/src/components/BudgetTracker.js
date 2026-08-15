import React, { useState, useEffect } from 'react';
import { money, percent } from '../utils';

const STATUS_LABEL = {
  healthy: 'Healthy',
  'near-limit': 'Near Limit',
  exceeded: 'Exceeded'
};

function BudgetTracker({ budget, onSetBudget }) {
  const [editing, setEditing] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    if (budget?.hasBudget) setAmountInput(String(budget.amount));
  }, [budget]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;
    onSetBudget(amount);
    setEditing(false);
  };

  if (!budget) {
    return (
      <div className="section">
        <h2>Monthly Budget</h2>
        <p className="empty-state">Loading budget…</p>
      </div>
    );
  }

  const showForm = !budget.hasBudget || editing;

  return (
    <div className="section">
      <div className="section-header">
        <h2>Monthly Budget</h2>
        {budget.hasBudget && !editing && (
          <button className="btn-export" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {showForm ? (
        <form className="form budget-set-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="budget-amount">
              {budget.hasBudget ? 'Update this month\'s budget' : 'Set a budget for this month'}
            </label>
            <input
              id="budget-amount"
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g., 50000"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save Budget</button>
            {budget.hasBudget && (
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            )}
          </div>
        </form>
      ) : (
        <>
          <div className="budget-summary-row">
            <span>Budget: <strong>{money(budget.amount)}</strong></span>
            <span className={`badge budget-status-${budget.status}`}>{STATUS_LABEL[budget.status]}</span>
          </div>
          <div className="goal-progress">
            <div
              className={`progress-bar budget-bar-${budget.status}`}
              style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
            />
          </div>
          <p className="budget-detail">
            Spent {money(budget.spent)} of {money(budget.amount)} ({percent(budget.percentageUsed)}%)
          </p>
          <p className="budget-detail">
            {budget.remaining >= 0
              ? `${money(budget.remaining)} remaining this month.`
              : `Over budget by ${money(budget.overBudgetAmount)}.`}
          </p>
        </>
      )}
    </div>
  );
}

export default BudgetTracker;
