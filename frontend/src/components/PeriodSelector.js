import React from 'react';
import { PERIOD_OPTIONS } from '../utils';

function PeriodSelector({ period, onChange }) {
  return (
    <div className="period-selector">
      {PERIOD_OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          className={`period-btn ${period === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default PeriodSelector;
