/**
 * Minimal in-memory rate limiter for auth endpoints (login/register brute-force
 * protection). Fixed window per IP — no new dependency, no shared store, which
 * is fine for a single-process app like this one.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const attempts = new Map(); // ip -> { count, windowStart }

module.exports = function authLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, error: 'Too many attempts. Please try again later.' });
  }

  record.count += 1;
  next();
};
