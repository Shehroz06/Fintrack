import React from 'react';

function FinancialStateDisplay({ currentState, onStateSwitch }) {
  const states = [
    { id: 'BUDGETING', name: 'Budgeting Mode', icon: '📋' },
    { id: 'SAVINGS', name: 'Savings Mode', icon: '💰' },
    { id: 'INVESTMENT', name: 'Investment Mode', icon: '📈' }
  ];

  const displayState = states.find(state => state.id === currentState)?.name || currentState || 'NONE';

  return (
    <div className="financial-state-display">
      <h3>💡 Select Your Financial Mode</h3>
      <div className="state-buttons">
        {states.map(state => (
          <button
            key={state.id}
            className={`state-btn ${currentState === state.id ? 'active' : ''}`}
            onClick={() => onStateSwitch(state.id)}
          >
            <span className="state-icon">{state.icon}</span>
            <span className="state-name">{state.name}</span>
          </button>
        ))}
      </div>
      <p className="current-state">Current: <strong>{displayState}</strong></p>
    </div>
  );
}

// ==================== REPORT CHART ====================

export default FinancialStateDisplay;
