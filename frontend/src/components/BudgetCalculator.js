import React, { useState } from 'react';
import API from '../services/api';
import { money } from '../utils';

function BudgetCalculator() {
  const [income, setIncome] = useState('');
  const [strategy, setStrategy] = useState('fifty-thirty-twenty');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e) => {
    e.preventDefault();
    const num = parseFloat(income);
    if (!num || num <= 0) { setError('Enter a valid monthly income.'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await API.calculateBudget(strategy, num);
      if (data.success) setResult(data.budget);
      else setError(data.error || 'Failed to calculate budget.');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const strategyLabels = {
    'fifty-thirty-twenty': '50/30/20 Rule',
    'zero-based': 'Zero-Based Budgeting'
  };

  return (
    <div className="section">
      <h2>Budget Calculator</h2>
      <p style={{ marginBottom: 20, opacity: 0.7 }}>
        Enter your monthly income to see how to allocate it.
      </p>

      <form className="form budget-form" onSubmit={handleCalculate}>
        <div className="budget-inputs">
          <div className="form-group">
            <label htmlFor="budget-income">Monthly Income</label>
            <input
              id="budget-income"
              type="number"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder="e.g. 5000"
              min="1"
              step="1"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="budget-strategy">Strategy</label>
            <select
              id="budget-strategy"
              value={strategy}
              onChange={e => { setStrategy(e.target.value); setResult(null); }}
            >
              <option value="fifty-thirty-twenty">50/30/20 Rule</option>
              <option value="zero-based">Zero-Based Budgeting</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary budget-btn" disabled={loading}>
            {loading ? 'Calculating…' : 'Calculate'}
          </button>
        </div>
        {error && <p className="auth-error">{error}</p>}
      </form>

      {result && (
        <div className="budget-result">
          <h3>{strategyLabels[strategy]}</h3>
          <p className="budget-income-label">Monthly Income: <strong>${money(result.totalIncome)}</strong></p>
          <div className="budget-allocation">
            {Object.entries(result.allocation).map(([key, value]) => {
              const pct = result.totalIncome > 0 ? (value / result.totalIncome * 100).toFixed(0) : 0;
              return (
                <div key={key} className="budget-item">
                  <div className="budget-item-header">
                    <span className="budget-item-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span className="budget-item-amount">${money(value)}</span>
                  </div>
                  <div className="budget-bar-bg">
                    <div className="budget-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="budget-pct">{pct}% of income</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetCalculator;
