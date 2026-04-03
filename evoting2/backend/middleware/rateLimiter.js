const rateLimit = require('express-rate-limit');
const msg = (m) => ({ success: false, message: m });

const globalRateLimiter = rateLimit({ windowMs: 15*60*1000, max: 500, message: msg('Too many requests') });
const loginRateLimiter  = rateLimit({ windowMs: 15*60*1000, max: 20,  message: msg('Too many login attempts'), skipSuccessfulRequests: true });
const voteRateLimiter   = rateLimit({ windowMs:  5*60*1000, max: 10,  message: msg('Too many vote attempts') });
const faceScanLimiter   = rateLimit({ windowMs: 10*60*1000, max: 30,  message: msg('Too many face scan attempts') });

module.exports = { globalRateLimiter, loginRateLimiter, voteRateLimiter, faceScanLimiter };
