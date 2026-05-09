/**
 * FRONTEND API SERVICE
 * Handles all communication with the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIService {
  // ==================== TRANSACTIONS ====================
  
  async addTransaction(userId, transaction) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...transaction
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async getTransactions(userId, filters = {}) {
    try {
      let url = `${API_BASE_URL}/transactions/${userId}`;
      const params = new URLSearchParams(filters);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getCategoryBreakdown(userId, month = null) {
    try {
      let url = `${API_BASE_URL}/transactions/category-breakdown/${userId}`;
      if (month) {
        url += `?month=${month}`;
      }

      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
  }

  async getMonthlySummary(userId, month) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/monthly-summary/${userId}/${month}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      throw error;
    }
  }

  async deleteTransaction(userId, transactionId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/${transactionId}/${userId}`,
        { method: 'DELETE' }
      );
      return await response.json();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // ==================== GOALS ====================

  async createGoal(userId, goal) {
    try {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...goal
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  async getGoals(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/goals/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  }

  async updateGoalProgress(userId, goalId, currentAmount) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/goals/${goalId}/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentAmount })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  async deleteGoal(userId, goalId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/goals/${goalId}/${userId}`,
        { method: 'DELETE' }
      );
      return await response.json();
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  // ==================== FINANCIAL STATE ====================

  async switchFinancialState(userId, state) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/financial-state/switch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, state })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error switching financial state:', error);
      throw error;
    }
  }

  async getFinancialState(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/financial-state/${userId}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching financial state:', error);
      throw error;
    }
  }

  // ==================== RECOMMENDATIONS ====================

  async generateRecommendations(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/recommendations/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // ==================== PORTFOLIO ====================

  async addAccountToPortfolio(userId, accountName, accountType, initialBalance = 0) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/portfolio/accounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            accountName,
            accountType,
            initialBalance
          })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  }

  async getPortfolio(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/portfolio/${userId}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  // ==================== BUDGETING STRATEGY ====================

  async calculateBudget(strategy, income) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/budgeting-strategy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategy, income })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error calculating budget:', error);
      throw error;
    }
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }
}

const API = new APIService();
export default API;
