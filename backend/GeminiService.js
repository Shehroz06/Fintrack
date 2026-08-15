'use strict';

/**
 * Thin wrapper around the Gemini generateContent REST API.
 * Uses Node's built-in fetch (no SDK dependency) and structured
 * JSON output (responseSchema) so callers get parsed data directly
 * instead of having to regex text out of a free-form reply.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 15000;

const RECOMMENDATIONS_SCHEMA = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          category: { type: 'string', enum: ['spending', 'saving', 'investment', 'action'] },
          message: { type: 'string' }
        },
        required: ['priority', 'category', 'message']
      }
    }
  },
  required: ['recommendations']
};

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async _generateContent(prompt, responseSchema) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema
            }
          })
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody.slice(0, 300)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini API returned no content');
      }

      return JSON.parse(text);
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateRecommendations(profileSummary) {
    const prompt = `${profileSummary}\n\nBased on this financial profile, generate 3 to 5 short, specific, actionable financial tips. Each needs a priority (high, medium, or low), a category (spending, saving, investment, or action), and a concise message (max 2 sentences, plain text, no markdown).`;

    const result = await this._generateContent(prompt, RECOMMENDATIONS_SCHEMA);

    if (!Array.isArray(result.recommendations) || result.recommendations.length === 0) {
      throw new Error('Gemini API returned no recommendations');
    }

    return result.recommendations;
  }

  async categorizeTransaction(description, validCategories) {
    const schema = {
      type: 'object',
      properties: {
        category: { type: 'string', enum: validCategories }
      },
      required: ['category']
    };

    const prompt = `Classify this personal finance transaction description into exactly one category: "${description}"`;
    const result = await this._generateContent(prompt, schema);

    if (!validCategories.includes(result.category)) {
      throw new Error('Gemini API returned an invalid category');
    }

    return result.category;
  }
}

module.exports = GeminiService;
