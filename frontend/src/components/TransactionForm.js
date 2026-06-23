import React from 'react';

const EXPENSE_CATEGORIES = [
  'food', 'transportation', 'utilities', 'entertainment',
  'shopping', 'healthcare', 'housing', 'education', 'other'
];

const INCOME_CATEGORIES = ['income', 'other'];
const INVESTMENT_CATEGORIES = ['investment', 'other'];
const SAVINGS_CATEGORIES = ['savings', 'other'];

function categoriesForType(type) {
  switch (type) {
    case 'income': return INCOME_CATEGORIES;
    case 'investment': return INVESTMENT_CATEGORIES;
    case 'savings': return SAVINGS_CATEGORIES;
    default: return EXPENSE_CATEGORIES;
  }
}

const defaultCategory = (type) => categoriesForType(type)[0];

function TransactionForm({ onSubmit }) {
  const [formData, setFormData] = React.useState({
    type: 'expense',
    amount: '',
    category: 'food',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'amount' ? parseFloat(value) || '' : value
      };
      if (name === 'type') {
        updated.category = defaultCategory(value);
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;
    if (!formData.description.trim()) return;
    onSubmit(formData);
    setFormData({
      type: 'expense',
      amount: '',
      category: 'food',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
  };

  const categories = categoriesForType(formData.type);

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="tx-type">Type</label>
        <select id="tx-type" name="type" value={formData.type} onChange={handleChange}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="investment">Investment</option>
          <option value="savings">Savings</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="tx-amount">Amount</label>
        <input
          id="tx-amount"
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="tx-description">Description</label>
        <input
          id="tx-description"
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Grocery shopping"
          maxLength={255}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="tx-category">Category</label>
        <select id="tx-category" name="category" value={formData.category} onChange={handleChange}>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="tx-date">Date</label>
        <input
          id="tx-date"
          type="date"
          name="transactionDate"
          value={formData.transactionDate}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn btn-primary">Add Transaction</button>
    </form>
  );
}

export default TransactionForm;
