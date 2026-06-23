const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'fintrack_token';
const USER_KEY = 'fintrack_user';

class APIService {
  // ==================== TOKEN MANAGEMENT ====================

  getToken() { return localStorage.getItem(TOKEN_KEY); }

  setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getStoredUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }

  isAuthenticated() { return !!this.getToken(); }

  _headers(extra = {}) {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra
    };
  }

  async _fetch(url, options = {}) {
    const res = await fetch(url, { ...options, headers: this._headers(options.headers) });
    if (res.status === 401) {
      this.clearAuth();
      window.dispatchEvent(new Event('fintrack:unauthorized'));
    }
    return res.json();
  }

  // ==================== AUTH ====================

  async register(name, email, password) {
    return this._fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  async login(email, password) {
    return this._fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // ==================== TRANSACTIONS ====================

  async addTransaction(transaction) {
    return this._fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  }

  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, v); });
    const qs = params.toString();
    return this._fetch(`${API_BASE_URL}/transactions${qs ? `?${qs}` : ''}`);
  }

  async getCategoryBreakdown(month = null) {
    const qs = month ? `?month=${month}` : '';
    return this._fetch(`${API_BASE_URL}/transactions/category-breakdown${qs}`);
  }

  async getMonthlySummary(month) {
    return this._fetch(`${API_BASE_URL}/transactions/monthly-summary/${month}`);
  }

  async deleteTransaction(transactionId) {
    return this._fetch(`${API_BASE_URL}/transactions/${transactionId}`, { method: 'DELETE' });
  }

  // ==================== GOALS ====================

  async createGoal(goal) {
    return this._fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      body: JSON.stringify(goal)
    });
  }

  async getGoals() {
    return this._fetch(`${API_BASE_URL}/goals`);
  }

  async updateGoalProgress(goalId, currentAmount) {
    return this._fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify({ currentAmount })
    });
  }

  async deleteGoal(goalId) {
    return this._fetch(`${API_BASE_URL}/goals/${goalId}`, { method: 'DELETE' });
  }

  // ==================== FINANCIAL STATE ====================

  async switchFinancialState(state) {
    return this._fetch(`${API_BASE_URL}/financial-state/switch`, {
      method: 'POST',
      body: JSON.stringify({ state })
    });
  }

  async getFinancialState() {
    return this._fetch(`${API_BASE_URL}/financial-state`);
  }

  // ==================== RECOMMENDATIONS ====================

  async generateRecommendations() {
    return this._fetch(`${API_BASE_URL}/recommendations/generate`, { method: 'POST', body: JSON.stringify({}) });
  }

  // ==================== PORTFOLIO ====================

  async addAccount(accountName, accountType, initialBalance = 0) {
    return this._fetch(`${API_BASE_URL}/portfolio/accounts`, {
      method: 'POST',
      body: JSON.stringify({ accountName, accountType, initialBalance })
    });
  }

  async getPortfolio() {
    return this._fetch(`${API_BASE_URL}/portfolio`);
  }

  // ==================== BUDGETING STRATEGY ====================

  async calculateBudget(strategy, income) {
    return this._fetch(`${API_BASE_URL}/budgeting-strategy`, {
      method: 'POST',
      body: JSON.stringify({ strategy, income })
    });
  }

  // ==================== HEALTH ====================

  async healthCheck() {
    return this._fetch(`${API_BASE_URL}/health`);
  }
}

const API = new APIService();
export default API;
