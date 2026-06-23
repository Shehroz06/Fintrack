import React from 'react';
import { money, percent } from '../utils';

function RecommendationPanel({ recommendations, loading }) {
  if (!recommendations) {
    return (
      <div className="section">
        <p className="empty-state">
          {loading ? 'Loading recommendations…' : 'No recommendations available yet. Add some transactions first.'}
        </p>
      </div>
    );
  }

  const {
    userMetrics = {},
    stateRecommendations = {},
    aiRecommendations = []
  } = recommendations;

  const metricCards = [
    { label: 'Income', value: `$${money(userMetrics.totalIncome)}` },
    { label: 'Expenses', value: `$${money(userMetrics.totalExpenses)}` },
    { label: 'Savings Rate', value: `${percent(userMetrics.savingsRate)}%` },
    { label: 'Investments', value: `$${money(userMetrics.investmentAmount)}` },
  ];

  return (
    <div className="recommendations-panel">
      <div className="section">
        <h2>Your Financial Snapshot</h2>
        <div className="metrics-grid">
          {metricCards.map(({ label, value }) => (
            <div key={label} className="metric">
              <span className="metric-label">{label}</span>
              <span className="metric-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {stateRecommendations.recommendations?.length > 0 && (
        <div className="section">
          <h2>{stateRecommendations.currentState} Mode Tips</h2>
          <p className="state-description">{stateRecommendations.description}</p>
          <div className="recommendations-list">
            {stateRecommendations.recommendations.map((rec, idx) => (
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
      )}

      {aiRecommendations.length > 0 && (
        <div className="section">
          <h2>Smart Insights</h2>
          <div className="recommendations-list">
            {aiRecommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-item priority-${rec.priority}`}>
                <span className="priority-badge">{rec.priority?.toUpperCase()}</span>
                <div className="recommendation-content">
                  <p>{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationPanel;
