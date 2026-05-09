/**
 * FRONTEND APP.JS - Main React Application
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import GoalForm from './components/GoalForm';
import RecommendationPanel from './components/RecommendationPanel';
import FinancialStateDisplay from './components/FinancialStateDisplay';
import ReportChart from './components/ReportChart';
import API from './services/api';

function App() {
  const money = (value) => {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00';
  };

  const normalizeFinancialState = (value) => {
    const rawValue = String(value || '').trim().toUpperCase();
    if (rawValue === 'BUDGETING' || rawValue === 'SAVINGS' || rawValue === 'INVESTMENT') {
      return rawValue;
    }

    if (rawValue.includes('BUDGET')) return 'BUDGETING';
    if (rawValue.includes('SAV')) return 'SAVINGS';
    if (rawValue.includes('INVEST')) return 'INVESTMENT';

    return 'BUDGETING';
  };

  const [userId] = useState(1); // Demo user ID
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [financialState, setFinancialState] = useState('BUDGETING');
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load transactions
      const transRes = await API.getTransactions(userId);
      if (transRes.success) {
        setTransactions(transRes.transactions);
      }

      // Load goals
      const goalsRes = await API.getGoals(userId);
      if (goalsRes.success) {
        setGoals(goalsRes.goals);
      }

      // Load financial state
      const stateRes = await API.getFinancialState(userId);
      if (stateRes.currentState) {
        setFinancialState(normalizeFinancialState(stateRes.currentState));
      }

      // Load portfolio
      const portfolioRes = await API.getPortfolio(userId);
      if (portfolioRes.success) {
        setPortfolio(portfolioRes.portfolio);
      }

      // Load recommendations
      const recRes = await API.generateRecommendations(userId);
      if (recRes.success) {
        setRecommendations(recRes);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = async (transaction) => {
    try {
      const result = await API.addTransaction(userId, transaction);
      if (result.success) {
        loadAllData();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleGoalCreated = async (goal) => {
    try {
      const result = await API.createGoal(userId, goal);
      if (result.success) {
        loadAllData();
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleStateSwitch = async (newState) => {
    try {
      const selectedState = normalizeFinancialState(newState);
      setFinancialState(selectedState);

      const result = await API.switchFinancialState(userId, selectedState);
      if (result.success) {
        setFinancialState(normalizeFinancialState(result.currentState));
        loadAllData();
      }
    } catch (error) {
      console.error('Error switching state:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Personal Finance Management System</h1>
        <p className="subtitle">Smart Rule-Based Financial Planning</p>
      </header>

      <nav className="app-nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💳 Transactions
        </button>
        <button 
          className={`nav-btn ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 Goals
        </button>
        <button 
          className={`nav-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          ✨ Smart Insights
        </button>
        <button 
          className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
      </nav>

      <main className="app-main">
        {loading && <div className="loading">Loading your financial data...</div>}

        {/* Financial State Display */}
        <FinancialStateDisplay 
          currentState={financialState}
          onStateSwitch={handleStateSwitch}
        />

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            transactions={transactions}
            goals={goals}
            portfolio={portfolio}
            financialState={financialState}
          />
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="tab-content">
            <div className="content-grid">
              <div className="section">
                <h2>Add Transaction</h2>
                <TransactionForm onSubmit={handleTransactionAdded} />
              </div>
              <div className="section">
                <h2>Recent Transactions</h2>
                <div className="transactions-list">
                  {transactions.slice(0, 10).map((trans, idx) => (
                    <div key={idx} className="transaction-item">
                      <span className="trans-date">
                        {new Date(trans.transaction_date).toLocaleDateString()}
                      </span>
                      <span className="trans-desc">{trans.description}</span>
                      <span className={`trans-amount ${trans.type}`}>
                        {trans.type === 'expense' ? '-' : '+'} ${money(trans.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="tab-content">
            <div className="content-grid">
              <div className="section">
                <h2>Create New Goal</h2>
                <GoalForm onSubmit={handleGoalCreated} />
              </div>
              <div className="section">
                <h2>Your Goals</h2>
                <div className="goals-list">
                  {goals.map((goal, idx) => (
                    <div key={idx} className="goal-item">
                      <h3>{goal.name}</h3>
                      <div className="goal-progress">
                        <div 
                          className="progress-bar"
                          style={{ width: `${goal.progressPercentage}%` }}
                        ></div>
                      </div>
                      <p>${money(goal.current_amount)} / ${money(goal.target_amount)}</p>
                      <p className="goal-status">{goal.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="tab-content">
            <RecommendationPanel recommendations={recommendations} />
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="tab-content">
            <ReportChart transactions={transactions} goals={goals} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Personal Finance Management System © 2024 | Powered by Smart Rules</p>
      </footer>
    </div>
  );
}

export default App;
