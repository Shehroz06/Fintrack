import React from 'react';
import { todayLocalISODate } from '../utils';

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

const emptyForm = () => ({
  type: 'expense',
  amount: '',
  category: 'food',
  description: '',
  transactionDate: todayLocalISODate(),
  repeat: 'none'
});

function TransactionForm({ onSubmit, editingTransaction, onCancelEdit }) {
  const [formData, setFormData] = React.useState(emptyForm());
  const isEditing = Boolean(editingTransaction);

  React.useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        description: editingTransaction.description,
        transactionDate: String(editingTransaction.transaction_date).slice(0, 10),
        repeat: 'none'
      });
    } else {
      setFormData(emptyForm());
    }
  }, [editingTransaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'amount' ? parseFloat(value) || '' : value
      };
      if (name === 'type' && !isEditing) {
        updated.category = defaultCategory(value);
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;
    if (!formData.description.trim()) return;
    if (!formData.category.trim()) return;

    onSubmit({ ...formData, category: formData.category.trim().toLowerCase() }, isEditing ? editingTransaction.id : null);

    if (!isEditing) {
      setFormData(emptyForm());
    }
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
        <input
          id="tx-category"
          type="text"
          name="category"
          list="tx-category-options"
          value={formData.category}
          onChange={handleChange}
          placeholder="Pick a suggestion or type your own"
          maxLength={100}
          required
        />
        <datalist id="tx-category-options">
          {categories.map(cat => <option key={cat} value={cat} />)}
        </datalist>
      </div>

      <div className="form-group">
        <label htmlFor="tx-date">{formData.repeat === 'none' ? 'Date' : 'Start Date'}</label>
        <input
          id="tx-date"
          type="date"
          name="transactionDate"
          value={formData.transactionDate}
          onChange={handleChange}
        />
      </div>

      {!isEditing && (
        <div className="form-group">
          <label htmlFor="tx-repeat">Repeat</label>
          <select id="tx-repeat" name="repeat" value={formData.repeat} onChange={handleChange}>
            <option value="none">One-time</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Save Changes' : formData.repeat === 'none' ? 'Add Transaction' : 'Schedule Recurring Transaction'}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default TransactionForm;
