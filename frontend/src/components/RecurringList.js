import React from 'react';
import { money } from '../utils';

function RecurringList({ rules, onDelete }) {
  if (!rules || rules.length === 0) {
    return <p className="empty-state">No recurring transactions scheduled.</p>;
  }

  return (
    <div className="transactions-list">
      {rules.map((rule) => (
        <div key={rule.id} className="transaction-item">
          <span className="badge">{rule.frequency}</span>
          <span className="trans-desc">{rule.description}</span>
          <span className="trans-date">Next: {new Date(rule.next_run_date).toLocaleDateString()}</span>
          <span className={`trans-amount ${rule.type}`}>
            {rule.type === 'expense' ? '-' : '+'} {money(rule.amount)}
          </span>
          <button className="btn-delete" onClick={() => onDelete(rule.id)} title="Cancel">Cancel</button>
        </div>
      ))}
    </div>
  );
}

export default RecurringList;
