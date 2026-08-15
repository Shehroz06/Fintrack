'use strict';

/**
 * RECOMMENDATION ENGINE - GEMINI-POWERED WITH LOCAL RULE-BASED FALLBACK
 *
 * Uses Gemini for AI-generated tips and ambiguous-transaction categorization
 * when GEMINI_API_KEY is configured. Falls back to the local rule-based
 * engine on missing config, API errors, or malformed responses, so the app
 * keeps working even if Gemini is down or unconfigured.
 *
 * Public methods kept:
 * - generateRecommendations(userData)
 * - categorizeTransaction(description)
 * - getFinancialHealthInsight(userData)
 *
 * Export kept:
 * - module.exports = RecommendationEngine
 *
 * Recommendation object format:
 * {
 *   priority: 'high' | 'medium' | 'low',
 *   category: 'spending' | 'saving' | 'investment' | 'action',
 *   message: string
 * }
 */

const GeminiService = require('./GeminiService');

const DEFAULT_CONFIG = Object.freeze({
  maxRecommendations: 5,
  targetSavingsRate: 20,
  starterSavingsRate: 10,
  targetInvestmentRate: 10,
  strongInvestmentRate: 15,
  emergencyFundMonths: 3,
  strongEmergencyFundMonths: 6,
  highExpenseRatio: 90,
  healthyExpenseRatio: 70,
  dominantCategoryPercent: 30
});

const VALID_TRANSACTION_CATEGORIES = Object.freeze([
  'income',
  'food',
  'transportation',
  'utilities',
  'entertainment',
  'shopping',
  'healthcare',
  'housing',
  'education',
  'savings',
  'investment',
  'other'
]);

const TRANSACTION_CATEGORY_RULES = Object.freeze([
  {
    category: 'income',
    keywords: [
      'salary',
      'payroll',
      'paycheck',
      'direct deposit',
      'deposit',
      'wage',
      'bonus',
      'commission',
      'refund salary',
      'freelance payment',
      'client payment',
      'income'
    ]
  },
  {
    category: 'food',
    keywords: [
      'restaurant',
      'cafe',
      'coffee',
      'grocery',
      'groceries',
      'food',
      'mcdonald',
      'burger king',
      'kfc',
      'subway',
      'pizza',
      'starbucks',
      'dunkin',
      'uber eats',
      'ubereats',
      'doordash',
      'door dash',
      'grubhub',
      'instacart',
      'whole foods',
      'trader joe',
      'costco food'
    ]
  },
  {
    category: 'transportation',
    keywords: [
      'uber',
      'lyft',
      'taxi',
      'cab',
      'gas',
      'fuel',
      'shell',
      'chevron',
      'exxon',
      'bp',
      'parking',
      'bus',
      'train',
      'metro',
      'subway fare',
      'toll',
      'car wash',
      'auto',
      'vehicle',
      'transit'
    ]
  },
  {
    category: 'utilities',
    keywords: [
      'electric',
      'electricity',
      'water bill',
      'gas bill',
      'internet',
      'wifi',
      'phone bill',
      'mobile bill',
      'utility',
      'utilities',
      'verizon',
      'at&t',
      'tmobile',
      't-mobile',
      'comcast',
      'xfinity',
      'spectrum',
      'energy'
    ]
  },
  {
    category: 'entertainment',
    keywords: [
      'netflix',
      'spotify',
      'hulu',
      'disney',
      'youtube premium',
      'movie',
      'cinema',
      'theater',
      'game',
      'gaming',
      'playstation',
      'xbox',
      'steam',
      'concert',
      'ticketmaster',
      'entertainment',
      'subscription'
    ]
  },
  {
    category: 'shopping',
    keywords: [
      'amazon',
      'walmart',
      'target',
      'shop',
      'shopping',
      'store',
      'clothing',
      'fashion',
      'nike',
      'adidas',
      'zara',
      'hm',
      'h&m',
      'best buy',
      'electronics',
      'mall',
      'purchase'
    ]
  },
  {
    category: 'healthcare',
    keywords: [
      'doctor',
      'pharmacy',
      'medical',
      'hospital',
      'clinic',
      'health',
      'healthcare',
      'dentist',
      'dental',
      'vision',
      'cvs',
      'walgreens',
      'rite aid',
      'medicine',
      'insurance medical'
    ]
  },
  {
    category: 'housing',
    keywords: [
      'rent',
      'mortgage',
      'landlord',
      'apartment',
      'housing',
      'lease',
      'property management',
      'hoa',
      'home loan',
      'real estate'
    ]
  },
  {
    category: 'education',
    keywords: [
      'tuition',
      'school',
      'college',
      'course',
      'book',
      'textbook',
      'university',
      'education',
      'student loan',
      'udemy',
      'coursera',
      'class',
      'academy'
    ]
  },
  {
    category: 'savings',
    keywords: [
      'savings',
      'save',
      'emergency fund',
      'transfer to savings',
      'high yield savings',
      'hysa',
      'cash reserve'
    ]
  },
  {
    category: 'investment',
    keywords: [
      'investment',
      'invest',
      'brokerage',
      'stock',
      'stocks',
      'etf',
      'crypto',
      'mutual fund',
      'index fund',
      'robinhood',
      'fidelity',
      'vanguard',
      'schwab',
      'ira',
      '401k',
      'retirement'
    ]
  }
]);

const CATEGORY_ADVICE = Object.freeze({
  food: 'Plan meals before shopping and set a weekly dining-out limit.',
  transportation: 'Compare commute options and reduce rideshare or fuel costs where possible.',
  utilities: 'Review phone, internet, and utility plans for cheaper alternatives.',
  entertainment: 'Audit subscriptions and keep only the ones you use regularly.',
  shopping: 'Use a 24-hour rule before non-essential purchases.',
  healthcare: 'Review recurring healthcare costs and keep preventive care planned.',
  housing: 'Housing is usually hard to change quickly, so focus on avoiding add-on fees and reviewing renewal terms early.',
  education: 'Look for lower-cost materials, scholarships, reimbursement, or free learning alternatives.',
  savings: 'Keep savings separate from daily spending so it is not accidentally used.',
  investment: 'Review whether investments match your goals, timeline, and risk tolerance.',
  other: 'Review uncategorized transactions and assign clearer labels so your budget is easier to improve.'
});

class RecommendationEngine {
  constructor(options = {}) {
    this.engineName = 'local-rule-based-financial-engine';
    this.version = '1.2.0';
    this.config = {
      ...DEFAULT_CONFIG,
      ...options
    };
    this.gemini = new GeminiService();
  }

  /**
   * Generate recommendations from user financial data.
   * Tries Gemini first (if configured), falls back to the local rule engine
   * on missing config, API errors, or malformed AI responses.
   */
  async generateRecommendations(userData = {}) {
    try {
      const profile = this._normalizeUserData(userData);
      const analysis = this._analyzeFinancialProfile(profile);
      const summary = this._buildSummary(profile, analysis);

      if (this.gemini.isConfigured()) {
        try {
          const recommendations = await this.gemini.generateRecommendations(this._buildPrompt(userData));

          return {
            success: true,
            recommendations,
            summary,
            fallbackUsed: false,
            engine: `gemini:${this.gemini.model}`
          };
        } catch (aiError) {
          console.warn('Gemini recommendation generation failed, falling back to local engine:', aiError.message);
        }
      }

      const recommendations = this._generateRecommendationSet(profile, analysis);

      return {
        success: true,
        recommendations,
        summary,
        rawResponse: JSON.stringify({ recommendations, summary, engine: this.engineName }, null, 2),
        fallbackUsed: true,
        engine: this.engineName
      };
    } catch (error) {
      console.error('Error generating recommendations:', error.message);

      return {
        success: false,
        error: error.message,
        fallbackRecommendations: this._getFallbackRecommendations(userData),
        engine: this.engineName
      };
    }
  }

  /**
   * Categorize a transaction. Local keyword rules run first (free, instant);
   * Gemini is only consulted when the keyword rules find no match, since
   * calling it on every transaction would add needless latency and cost.
   */
  async categorizeTransaction(description = '') {
    const localCategory = this._categorizeByRules(description);

    if (localCategory !== 'other' || !this.gemini.isConfigured()) {
      return localCategory;
    }

    try {
      const candidateCategories = VALID_TRANSACTION_CATEGORIES.filter((c) => c !== 'other');
      return await this.gemini.categorizeTransaction(description, candidateCategories);
    } catch (error) {
      console.warn('Gemini categorization failed, falling back to local rules:', error.message);
      return localCategory;
    }
  }

  /**
   * Return a financial health assessment and score.
   * Kept async so existing await calls still work.
   */
  async getFinancialHealthInsight(userData = {}) {
    try {
      const profile = this._normalizeUserData(userData);
      const analysis = this._analyzeFinancialProfile(profile);
      const score = this._calculateFinancialHealthScore(profile, analysis);
      const assessment = this._buildHealthAssessment(profile, analysis, score);

      return {
        assessment,
        score
      };
    } catch (error) {
      console.warn('Financial health insight failed:', error.message);

      return {
        assessment: 'Unable to assess at this time. Please review the financial data and try again.',
        score: 0
      };
    }
  }

  /**
   * Compatibility helper from the old Gemini version.
   * Instead of building an AI prompt, this returns a readable local profile summary.
   */
  _buildPrompt(userData = {}) {
    const profile = this._normalizeUserData(userData);
    const analysis = this._analyzeFinancialProfile(profile);

    return [
      'Local Rule Engine Financial Profile:',
      `Monthly Income: $${this._money(profile.totalIncome)}`,
      `Monthly Expenses: $${this._money(profile.totalExpenses)}`,
      `Current Savings: $${this._money(profile.currentSavings)}`,
      `Savings Rate: ${this._percent(profile.savingsRate)}%`,
      `Investment Amount: $${this._money(profile.investmentAmount)}`,
      `Net Cash Flow: $${this._money(analysis.netCashFlow)}`,
      `Emergency Fund Coverage: ${this._percent(analysis.emergencyFundMonths)} months`,
      `Financial State: ${profile.financialState}`
    ].join('\n');
  }

  /**
   * Compatibility helper from the old Gemini version.
   */
  _parseRecommendations(responseText = '') {
    try {
      const jsonMatch = String(responseText).match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (Array.isArray(parsed.recommendations)) {
          return parsed.recommendations;
        }
      }
    } catch (error) {
      console.error('Error parsing recommendations:', error.message);
    }

    return [
      {
        priority: 'medium',
        category: 'action',
        message: String(responseText || 'No recommendation text available.')
      }
    ];
  }

  _getFallbackRecommendations(userData = {}) {
    const profile = this._normalizeUserData(userData);
    const analysis = this._analyzeFinancialProfile(profile);

    return this._generateRecommendationSet(profile, analysis);
  }

  /**
   * Compatibility with previous quota fallback function name.
   */
  _getQuotaFallbackRecommendations(userData = {}) {
    return this._getFallbackRecommendations(userData);
  }

  _normalizeUserData(userData = {}) {
    const totalIncome = this._safeNumber(userData.totalIncome);
    const totalExpenses = this._safeNumber(userData.totalExpenses);
    const currentSavings = this._safeNumber(userData.currentSavings);
    const investmentAmount = this._safeNumber(userData.investmentAmount);

    const calculatedSavingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const savingsRate = Number.isFinite(Number(userData.savingsRate))
      ? this._safeNumber(userData.savingsRate)
      : calculatedSavingsRate;

    return {
      totalIncome,
      totalExpenses,
      currentSavings,
      investmentAmount,
      savingsRate,
      calculatedSavingsRate,
      financialState: this._normalizeFinancialState(userData.financialState),
      savingsGoals: this._normalizeSavingsGoals(userData.savingsGoals),
      categorySpending: this._normalizeCategorySpending(userData.categorySpending),
      raw: userData
    };
  }

  _normalizeFinancialState(financialState) {
    const value = String(financialState || 'budgeting').toLowerCase().trim();

    const aliases = {
      saving: 'savings',
      investing: 'investment'
    };

    const normalizedValue = aliases[value] || value;
    const validStates = ['budgeting', 'savings', 'investment', 'debt', 'general'];

    return validStates.includes(normalizedValue) ? normalizedValue : 'budgeting';
  }

  _normalizeSavingsGoals(savingsGoals) {
    if (!Array.isArray(savingsGoals)) {
      return [];
    }

    return savingsGoals.map((goal, index) => {
      const targetAmount = this._safeNumber(goal.targetAmount);
      const currentAmount = this._safeNumber(goal.currentAmount);
      const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

      return {
        id: goal.id || goal._id || index,
        name: goal.name || goal.title || `Goal ${index + 1}`,
        currentAmount,
        targetAmount,
        status: goal.status || 'active',
        progress: this._clamp(progress, 0, 100),
        deadline: goal.deadline || goal.targetDate || null
      };
    });
  }

  _normalizeCategorySpending(categorySpending) {
    if (
      !categorySpending ||
      typeof categorySpending !== 'object' ||
      Array.isArray(categorySpending)
    ) {
      return {};
    }

    return Object.entries(categorySpending).reduce((acc, [category, amount]) => {
      const cleanCategory = String(category || 'other').trim().toLowerCase();
      const cleanAmount = Math.max(0, this._safeNumber(amount));

      if (cleanAmount > 0) {
        acc[cleanCategory] = cleanAmount;
      }

      return acc;
    }, {});
  }

  _analyzeFinancialProfile(profile) {
    const totalIncome = profile.totalIncome;
    const totalExpenses = profile.totalExpenses;
    const currentSavings = profile.currentSavings;
    const investmentAmount = profile.investmentAmount;

    const netCashFlow = totalIncome - totalExpenses;
    const expensesToIncomeRatio =
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    const savingsRate =
      totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : profile.savingsRate;

    const investmentRate =
      totalIncome > 0 ? (investmentAmount / totalIncome) * 100 : 0;

    const emergencyFundMonths =
      totalExpenses > 0 ? currentSavings / totalExpenses : 0;

    const spendingEntries = Object.entries(profile.categorySpending)
      .map(([category, amount]) => ({
        category,
        amount: this._safeNumber(amount),
        percentOfExpenses:
          totalExpenses > 0 ? (this._safeNumber(amount) / totalExpenses) * 100 : 0,
        percentOfIncome:
          totalIncome > 0 ? (this._safeNumber(amount) / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory = spendingEntries[0] || null;
    const activeGoals = profile.savingsGoals.filter((goal) => goal.status === 'active');
    const highestPriorityGoal = this._pickHighestPriorityGoal(activeGoals);

    return {
      netCashFlow,
      expensesToIncomeRatio,
      savingsRate,
      investmentRate,
      emergencyFundMonths,
      spendingEntries,
      topCategory,
      activeGoals,
      highestPriorityGoal,
      isOverspending: totalIncome > 0 && totalExpenses > totalIncome,
      hasNoIncome: totalIncome <= 0,
      hasNoExpenses: totalExpenses <= 0,
      hasEmergencyFund: emergencyFundMonths >= this.config.emergencyFundMonths,
      hasStrongEmergencyFund:
        emergencyFundMonths >= this.config.strongEmergencyFundMonths,
      hasInvestments: investmentAmount > 0,
      isSavingWell: savingsRate >= this.config.targetSavingsRate,
      needsSavingsImprovement: savingsRate < this.config.targetSavingsRate,
      needsBudgetAttention:
        totalIncome > 0 && expensesToIncomeRatio >= this.config.highExpenseRatio
    };
  }

  _generateRecommendationSet(profile, analysis) {
    const candidates = [];

    this._pushUnique(candidates, this._createSpendingRecommendation(profile, analysis));
    this._pushUnique(candidates, this._createSavingsRecommendation(profile, analysis));
    this._pushUnique(candidates, this._createEmergencyFundRecommendation(profile, analysis));
    this._pushUnique(candidates, this._createInvestmentRecommendation(profile, analysis));
    this._pushUnique(candidates, this._createGoalRecommendation(profile, analysis));
    this._pushUnique(candidates, this._createStateBasedRecommendation(profile, analysis));
    this._pushUnique(candidates, this._createWeeklyActionRecommendation(profile, analysis));

    return this._selectBalancedRecommendations(candidates, this.config.maxRecommendations);
  }

  _createSpendingRecommendation(profile, analysis) {
    if (analysis.hasNoExpenses) {
      return {
        priority: 'medium',
        category: 'spending',
        message: 'Start logging expenses by category so you can see where your money goes each month.'
      };
    }

    if (analysis.isOverspending) {
      const overspendAmount = Math.abs(analysis.netCashFlow);

      return {
        priority: 'high',
        category: 'spending',
        message: `You are spending $${this._money(overspendAmount)} more than your monthly income. Cut or pause non-essential spending until expenses are below income.`
      };
    }

    if (analysis.needsBudgetAttention) {
      return {
        priority: 'high',
        category: 'spending',
        message: `Your expenses use ${this._percent(analysis.expensesToIncomeRatio)}% of income. Try to bring this below ${this.config.healthyExpenseRatio}% by trimming flexible categories.`
      };
    }

    if (analysis.topCategory) {
      const top = analysis.topCategory;
      const categoryTip = CATEGORY_ADVICE[top.category] || CATEGORY_ADVICE.other;

      if (top.percentOfExpenses >= this.config.dominantCategoryPercent) {
        return {
          priority: 'high',
          category: 'spending',
          message: `${this._titleCase(top.category)} is your largest expense at $${this._money(top.amount)} (${this._percent(top.percentOfExpenses)}% of spending). ${categoryTip}`
        };
      }

      return {
        priority: 'medium',
        category: 'spending',
        message: `Your highest spending category is ${this._titleCase(top.category)} at $${this._money(top.amount)}. Review recent transactions there and reduce one repeat expense.`
      };
    }

    return {
      priority: 'medium',
      category: 'spending',
      message: 'Keep fixed expenses stable and review flexible spending weekly to prevent small purchases from adding up.'
    };
  }

  _createSavingsRecommendation(profile, analysis) {
    if (analysis.hasNoIncome) {
      return {
        priority: 'high',
        category: 'saving',
        message: 'Add income information first so your savings target can be calculated accurately.'
      };
    }

    if (analysis.netCashFlow < 0) {
      return {
        priority: 'high',
        category: 'saving',
        message: `Your monthly cash flow is negative by $${this._money(Math.abs(analysis.netCashFlow))}. Focus on reaching break-even before increasing savings goals.`
      };
    }

    if (analysis.savingsRate < this.config.starterSavingsRate) {
      const starterAmount = profile.totalIncome * (this.config.starterSavingsRate / 100);

      return {
        priority: 'high',
        category: 'saving',
        message: `Your savings rate is ${this._percent(analysis.savingsRate)}%. Aim first for ${this.config.starterSavingsRate}% of income, about $${this._money(starterAmount)} per month.`
      };
    }

    if (analysis.savingsRate < this.config.targetSavingsRate) {
      const targetAmount = profile.totalIncome * (this.config.targetSavingsRate / 100);

      return {
        priority: 'medium',
        category: 'saving',
        message: `Your savings rate is ${this._percent(analysis.savingsRate)}%. Increase it toward ${this.config.targetSavingsRate}% by saving about $${this._money(targetAmount)} per month.`
      };
    }

    return {
      priority: 'low',
      category: 'saving',
      message: `Your savings rate is ${this._percent(analysis.savingsRate)}%, which is strong. Keep transfers automatic and review goals monthly.`
    };
  }

  _createEmergencyFundRecommendation(profile, analysis) {
    if (profile.totalExpenses <= 0) {
      return null;
    }

    const target = profile.totalExpenses * this.config.emergencyFundMonths;
    const strongTarget = profile.totalExpenses * this.config.strongEmergencyFundMonths;

    if (analysis.emergencyFundMonths < 1) {
      return {
        priority: 'high',
        category: 'saving',
        message: `Your emergency fund covers about ${this._percent(analysis.emergencyFundMonths)} months of expenses. Build toward at least $${this._money(target)} before taking bigger financial risks.`
      };
    }

    if (analysis.emergencyFundMonths < this.config.emergencyFundMonths) {
      return {
        priority: 'medium',
        category: 'saving',
        message: `You have about ${this._percent(analysis.emergencyFundMonths)} months of expenses saved. Continue building toward $${this._money(target)} for a 3-month emergency fund.`
      };
    }

    if (analysis.emergencyFundMonths < this.config.strongEmergencyFundMonths) {
      return {
        priority: 'low',
        category: 'saving',
        message: `Your emergency fund is solid. For extra protection, consider growing it toward $${this._money(strongTarget)} over time.`
      };
    }

    return null;
  }

  _createInvestmentRecommendation(profile, analysis) {
    if (analysis.hasNoIncome) {
      return {
        priority: 'medium',
        category: 'investment',
        message: 'Investment planning works best after income and expenses are stable enough to calculate a safe recurring amount.'
      };
    }

    if (analysis.netCashFlow <= 0) {
      return {
        priority: 'medium',
        category: 'investment',
        message: 'Before increasing investments, first fix negative cash flow so you do not need to sell investments to cover monthly expenses.'
      };
    }

    if (!analysis.hasEmergencyFund) {
      return {
        priority: 'medium',
        category: 'investment',
        message: 'Prioritize your emergency fund first. After reaching 3 months of expenses, start or increase recurring investments gradually.'
      };
    }

    if (analysis.investmentRate <= 0) {
      return {
        priority: 'medium',
        category: 'investment',
        message: 'Your emergency fund looks ready for the next step. Consider starting small recurring investments that match your risk tolerance.'
      };
    }

    if (analysis.investmentRate < this.config.targetInvestmentRate) {
      return {
        priority: 'medium',
        category: 'investment',
        message: `You are investing ${this._percent(analysis.investmentRate)}% of income. If your budget allows, increase gradually toward ${this.config.targetInvestmentRate}-${this.config.strongInvestmentRate}% over time.`
      };
    }

    return {
      priority: 'low',
      category: 'investment',
      message: `You are investing ${this._percent(analysis.investmentRate)}% of income. Keep contributions consistent and review allocation periodically.`
    };
  }

  _createGoalRecommendation(profile, analysis) {
    const goal = analysis.highestPriorityGoal;

    if (!goal) {
      return {
        priority: 'medium',
        category: 'saving',
        message: 'Create one clear savings goal with a target amount and deadline so your monthly savings have a specific purpose.'
      };
    }

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    if (goal.targetAmount <= 0) {
      return {
        priority: 'medium',
        category: 'saving',
        message: `Your goal "${goal.name}" needs a target amount. Add a target so progress can be tracked correctly.`
      };
    }

    if (goal.progress >= 100) {
      return {
        priority: 'low',
        category: 'saving',
        message: `Your goal "${goal.name}" appears complete. Mark it completed and choose the next priority goal.`
      };
    }

    return {
      priority: goal.progress < 50 ? 'medium' : 'low',
      category: 'saving',
      message: `Your goal "${goal.name}" is ${this._percent(goal.progress)}% complete with $${this._money(remaining)} remaining. Set a weekly contribution to keep it moving.`
    };
  }

  _createStateBasedRecommendation(profile, analysis) {
    if (profile.financialState === 'budgeting') {
      return {
        priority: analysis.needsBudgetAttention ? 'high' : 'medium',
        category: 'action',
        message: 'Budgeting focus: separate expenses into essential and non-essential groups, then reduce one non-essential category this week.'
      };
    }

    if (profile.financialState === 'savings') {
      return {
        priority: analysis.needsSavingsImprovement ? 'high' : 'medium',
        category: 'action',
        message: 'Savings focus: automate your savings transfer immediately after income arrives, before discretionary spending begins.'
      };
    }

    if (profile.financialState === 'investment') {
      return {
        priority: 'medium',
        category: 'action',
        message: 'Investment focus: confirm your monthly investment amount still fits your emergency fund, budget, and risk tolerance.'
      };
    }

    if (profile.financialState === 'debt') {
      return {
        priority: 'high',
        category: 'action',
        message: 'Debt focus: list balances by interest rate and prioritize extra payments toward the highest-interest debt first.'
      };
    }

    return {
      priority: 'medium',
      category: 'action',
      message: 'Pick one financial focus for the month: reduce spending, build savings, pay debt, or increase investments.'
    };
  }

  _createWeeklyActionRecommendation(profile, analysis) {
    if (analysis.isOverspending) {
      return {
        priority: 'high',
        category: 'action',
        message: 'This week: freeze non-essential purchases for 7 days and redirect that money toward the monthly shortfall.'
      };
    }

    if (analysis.needsSavingsImprovement) {
      return {
        priority: 'medium',
        category: 'action',
        message: 'This week: schedule one automatic savings transfer, even if the starting amount is small.'
      };
    }

    if (analysis.topCategory) {
      return {
        priority: 'medium',
        category: 'action',
        message: `This week: review your last 10 ${this._titleCase(analysis.topCategory.category)} transactions and remove one repeat expense.`
      };
    }

    return {
      priority: 'medium',
      category: 'action',
      message: 'This week: track every expense for seven days and identify the easiest category to reduce next month.'
    };
  }

  _selectBalancedRecommendations(candidates, maxRecommendations) {
    const cleanCandidates = candidates.filter(
      (item) => item && item.message && item.category && item.priority
    );

    const selected = [];
    const requiredCategories = ['spending', 'saving', 'investment', 'action'];

    for (const category of requiredCategories) {
      const best = this._bestCandidateForCategory(cleanCandidates, category, selected);

      if (best) {
        selected.push(best);
      }
    }

    const remaining = cleanCandidates
      .filter((candidate) => !selected.includes(candidate))
      .sort((a, b) => this._priorityRank(b.priority) - this._priorityRank(a.priority));

    for (const candidate of remaining) {
      if (selected.length >= maxRecommendations) {
        break;
      }

      this._pushUnique(selected, candidate);
    }

    return selected
      .slice(0, maxRecommendations)
      .sort((a, b) => this._priorityRank(b.priority) - this._priorityRank(a.priority));
  }

  _bestCandidateForCategory(candidates, category, alreadySelected) {
    return (
      candidates
        .filter(
          (candidate) =>
            candidate.category === category && !alreadySelected.includes(candidate)
        )
        .sort((a, b) => this._priorityRank(b.priority) - this._priorityRank(a.priority))[0] ||
      null
    );
  }

  _pickHighestPriorityGoal(activeGoals) {
    if (!Array.isArray(activeGoals) || activeGoals.length === 0) {
      return null;
    }

    return [...activeGoals].sort((a, b) => {
      const aRemaining = Math.max(0, a.targetAmount - a.currentAmount);
      const bRemaining = Math.max(0, b.targetAmount - b.currentAmount);
      const aProgress = a.progress || 0;
      const bProgress = b.progress || 0;

      if (aProgress !== bProgress) {
        return aProgress - bProgress;
      }

      return bRemaining - aRemaining;
    })[0];
  }

  _categorizeByRules(description = '') {
    const text = String(description || '').toLowerCase().trim();

    if (!text) {
      return 'other';
    }

    const scores = VALID_TRANSACTION_CATEGORIES.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {});

    for (const rule of TRANSACTION_CATEGORY_RULES) {
      for (const keyword of rule.keywords) {
        const cleanKeyword = keyword.toLowerCase();

        if (text.includes(cleanKeyword)) {
          scores[rule.category] += cleanKeyword.length > 6 ? 2 : 1;
        }
      }
    }

    const bestMatch = Object.entries(scores)
      .filter(([category]) => category !== 'other')
      .sort((a, b) => b[1] - a[1])[0];

    return bestMatch && bestMatch[1] > 0 ? bestMatch[0] : 'other';
  }

  _calculateFinancialHealthScore(profile, analysis) {
    let score = 5;

    if (analysis.hasNoIncome) {
      score -= 2;
    }

    if (analysis.isOverspending) {
      score -= 2;
    } else if (
      analysis.expensesToIncomeRatio > 0 &&
      analysis.expensesToIncomeRatio <= this.config.healthyExpenseRatio
    ) {
      score += 1;
    } else if (analysis.expensesToIncomeRatio >= this.config.highExpenseRatio) {
      score -= 1;
    }

    if (analysis.savingsRate >= this.config.targetSavingsRate) {
      score += 2;
    } else if (analysis.savingsRate >= this.config.starterSavingsRate) {
      score += 1;
    } else if (analysis.savingsRate < 5) {
      score -= 1;
    }

    if (analysis.emergencyFundMonths >= this.config.strongEmergencyFundMonths) {
      score += 2;
    } else if (analysis.emergencyFundMonths >= this.config.emergencyFundMonths) {
      score += 1;
    } else if (profile.totalExpenses > 0 && analysis.emergencyFundMonths < 1) {
      score -= 1;
    }

    if (analysis.investmentRate >= this.config.targetInvestmentRate && analysis.hasEmergencyFund) {
      score += 1;
    }

    if (analysis.activeGoals.length > 0) {
      score += 1;
    }

    if (analysis.spendingEntries.length === 0 && profile.totalExpenses > 0) {
      score -= 1;
    }

    return Math.round(this._clamp(score, 1, 10));
  }

  _buildHealthAssessment(profile, analysis, score) {
    if (score >= 8) {
      return `Your financial health looks strong. You are saving ${this._percent(analysis.savingsRate)}% of income and your emergency fund covers about ${this._percent(analysis.emergencyFundMonths)} months of expenses.`;
    }

    if (score >= 6) {
      return 'Your financial health is stable but can improve. Focus on increasing savings, keeping expenses below income, and strengthening your emergency fund.';
    }

    if (score >= 4) {
      return 'Your financial health needs attention. Start by controlling spending, improving monthly cash flow, and building at least one month of emergency savings.';
    }

    return 'Your financial health is currently at risk. Prioritize essential expenses, reduce non-essential spending, and work toward positive monthly cash flow first.';
  }

  _buildSummary(profile, analysis) {
    if (analysis.hasNoIncome) {
      return 'Income information is missing, so recommendations focus on tracking, savings structure, and basic planning.';
    }

    if (analysis.isOverspending) {
      return `Expenses are currently higher than income by $${this._money(Math.abs(analysis.netCashFlow))}, so the main priority is reducing spending and reaching break-even.`;
    }

    if (analysis.isSavingWell && analysis.hasEmergencyFund) {
      return 'The profile shows healthy savings behavior and a reasonable emergency fund. The next focus is consistency and long-term investing.';
    }

    if (analysis.needsSavingsImprovement) {
      return 'The profile has positive areas, but savings should be improved to build more financial stability.';
    }

    return 'The profile is generally stable. Continue tracking spending, savings, goals, and investments regularly.';
  }

  _pushUnique(list, item) {
    if (!item || !item.message) {
      return;
    }

    const normalizedMessage = this._normalizeMessage(item.message);

    const exists = list.some((existing) => {
      return this._normalizeMessage(existing.message) === normalizedMessage;
    });

    if (!exists) {
      list.push(item);
    }
  }

  _normalizeMessage(message) {
    return String(message || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  _priorityRank(priority) {
    const ranks = {
      low: 1,
      medium: 2,
      high: 3
    };

    return ranks[String(priority || '').toLowerCase()] || 0;
  }

  _safeNumber(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  _money(value) {
    return this._safeNumber(value).toFixed(2);
  }

  _percent(value) {
    return this._safeNumber(value).toFixed(1);
  }

  _clamp(value, min, max) {
    return Math.min(max, Math.max(min, this._safeNumber(value)));
  }

  _titleCase(value) {
    return String(value || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

module.exports = RecommendationEngine;