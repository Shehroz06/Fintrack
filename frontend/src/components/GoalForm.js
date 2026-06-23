import React from 'react';

function GoalForm({ onSubmit }) {
  const [formData, setFormData] = React.useState({
    name: '',
    targetAmount: '',
    deadline: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'targetAmount' ? parseFloat(value) || '' : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.targetAmount && formData.deadline) {
      onSubmit(formData);
      setFormData({
        name: '',
        targetAmount: '',
        deadline: ''
      });
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Goal Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Vacation Fund"
          required
        />
      </div>

      <div className="form-group">
        <label>Target Amount</label>
        <input
          type="number"
          name="targetAmount"
          value={formData.targetAmount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          required
        />
      </div>

      <div className="form-group">
        <label>Deadline</label>
        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary">Create Goal</button>
    </form>
  );
}

export default GoalForm;
