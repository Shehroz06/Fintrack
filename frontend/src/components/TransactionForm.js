import React from 'react';

function TransactionForm({ onSubmit }) {
  const [formData, setFormData] = React.useState({
    accountId: 1,
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.amount && formData.description) {
      onSubmit(formData);
      setFormData({
        accountId: 1,
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        transactionDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Type</label>
        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="investment">Investment</option>
          <option value="savings">Savings</option>
        </select>
      </div>

      <div className="form-group">
        <label>Amount</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Grocery shopping"
          required
        />
      </div>

      <div className="form-group">
        <label>Category (optional)</label>
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Auto-detected if empty"
        />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
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

// ==================== GOAL FORM ====================

export default TransactionForm;
