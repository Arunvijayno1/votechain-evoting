// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, validate } = require('../middleware/validator');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRateLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
