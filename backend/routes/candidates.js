const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { applyAsCandidate, getCandidates, approveCandidate } = require('../controllers/mainControllers');
const { candidateRules, validate } = require('../middleware/validator');

r.get('/',               protect, getCandidates);
r.post('/apply',         protect, authorize('candidate'), candidateRules, validate, applyAsCandidate);
r.patch('/:id/approve',  protect, authorize('admin'), approveCandidate);

module.exports = r;
