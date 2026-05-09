/**
 * DATABASE SINGLETON PATTERN
 * Manages single instance of database connection
 * Ensures only one connection pool exists throughout application lifecycle
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseSingleton {
    constructor() {
        this.pool = null;
    }

    static getInstance() {
        if (!DatabaseSingleton.instance) {
            DatabaseSingleton.instance = new DatabaseSingleton();
        }
        return DatabaseSingleton.instance;
    }

    async initializePool() {
        if (!this.pool) {
            try {
                this.pool = mysql.createPool({
                    host: process.env.DB_HOST || 'localhost',
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_NAME || 'finance_management',

                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0,

                    enableKeepAlive: true,
                    keepAliveInitialDelay: 0
                });

                console.log('Database connection pool created successfully');
            } catch (error) {
                console.error('Error creating database connection pool:', error);
                throw error;
            }
        }

        return this.pool;
    }

    async getConnection() {
        if (!this.pool) {
            await this.initializePool();
        }

        return await this.pool.getConnection();
    }

    async query(sql, values = []) {
        const pool = await this.initializePool();
        const [results] = await pool.execute(sql, values);
        return results;
    }

    async closePool() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('Database connection pool closed');
        }
    }
}

module.exports = DatabaseSingleton;