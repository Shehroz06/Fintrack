import React from 'react';

function FinancialStateDisplay({ currentState, onStateSwitch }) {
  const states = [
    { id: 'BUDGETING', name: 'Budgeting Mode' },
    { id: 'SAVINGS', name: 'Savings Mode' },
    { id: 'INVESTMENT', name: 'Investment Mode' }
  ];

  const displayState = states.find(state => state.id === currentState)?.name || currentState || 'NONE';

  return (
    <div className="financial-state-display">
      <h3>Select Your Financial Mode</h3>
      <div className="state-buttons">
        {states.map(state => (
          <button
            key={state.id}
            className={`state-btn ${currentState === state.id ? 'active' : ''}`}
            onClick={() => onStateSwitch(state.id)}
          >
            <span className="state-name">{state.name}</span>
          </button>
        ))}
      </div>
      <p className="current-state">Current: <strong>{displayState}</strong></p>
    </div>
  );
}

export default FinancialStateDisplay;
