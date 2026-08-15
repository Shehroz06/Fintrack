import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import GoalForm from './components/GoalForm';
import RecommendationPanel from './components/RecommendationPanel';
import FinancialStateDisplay from './components/FinancialStateDisplay';
import ReportChart from './components/ReportChart';
import AuthForm from './components/AuthForm';
import PeriodSelector from './components/PeriodSelector';
import RecurringList from './components/RecurringList';
import BudgetTracker from './components/BudgetTracker';
import Insights from './components/Insights';
import API from './services/api';
import { money, filterByPeriod, periodLabel } from './utils';
import { exportTransactionsToCSV } from './utils/csvExport';

const PAGE_SIZE = 15;
const RECENT_COUNT = 5;

function normalizeFinancialState(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (['BUDGETING', 'SAVINGS', 'INVESTMENT'].includes(raw)) return raw;
  if (raw.includes('BUDGET')) return 'BUDGETING';
  if (raw.includes('SAV')) return 'SAVINGS';
  if (raw.includes('INVEST')) return 'INVESTMENT';
  return 'BUDGETING';
}

function App() {
  // ---- Auth ----
  const [isAuthenticated, setIsAuthenticated] = useState(API.isAuthenticated());
  const [authUser, setAuthUser] = useState(API.getStoredUser());

  // ---- App state ----
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [recurringRules, setRecurringRules] = useState([]);
  const [budget, setBudget] = useState(null);
  const [period, setPeriod] = useState('this-month');
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [financialState, setFinancialState] = useState('BUDGETING');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // ---- Transaction editing ----
  const [editingTransaction, setEditingTransaction] = useState(null);

  // ---- Search / filter ----
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // ---- Pagination ----
  const [txPage, setTxPage] = useState(0); // 0-indexed

  // ---- Dark mode ----
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('fintrack_dark') === 'true');

  // ---- Goal progress editing ----
  const [goalInputs, setGoalInputs] = useState({}); // goalId → string

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('fintrack_dark', darkMode);
  }, [darkMode]);

  // Listen for 401 events from API service
  useEffect(() => {
    const onUnauth = () => { setIsAuthenticated(false); setAuthUser(null); };
    window.addEventListener('fintrack:unauthorized', onUnauth);
    return () => window.removeEventListener('fintrack:unauthorized', onUnauth);
  }, []);

  // Reset to page 1 whenever the active filters change
  useEffect(() => {
    setTxPage(0);
  }, [searchText, filterType, filterCategory]);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const handleAuthSuccess = useCallback((token, user) => {
    API.setAuth(token, user);
    setIsAuthenticated(true);
    setAuthUser(user);
  }, []);

  const handleLogout = () => {
    API.clearAuth();
    setIsAuthenticated(false);
    setAuthUser(null);
    setTransactions([]);
    setGoals([]);
    setRecommendations(null);
    setActiveTab('dashboard');
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, goalsRes, stateRes, recRes, recurringRes, budgetRes] = await Promise.all([
        API.getTransactions(),
        API.getGoals(),
        API.getFinancialState(),
        API.generateRecommendations(),
        API.getRecurring(),
        API.getBudget()
      ]);
      if (transRes.success) setTransactions(transRes.transactions);
      if (goalsRes.success) setGoals(goalsRes.goals);
      if (stateRes.currentState) setFinancialState(normalizeFinancialState(stateRes.currentState));
      if (recRes.success) setRecommendations(recRes);
      if (recurringRes.success) setRecurringRules(recurringRes.rules);
      if (budgetRes.success) setBudget(budgetRes);
    } catch {
      showNotification('error', 'Failed to load data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (isAuthenticated) loadAllData();
  }, [isAuthenticated, loadAllData]);

  const refreshBudget = async () => {
    const budgetRes = await API.getBudget();
    if (budgetRes.success) setBudget(budgetRes);
  };

  // ---- Transaction actions ----
  const handleTransactionSubmit = async (transaction, editId) => {
    const { repeat, ...txData } = transaction;
    const isRecurring = !editId && repeat && repeat !== 'none';

    try {
      const result = editId
        ? await API.updateTransaction(editId, txData)
        : isRecurring
          ? await API.createRecurring({ ...txData, frequency: repeat, startDate: txData.transactionDate })
          : await API.addTransaction(txData);

      if (result.success) {
        showNotification('success', editId ? 'Transaction updated.' : isRecurring ? 'Recurring transaction scheduled.' : 'Transaction added.');
        setEditingTransaction(null);
        if (!editId) setTxPage(0);
        const [transRes, recRes, recurringRes] = await Promise.all([
          API.getTransactions(), API.generateRecommendations(), API.getRecurring()
        ]);
        if (transRes.success) setTransactions(transRes.transactions);
        if (recRes.success) setRecommendations(recRes);
        if (recurringRes.success) setRecurringRules(recurringRes.rules);
        refreshBudget();
      } else {
        showNotification('error', result.error || 'Failed to save transaction.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  const handleRecurringDeleted = async (ruleId) => {
    try {
      const result = await API.deleteRecurring(ruleId);
      if (result.success) {
        showNotification('success', 'Recurring transaction cancelled.');
        const recurringRes = await API.getRecurring();
        if (recurringRes.success) setRecurringRules(recurringRes.rules);
      } else {
        showNotification('error', result.error || 'Failed to cancel.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  const handleTransactionDeleted = async (id) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      const result = await API.deleteTransaction(id);
      if (result.success) {
        showNotification('success', 'Transaction deleted.');
        if (editingTransaction?.id === id) setEditingTransaction(null);
        const [transRes, recRes] = await Promise.all([API.getTransactions(), API.generateRecommendations()]);
        if (transRes.success) setTransactions(transRes.transactions);
        if (recRes.success) setRecommendations(recRes);
        refreshBudget();
      } else {
        showNotification('error', result.error || 'Failed to delete.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  const handleSetBudget = async (amount) => {
    try {
      const result = await API.setBudget(amount);
      if (result.success) {
        setBudget(result);
        showNotification('success', 'Budget saved.');
      } else {
        showNotification('error', result.error || 'Failed to save budget.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  // ---- Goal actions ----
  const handleGoalCreated = async (goal) => {
    try {
      const result = await API.createGoal(goal);
      if (result.success) {
        showNotification('success', 'Goal created!');
        const goalsRes = await API.getGoals();
        if (goalsRes.success) setGoals(goalsRes.goals);
      } else {
        showNotification('error', result.error || 'Failed to create goal.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  const handleGoalDeleted = async (goalId) => {
    if (!window.confirm('Delete this goal? This cannot be undone.')) return;
    try {
      const result = await API.deleteGoal(goalId);
      if (result.success) {
        showNotification('success', 'Goal deleted.');
        const goalsRes = await API.getGoals();
        if (goalsRes.success) setGoals(goalsRes.goals);
      } else {
        showNotification('error', result.error || 'Failed to delete goal.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  const handleGoalProgressUpdate = async (goalId) => {
    const raw = goalInputs[goalId];
    const amount = parseFloat(raw);
    if (!raw || isNaN(amount) || amount < 0) { showNotification('error', 'Enter a valid amount.'); return; }
    try {
      const result = await API.updateGoalProgress(goalId, amount);
      if (result.success) {
        showNotification('success', 'Goal progress updated!');
        setGoalInputs(prev => ({ ...prev, [goalId]: '' }));
        const goalsRes = await API.getGoals();
        if (goalsRes.success) setGoals(goalsRes.goals);
      } else {
        showNotification('error', result.error || 'Failed to update goal.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  // ---- Financial mode ----
  const handleStateSwitch = async (newState) => {
    const state = normalizeFinancialState(newState);
    setFinancialState(state);
    try {
      const result = await API.switchFinancialState(state);
      if (result.success) {
        setFinancialState(normalizeFinancialState(result.currentState));
        const recRes = await API.generateRecommendations();
        if (recRes.success) setRecommendations(recRes);
      } else {
        showNotification('error', result.error || 'Failed to switch mode.');
      }
    } catch { showNotification('error', 'Network error.'); }
  };

  // ---- Search / filter ----
  const categoryOptions = useMemo(
    () => Array.from(new Set(transactions.map(t => t.category))).sort(),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return transactions.filter(t => {
      if (filterType && t.type !== filterType) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (query && !t.description.toLowerCase().includes(query) && !t.category.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [transactions, searchText, filterType, filterCategory]);

  // ---- Pagination ----
  const pagedTransactions = filteredTransactions.slice(txPage * PAGE_SIZE, (txPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const recentTransactions = transactions.slice(0, RECENT_COUNT);

  // ---- Period filter (drives Reports category breakdown) ----
  const periodTransactions = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const currentPeriodLabel = periodLabel(period);

  // ===================== RENDER =====================

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>FinTrack</h1>
          <p className="subtitle">Personal Finance Management</p>
        </div>
        <div className="header-right">
          {authUser && <span className="user-greeting">Hi, {authUser.name.split(' ')[0]}</span>}
          <button
            className="icon-btn"
            onClick={() => setDarkMode(d => !d)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <nav className="app-nav">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'goals', label: 'Goals' },
          { id: 'recommendations', label: 'Insights' },
          { id: 'reports', label: 'Reports' },
        ].map(({ id, label }) => (
          <button
            key={id}
            className={`nav-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {notification && (
        <div className={`notification notification-${notification.type}`} role="alert">
          {notification.message}
        </div>
      )}

      <main className="app-main">
        {loading && <div className="loading-bar" />}

        <FinancialStateDisplay currentState={financialState} onStateSwitch={handleStateSwitch} />

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            {transactions.length === 0 && !loading ? (
              <div className="section">
                <p className="empty-state">No transactions yet. Add your first one in the Transactions tab to see your dashboard come to life.</p>
              </div>
            ) : (
              <>
                <Dashboard transactions={transactions} financialState={financialState} />
                <BudgetTracker budget={budget} onSetBudget={handleSetBudget} />
                <Insights transactions={transactions} />
                <div className="section">
                  <h2>Recent Transactions</h2>
                  {recentTransactions.length === 0 ? (
                    <p className="empty-state">No transactions yet.</p>
                  ) : (
                    <div className="transactions-list">
                      {recentTransactions.map((t) => (
                        <div key={t.id} className="transaction-item">
                          <span className="trans-date">{new Date(t.transaction_date).toLocaleDateString()}</span>
                          <span className="trans-cat badge">{t.category}</span>
                          <span className="trans-desc">{t.description}</span>
                          <span className={`trans-amount ${t.type}`}>
                            {t.type === 'expense' ? '-' : '+'} {money(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="tab-content">
            <div className="content-grid">
              <div className="section">
                <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
                <TransactionForm
                  onSubmit={handleTransactionSubmit}
                  editingTransaction={editingTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                />
              </div>

              <div className="section">
                <div className="section-header">
                  <h2>Transactions</h2>
                  {transactions.length > 0 && (
                    <button
                      className="btn-export"
                      onClick={() => exportTransactionsToCSV(transactions)}
                      title="Export all transactions to CSV"
                    >
                      Export CSV
                    </button>
                  )}
                </div>

                {transactions.length === 0 ? (
                  <p className="empty-state">No transactions yet. Add your first one!</p>
                ) : (
                  <>
                    <div className="filter-bar">
                      <input
                        type="text"
                        placeholder="Search description or category…"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        aria-label="Search transactions"
                      />
                      <select value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Filter by type">
                        <option value="">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="investment">Investment</option>
                        <option value="savings">Savings</option>
                      </select>
                      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} aria-label="Filter by category">
                        <option value="">All Categories</option>
                        {categoryOptions.map(cat => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {filteredTransactions.length === 0 ? (
                      <p className="empty-state">No transactions match your filters.</p>
                    ) : (
                      <>
                        <div className="transactions-list">
                          {pagedTransactions.map((t) => (
                            <div key={t.id} className="transaction-item">
                              <span className="trans-date">{new Date(t.transaction_date).toLocaleDateString()}</span>
                              <span className="trans-cat badge">{t.category}</span>
                              <span className="trans-desc">{t.description}</span>
                              <span className={`trans-amount ${t.type}`}>
                                {t.type === 'expense' ? '-' : '+'} {money(t.amount)}
                              </span>
                              <button className="btn-edit" onClick={() => setEditingTransaction(t)} title="Edit">Edit</button>
                              <button className="btn-delete" onClick={() => handleTransactionDeleted(t.id)} title="Delete">Remove</button>
                            </div>
                          ))}
                        </div>

                        {totalPages > 1 && (
                          <div className="pagination">
                            <button className="btn-page" onClick={() => setTxPage(p => p - 1)} disabled={txPage === 0}>Prev</button>
                            <span className="page-info">Page {txPage + 1} of {totalPages}</span>
                            <button className="btn-page" onClick={() => setTxPage(p => p + 1)} disabled={txPage >= totalPages - 1}>Next</button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="section">
              <h2>Recurring Transactions</h2>
              <RecurringList rules={recurringRules} onDelete={handleRecurringDeleted} />
            </div>
          </div>
        )}

        {/* GOALS */}
        {activeTab === 'goals' && (
          <div className="tab-content">
            <div className="content-grid">
              <div className="section">
                <h2>Create New Goal</h2>
                <GoalForm onSubmit={handleGoalCreated} />
              </div>

              <div className="section">
                <h2>Your Goals</h2>
                {goals.length === 0 ? (
                  <p className="empty-state">No financial goals yet. Create your first savings goal!</p>
                ) : (
                  <div className="goals-list">
                    {goals.map((goal) => (
                      <div key={goal.id} className="goal-item">
                        <div className="goal-header">
                          <h3>{goal.name}</h3>
                          <button className="btn-delete" onClick={() => handleGoalDeleted(goal.id)} title="Delete">Remove</button>
                        </div>
                        <div className="goal-progress">
                          <div className="progress-bar" style={{ width: `${goal.progressPercentage}%` }} />
                        </div>
                        <p>{money(goal.current_amount)} / {money(goal.target_amount)} ({goal.progressPercentage}%)</p>
                        <p className="goal-meta">
                          <span className="goal-status">{goal.status}</span>
                          {goal.daysRemaining > 0 && <span className="goal-days"> · {goal.daysRemaining}d left</span>}
                        </p>

                        {goal.status === 'active' && (
                          <div className="goal-update-row">
                            <input
                              type="number"
                              className="goal-update-input"
                              placeholder="Set saved amount"
                              min="0"
                              step="0.01"
                              value={goalInputs[goal.id] || ''}
                              onChange={e => setGoalInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            />
                            <button
                              className="btn btn-sm"
                              onClick={() => handleGoalProgressUpdate(goal.id)}
                            >
                              Update
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INSIGHTS */}
        {activeTab === 'recommendations' && (
          <div className="tab-content">
            <RecommendationPanel recommendations={recommendations} loading={loading} />
          </div>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
          <div className="tab-content">
            <PeriodSelector period={period} onChange={setPeriod} />
            <ReportChart
              transactions={transactions}
              periodTransactions={periodTransactions}
              periodLabel={currentPeriodLabel}
              goals={goals}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>FinTrack — Personal Finance Management</p>
      </footer>
    </div>
  );
}

export default App;
