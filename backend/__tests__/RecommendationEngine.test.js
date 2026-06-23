'use strict';

const RecommendationEngine = require('../RecommendationEngine');

describe('RecommendationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  // ==================== categorizeTransaction ====================

  describe('categorizeTransaction', () => {
    const cases = [
      ['salary deposit',    'income'],
      ['paycheck direct deposit', 'income'],
      ['McDonald burger',   'food'],
      ['Uber Eats order',   'food'],
      ['Netflix subscription', 'entertainment'],
      ['electric bill',     'utilities'],
      ['Uber ride',         'transportation'],
      ['gas station shell', 'transportation'],
      ['Amazon purchase',   'shopping'],
      ['rent payment',      'housing'],
      ['mortgage payment',  'housing'],
      ['doctor visit',      'healthcare'],
      ['Fidelity investment', 'investment'],
      ['401k contribution', 'investment'],
      ['emergency fund transfer', 'savings'],
      ['course tuition',    'education'],
      ['completely unknown xyzzy', 'other'],
    ];

    test.each(cases)('"%s" → %s', async (description, expected) => {
      const result = await engine.categorizeTransaction(description);
      expect(result).toBe(expected);
    });

    test('returns "other" for empty string', async () => {
      expect(await engine.categorizeTransaction('')).toBe('other');
    });

    test('returns "other" for null/undefined', async () => {
      expect(await engine.categorizeTransaction(null)).toBe('other');
      expect(await engine.categorizeTransaction(undefined)).toBe('other');
    });
  });

  // ==================== generateRecommendations ====================

  describe('generateRecommendations', () => {
    test('returns success with recommendations array', async () => {
      const result = await engine.generateRecommendations({
        totalIncome: 5000,
        totalExpenses: 3000,
        savingsRate: 40,
        savingsGoals: [],
        categorySpending: { food: 1000, housing: 1500, entertainment: 500 },
        currentSavings: 2000,
        investmentAmount: 500
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('every recommendation has priority, category, and message', async () => {
      const { recommendations } = await engine.generateRecommendations({
        totalIncome: 4000,
        totalExpenses: 3800,
        savingsRate: 5,
        categorySpending: { food: 1200, shopping: 900 },
        currentSavings: 500,
        investmentAmount: 0
      });

      recommendations.forEach(rec => {
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(['spending', 'saving', 'investment', 'action']).toContain(rec.category);
        expect(typeof rec.message).toBe('string');
        expect(rec.message.length).toBeGreaterThan(0);
      });
    });

    test('flags overspending when expenses > income', async () => {
      const { recommendations } = await engine.generateRecommendations({
        totalIncome: 3000,
        totalExpenses: 4000,
        currentSavings: 0,
        categorySpending: {},
        savingsGoals: []
      });

      const highPriority = recommendations.filter(r => r.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
    });

    test('returns max 5 recommendations by default', async () => {
      const { recommendations } = await engine.generateRecommendations({
        totalIncome: 5000,
        totalExpenses: 2000,
        currentSavings: 500,
        investmentAmount: 300,
        categorySpending: { food: 500, shopping: 300, entertainment: 200 },
        savingsGoals: [{ id: 1, name: 'Car', targetAmount: 10000, currentAmount: 1000, status: 'active' }]
      });

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    test('handles zero income gracefully', async () => {
      const result = await engine.generateRecommendations({
        totalIncome: 0,
        totalExpenses: 0,
        currentSavings: 0
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('handles missing userData gracefully', async () => {
      const result = await engine.generateRecommendations();
      expect(result.success).toBe(true);
    });
  });

  // ==================== getFinancialHealthInsight ====================

  describe('getFinancialHealthInsight', () => {
    test('returns a score between 1 and 10', async () => {
      const result = await engine.getFinancialHealthInsight({
        totalIncome: 5000,
        totalExpenses: 3000,
        currentSavings: 6000,
        investmentAmount: 500
      });

      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(10);
    });

    test('returns a non-empty assessment string', async () => {
      const result = await engine.getFinancialHealthInsight({
        totalIncome: 4000,
        totalExpenses: 3900
      });

      expect(typeof result.assessment).toBe('string');
      expect(result.assessment.length).toBeGreaterThan(10);
    });

    test('unhealthy finances score lower than healthy ones', async () => {
      const poor = await engine.getFinancialHealthInsight({
        totalIncome: 2000,
        totalExpenses: 2500,
        currentSavings: 0,
        investmentAmount: 0
      });
      const good = await engine.getFinancialHealthInsight({
        totalIncome: 6000,
        totalExpenses: 3000,
        currentSavings: 18000,
        investmentAmount: 600
      });

      expect(good.score).toBeGreaterThan(poor.score);
    });
  });

  // ==================== internal helpers ====================

  describe('_safeNumber', () => {
    test('converts valid numbers', () => {
      expect(engine._safeNumber(42)).toBe(42);
      expect(engine._safeNumber('3.14')).toBe(3.14);
    });

    test('returns 0 for invalid values', () => {
      expect(engine._safeNumber(NaN)).toBe(0);
      expect(engine._safeNumber(null)).toBe(0);
      expect(engine._safeNumber(undefined)).toBe(0);
      expect(engine._safeNumber('abc')).toBe(0);
      expect(engine._safeNumber(Infinity)).toBe(0);
    });
  });

  describe('_clamp', () => {
    test('clamps values within range', () => {
      expect(engine._clamp(5, 0, 10)).toBe(5);
      expect(engine._clamp(-5, 0, 10)).toBe(0);
      expect(engine._clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('_titleCase', () => {
    test('converts strings to title case', () => {
      expect(engine._titleCase('food')).toBe('Food');
      expect(engine._titleCase('uber eats')).toBe('Uber Eats');
      expect(engine._titleCase('')).toBe('');
    });
  });

  describe('_money', () => {
    test('formats to 2 decimal places', () => {
      expect(engine._money(100)).toBe('100.00');
      expect(engine._money(3.1)).toBe('3.10');
      expect(engine._money(null)).toBe('0.00');
    });
  });
});
