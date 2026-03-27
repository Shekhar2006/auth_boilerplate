const rateLimit = require('express-rate-limit');

// Strict limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Loose limiter for general API usage
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

// Very strict limiter for password reset + resend verification
const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in an hour.' },
});

module.exports = { authLimiter, generalLimiter, sensitiveActionLimiter };