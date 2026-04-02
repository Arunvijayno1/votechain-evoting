const rateLimit = require('express-rate-limit');

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  message: { success: false, message: 'Too many requests.' },
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

// Relaxed for dev — tighten in production
const voteRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many vote attempts.' },
});

const faceScanRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 30,
  message: { success: false, message: 'Too many face scan attempts.' },
});

module.exports = { globalRateLimiter, loginRateLimiter, voteRateLimiter, faceScanRateLimiter };
