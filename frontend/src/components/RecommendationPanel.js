import React from 'react';

function RecommendationPanel({ recommendations }) {
  const money = (value) => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00';
  };

  const percent = (value) => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  if (!recommendations) {
    return <div className="section">Loading recommendations...</div>;
  }

  const { userMetrics = {}, stateRecommendations = {}, aiRecommendations = [], conditionalRecommendations = aiRecommendations } = recommendations;

  return (
    <div className="recommendations-panel">
      <div className="section">
        <h2>📊 Your Financial Metrics</h2>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">Income</span>
            <span className="metric-value">${money(userMetrics.totalIncome)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Expenses</span>
            <span className="metric-value">${money(userMetrics.totalExpenses)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Savings Rate</span>
            <span className="metric-value">{percent(userMetrics.savingsRate)}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Investments</span>
            <span className="metric-value">${money(userMetrics.investmentAmount)}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>🎯 {stateRecommendations.currentState} Recommendations</h2>
        <p className="state-description">{stateRecommendations.description}</p>
        <div className="recommendations-list">
          {stateRecommendations.recommendations?.map((rec, idx) => (
            <div key={idx} className={`recommendation-item priority-${rec.priority}`}>
              <span className="priority-badge">{rec.priority?.toUpperCase()}</span>
              <div className="recommendation-content">
                <p>{rec.message}</p>
                {rec.action && <p className="action"><strong>Action:</strong> {rec.action}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>✨ Smart Insights</h2>
        <div className="recommendations-list">
          {(conditionalRecommendations || aiRecommendations).map((rec, idx) => (
            <div key={idx} className={`recommendation-item priority-${rec.priority}`}>
              <span className="priority-badge">{rec.priority?.toUpperCase()}</span>
              <div className="recommendation-content">
                <p>{rec.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== FINANCIAL STATE DISPLAY ====================

export default RecommendationPanel;
