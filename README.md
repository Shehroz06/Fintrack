# FinTrack

A full-stack personal finance management system. Track income, expenses, investments, and savings goals with JWT-authenticated accounts and rule-based financial insights.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Recharts, CSS3 |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT + bcrypt |

---

## Features

- **Authentication** — Register and log in with email/password. Sessions use signed JWTs stored in localStorage.
- **Transaction tracking** — Add income, expenses, investments, and savings. Keyword-based auto-categorization. CSV export. Paginated history.
- **Financial goals** — Create goals with a target amount and deadline. Track progress with inline updates.
- **Insights** — Rule-based recommendation engine that analyzes spending patterns and savings rate. Financial mode (Budgeting / Savings / Investment) shifts the focus of recommendations.
- **Reports** — 6-month bar chart (income vs expenses vs invested), category breakdown pie chart, goal progress bars.
- **Dark mode** — Theme toggle, preference saved to localStorage.

---

## Architecture

### Design Patterns

| Pattern | File | Purpose |
|---------|------|---------|
| Singleton | `backend/DatabaseSingleton.js` | Single MySQL connection pool |
| Strategy | `backend/BudgetingStrategy.js` | Swappable budgeting strategies (50/30/20, zero-based) |
| Composite | `backend/CompositeAccount.js` | Treat individual and grouped accounts uniformly |
| State | `backend/FinancialState.js` | Mode-specific recommendation behavior |

### SOLID Principles

- **S** — Each service (TransactionService, GoalTrackerService, RecommendationEngine) has one responsibility.
- **O** — New budgeting strategies can be added without modifying existing ones.
- **L** — All budgeting strategies are interchangeable through the BudgetPlanner interface.
- **I** — Service interfaces expose only what callers need.
- **D** — Services depend on DatabaseSingleton and BudgetingStrategy abstractions.

---

## Project Structure

```
FinTrack/
├── backend/
│   ├── __tests__/
│   │   └── RecommendationEngine.test.js
│   ├── middleware/
│   │   └── authenticate.js        # JWT verification
│   ├── auth.js                    # Register / login routes
│   ├── server.js                  # Express app, all API routes
│   ├── Services.js                # TransactionService, GoalTrackerService
│   ├── RecommendationEngine.js    # Rule-based recommendation logic
│   ├── FinancialState.js          # State pattern — financial modes
│   ├── BudgetingStrategy.js       # Strategy pattern — budgeting strategies
│   ├── CompositeAccount.js        # Composite pattern — account hierarchy
│   ├── DatabaseSingleton.js       # Singleton pattern — DB connection pool
│   ├── database_schema.sql        # Full MySQL schema
│   ├── .env.example               # Required environment variables
│   └── package.json
│
└── frontend/
    └── src/
        ├── components/
        │   ├── AuthForm.js
        │   ├── Dashboard.js
        │   ├── TransactionForm.js
        │   ├── GoalForm.js
        │   ├── RecommendationPanel.js
        │   ├── FinancialStateDisplay.js
        │   └── ReportChart.js
        ├── services/
        │   └── api.js             # All API calls, token management
        ├── utils/
        │   └── csvExport.js
        ├── utils.js               # money(), percent() formatters
        ├── App.js
        └── App.css
```

---

## Setup

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS finance_management;"
mysql -u root -p finance_management < backend/database_schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set DB_PASSWORD and a strong JWT_SECRET
npm start
# Runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

### 4. Tests

```bash
cd backend
npm test
```

---

## API Reference

All routes except `/api/auth/*` and `/api/health` require `Authorization: Bearer <token>`.

### Auth (public)

```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
```

### Transactions

```
GET    /api/transactions
POST   /api/transactions
DELETE /api/transactions/:id
```

### Goals

```
GET    /api/goals
POST   /api/goals
PUT    /api/goals/:goalId/progress   { currentAmount }
DELETE /api/goals/:goalId
```

### Financial Mode

```
GET  /api/financial-state
POST /api/financial-state/switch    { state: "BUDGETING" | "SAVINGS" | "INVESTMENT" }
```

### Recommendations

```
POST /api/recommendations/generate
```


## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host (default: localhost) |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (finance_management) |
| `PORT` | Backend port (default: 5000) |
| `JWT_SECRET` | Secret for signing JWTs — use a long random string in production |
| `JWT_EXPIRES_IN` | Token lifetime (default: 7d) |
| `FRONTEND_URL` | Allowed CORS origin (default: http://localhost:3000) |

---

## Security Notes

- `.env` is in `.gitignore` and will never be committed.
- Passwords are hashed with bcrypt (12 rounds) before storage.
- All database queries use parameterized statements.
- CORS is restricted to `FRONTEND_URL` — not open to all origins.
- Change `JWT_SECRET` to a long random string before any deployment.

---

## Author

Shehroz Shoukat Ali  
SE-211: Software Design and Architecture — BESE-15
