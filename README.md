# Personal Finance Management System with AI Recommendations

## 📋 Project Overview

A full-stack personal finance management system with **AI-powered recommendations** using Google Gemini API. The system helps users track income, expenses, investments, and savings goals while providing intelligent financial advice based on their spending patterns.

**Tech Stack:**
- **Frontend:** React.js + CSS3
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **AI Integration:** Google Gemini API
- **Architecture:** SOLID Principles + Design Patterns

---

## 🎯 Key Features

### 1. **Transaction Management**
- Track income, expenses, investments, and savings
- Auto-categorization using Gemini AI
- Multi-account support (savings, checking, investment)
- Detailed transaction history and filtering

### 2. **Financial Goals Tracking**
- Set and monitor financial goals
- Track progress with visual indicators
- Multiple goal types (vacation, emergency fund, etc.)
- Goal completion status

### 3. **AI-Powered Recommendations**
- Personalized spending advice using Google Gemini
- Category-wise spending analysis
- Investment suggestions
- State-based recommendations (Budgeting, Savings, Investment modes)

### 4. **Financial Reporting**
- Income vs Expense breakdown
- Category-wise expense pie chart
- Goal progress visualization
- Monthly financial summaries

### 5. **Financial State Management** (Bonus)
- **Budgeting Mode**: Focus on expense tracking and control
- **Savings Mode**: Maximize savings and financial security
- **Investment Mode**: Grow wealth through strategic investments
- Smooth state transitions with mode-specific recommendations

### 6. **Budgeting Strategies** (Strategy Pattern)
- Zero-Based Budgeting: Every dollar assigned a purpose
- 50/30/20 Rule: Needs, Wants, Savings allocation
- Custom Percentage Strategy: Flexible allocation

---

## 🏗️ Architecture & Design Patterns

### SOLID Principles Application

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | Each service handles one responsibility (TransactionService, GoalTrackerService, RecommendationEngine) |
| **Open/Closed** | System is open for extension (new strategies) but closed for modification |
| **Liskov Substitution** | Strategy pattern allows interchangeable budgeting strategies |
| **Interface Segregation** | Focused service interfaces without unnecessary methods |
| **Dependency Inversion** | Services depend on abstractions (DatabaseSingleton, BudgetingStrategy) |

### Design Patterns Implemented

#### 1. **Singleton Pattern** 
```javascript
DatabaseSingleton.getInstance().getConnection()
// Ensures single database connection instance
```
- **File:** `backend_DatabaseSingleton.js`
- **Purpose:** Single database connection pool throughout application lifecycle

#### 2. **Strategy Pattern**
```javascript
const planner = new BudgetPlanner(new FiftyThirtyTwentyStrategy());
planner.getBudget(income);
```
- **File:** `backend_BudgetingStrategy.js`
- **Implementations:**
  - ZeroBasedBudgetingStrategy
  - FiftyThirtyTwentyStrategy
  - CustomPercentageStrategy
- **Purpose:** Switch budgeting strategies at runtime

#### 3. **Composite Pattern**
```javascript
const portfolio = new CompositeAccount('portfolio1', 'My Portfolio');
portfolio.addAccount(savingsAccount);
portfolio.addAccount(checkingAccount);
portfolio.getBalance(); // Sum of all accounts
```
- **File:** `backend_CompositeAccount.js`
- **Structure:**
  - SimpleAccount (leaf node)
  - CompositeAccount (composite node)
  - PortfolioManager
- **Purpose:** Treat individual and grouped accounts uniformly

#### 4. **State Pattern**
```javascript
const manager = new FinancialStateManager();
manager.setState(new BudgetingState());
manager.getRecommendations(); // State-specific recommendations
```
- **File:** `backend_FinancialState.js`
- **States:**
  - BudgetingState (expense control focus)
  - SavingsState (savings maximization focus)
  - InvestmentState (wealth growth focus)
- **Purpose:** Different behaviors based on financial state

---

## 📁 Project Structure

```
finance-management-system/
│
├── backend/
│   ├── DatabaseSingleton.js          # Singleton pattern - DB connection
│   ├── BudgetingStrategy.js          # Strategy pattern - Budgeting strategies
│   ├── CompositeAccount.js           # Composite pattern - Account hierarchy
│   ├── FinancialState.js             # State pattern - Financial states
│   ├── RecommendationEngine.js       # Gemini AI integration
│   ├── Services.js                   # TransactionService, GoalTrackerService
│   ├── server.js                     # Express server & routes
│   ├── package.json                  # Backend dependencies
│   └── .env.example                  # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js          # Overview dashboard
│   │   │   ├── TransactionForm.js    # Add transactions
│   │   │   ├── GoalForm.js           # Create goals
│   │   │   ├── RecommendationPanel.js # Display recommendations
│   │   │   ├── FinancialStateDisplay.js # Switch financial modes
│   │   │   └── ReportChart.js        # Display charts
│   │   ├── services/
│   │   │   └── api.js                # API communication
│   │   ├── App.js                    # Main app component
│   │   ├── App.css                   # Styling
│   │   └── index.js                  # React entry point
│   ├── public/
│   │   └── index.html                # HTML template
│   ├── package.json                  # Frontend dependencies
│   └── .env.example                  # Environment variables template
│
├── FINANCE_SYSTEM_SETUP.md           # Setup guide
└── README.md                         # This file
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v14+
- MySQL 5.7+
- Google Gemini API Key ([Get here](https://makersuite.google.com/app/apikey))
- npm or yarn

### Step 1: Database Setup

```sql
-- Create database
CREATE DATABASE finance_management;
USE finance_management;

-- Run SQL schema from FINANCE_SYSTEM_SETUP.md
-- (All CREATE TABLE statements included in setup guide)
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=finance_management
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
EOF

# Start backend server
npm start
# Server runs on http://localhost:5000
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF

# Start frontend server
npm start
# App opens at http://localhost:3000
```

---

## 📚 API Endpoints

### Transactions
```
POST   /api/transactions              # Add transaction
GET    /api/transactions/:userId      # Get all transactions
GET    /api/transactions/category-breakdown/:userId
GET    /api/transactions/monthly-summary/:userId/:month
DELETE /api/transactions/:id/:userId  # Delete transaction
```

### Goals
```
POST   /api/goals                     # Create goal
GET    /api/goals/:userId             # Get all goals
PUT    /api/goals/:goalId/:userId     # Update goal progress
DELETE /api/goals/:goalId/:userId     # Delete goal
```

### Financial State
```
POST   /api/financial-state/switch    # Switch financial mode
GET    /api/financial-state/:userId   # Get current state
```

### Recommendations
```
POST   /api/recommendations/generate  # Generate AI recommendations
```

### Portfolio
```
POST   /api/portfolio/accounts        # Add account to portfolio
GET    /api/portfolio/:userId         # Get portfolio info
```

### Budgeting Strategy
```
POST   /api/budgeting-strategy        # Calculate budget
```

---

## 💻 Usage Examples

### Example 1: Add a Transaction

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "accountId": 1,
    "type": "expense",
    "amount": 50.00,
    "description": "Restaurant lunch",
    "transactionDate": "2024-01-15"
  }'
```

### Example 2: Create a Financial Goal

```bash
curl -X POST http://localhost:5000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Vacation Fund",
    "targetAmount": 5000,
    "deadline": "2024-12-31"
  }'
```

### Example 3: Switch Financial State

```bash
curl -X POST http://localhost:5000/api/financial-state/switch \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "state": "savings"
  }'
```

### Example 4: Generate AI Recommendations

```bash
curl -X POST http://localhost:5000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

---

## 🤖 AI Integration (Gemini API)

### How AI Works

1. **Transaction Categorization**
   - User describes transaction: "bought groceries"
   - Gemini AI categorizes: "food"

2. **Personalized Recommendations**
   - Analyzes spending patterns
   - Identifies high-spending categories
   - Suggests budget optimizations
   - Recommends investment strategies

3. **Financial Health Assessment**
   - Evaluates savings rate
   - Checks goal progress
   - Provides actionable insights

### Gemini API Configuration

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

---

## 🎨 Frontend Components

### Dashboard
- Overview of financial metrics
- Quick stats (income, expenses, savings rate)
- Portfolio value display

### Transaction Form
- Add new transactions
- Select type (income, expense, investment, savings)
- Auto-category detection
- Date picker

### Goal Form
- Create financial goals
- Set target amounts
- Set deadlines

### Recommendation Panel
- AI-powered suggestions
- State-specific recommendations
- Financial health metrics
- Priority-based alerts

### Financial State Display
- Switch between modes
- Current state indicator
- Mode descriptions

### Report Charts
- Expense breakdown pie chart
- Income vs expense comparison
- Goal progress visualization

---

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Store API keys securely
   - Use environment-specific configs

2. **Database**
   - Use prepared statements (prevents SQL injection)
   - Validate all inputs
   - Implement proper authentication

3. **API Security**
   - CORS enabled for development
   - Use HTTPS in production
   - Implement JWT authentication
   - Rate limiting for API endpoints

---

## 📊 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table (for Composite Pattern)
CREATE TABLE accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('savings', 'checking', 'investment') NOT NULL,
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Transactions table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('income', 'expense', 'investment', 'savings') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100),
    description VARCHAR(255),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Financial goals table
CREATE TABLE financial_goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    deadline DATE,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recommendations table
CREATE TABLE recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(100),
    recommendation_text TEXT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🧪 Testing the System

### Test Workflow

1. **Start Backend**
   ```bash
   cd backend && npm start
   ```

2. **Start Frontend**
   ```bash
   cd frontend && npm start
   ```

3. **Create Sample Data**
   - Add a few transactions with different categories
   - Create financial goals
   - Switch between financial states

4. **View Recommendations**
   - Click "AI Recommendations" tab
   - See Gemini-powered insights
   - Check state-specific advice

5. **Generate Reports**
   - Go to Reports tab
   - View expense breakdown
   - Monitor goal progress

---

## 📈 Financial State Behaviors

### Budgeting Mode
- Focus: Expense tracking and control
- Recommendations:
  - Identify highest-spending categories
  - Flag large expenses
  - Suggest spending reductions
  - Track savings rate vs. target (20%)

### Savings Mode
- Focus: Maximizing savings
- Recommendations:
  - Monitor savings rate
  - Track progress on savings goals
  - Check emergency fund status
  - Suggest ways to increase savings

### Investment Mode
- Focus: Wealth growth
- Recommendations:
  - Investment rate analysis
  - Portfolio diversification suggestions
  - Rebalancing recommendations
  - Long-term wealth building tips

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
- Ensure MySQL is running: `mysql -u root -p`
- Check connection details in .env
- Verify database exists: `SHOW DATABASES;`

### Gemini API Error
```
Error: GEMINI_API_KEY not found
```
- Generate API key from Google AI Studio
- Add to .env file
- Restart backend server

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
- Backend already has CORS enabled
- Check frontend API_URL in .env
- Ensure both servers are running

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
- Change PORT in .env
- Or kill existing process: `lsof -ti:5000 | xargs kill -9`

---

## 📦 Deployment

### Backend Deployment (Heroku)
```bash
cd backend
heroku create your-app-name
heroku addons:create cleardb:ignite
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy 'build' folder to Vercel or Netlify
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📝 License

MIT License - Feel free to use this project for personal and commercial use.

---

## 👨‍💼 Author

**Your Name**
- Lab 14: Personal Finance Management System with AI Recommendations
- SE-211: Software Design and Architecture
- BESE-15 Class

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check console logs for detailed errors
4. Ensure all environment variables are set correctly

---

## 🎓 Learning Resources

### SOLID Principles
- [SOLID Principles by Robert Martin](https://en.wikipedia.org/wiki/SOLID)

### Design Patterns
- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [Gang of Four Patterns](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)

### Technologies
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MySQL Documentation](https://dev.mysql.com/doc)
- [Google Generative AI](https://ai.google.dev)

---

**Last Updated:** January 2024
**Version:** 1.0.0
