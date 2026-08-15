-- FinTrack — Complete Database Schema
-- Run once: mysql -u root -p finance_management < database_schema.sql

CREATE DATABASE IF NOT EXISTS finance_management;
USE finance_management;

-- Users (authentication)
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name         VARCHAR(255)  NOT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);

-- Accounts (per-user bank/investment accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  name       VARCHAR(255) NOT NULL,
  type       ENUM('checking','savings','investment','credit') DEFAULT 'checking',
  balance    DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_accounts_user (user_id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT          NOT NULL,
  account_id       INT          DEFAULT NULL,
  type             ENUM('income','expense','investment','savings') NOT NULL,
  amount           DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  category         VARCHAR(100) DEFAULT 'other',
  description      VARCHAR(500),
  transaction_date DATE         NOT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_transactions_user (user_id),
  INDEX idx_transactions_date (transaction_date),
  INDEX idx_transactions_type (type)
);

-- Financial goals
CREATE TABLE IF NOT EXISTS financial_goals (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT           NOT NULL,
  name           VARCHAR(255)  NOT NULL,
  target_amount  DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0.00,
  deadline       DATE,
  status         ENUM('active','completed','paused') DEFAULT 'active',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_goals_user (user_id)
);

-- Recurring transaction rules (materialized into `transactions` as time passes)
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  account_id    INT          DEFAULT NULL,
  type          ENUM('income','expense','investment','savings') NOT NULL,
  amount        DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  category      VARCHAR(100) DEFAULT 'other',
  description   VARCHAR(500),
  frequency     ENUM('daily','monthly') NOT NULL,
  next_run_date DATE         NOT NULL,
  active        TINYINT(1)   DEFAULT 1,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_recurring_user (user_id),
  INDEX idx_recurring_next_run (next_run_date)
);

-- Monthly budgets (one overall amount per user per calendar month)
CREATE TABLE IF NOT EXISTS budgets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT           NOT NULL,
  month      CHAR(7)       NOT NULL, -- 'YYYY-MM'
  amount     DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_budget_user_month (user_id, month)
);

-- User settings (financial state persistence)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id         INT PRIMARY KEY,
  financial_state ENUM('BUDGETING','SAVINGS','INVESTMENT') DEFAULT 'BUDGETING',
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
