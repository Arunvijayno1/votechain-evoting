const rateLimit = require('express-rate-limit');

// Global limiter — all routes
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for login — prevent brute force
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

// Vote limiter — very strict
const voteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { success: false, message: 'Too many vote attempts. Contact support.' },
});

// Face scan limiter
const faceScanRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: { success: false, message: 'Too many face scan attempts. Please wait.' },
});

module.exports = { globalRateLimiter, loginRateLimiter, voteRateLimiter, faceScanRateLimiter };
