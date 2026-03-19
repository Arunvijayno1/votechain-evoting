// routes/voters.js
const express = require('express');
const r1 = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { registerFace, verifyFaceEmbedding, getVoterProfile } = require('../controllers/voterController');
const { faceScanRateLimiter } = require('../middleware/rateLimiter');

r1.get('/profile',        protect, getVoterProfile);
r1.post('/face/register', protect, authorize('voter'), faceScanRateLimiter, registerFace);
r1.post('/face/verify',   protect, authorize('voter'), faceScanRateLimiter, verifyFaceEmbedding);

module.exports = r1;

// ── votes.js ──────────────────────────────────────────────
