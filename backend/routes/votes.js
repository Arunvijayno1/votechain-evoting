const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { castVote, getResults, getMyVotes } = require('../controllers/voteController');
const { voteRateLimiter } = require('../middleware/rateLimiter');
const { voteRules, validate } = require('../middleware/validator');

r.post('/',                    protect, authorize('voter'), voteRateLimiter, voteRules, validate, castVote);
r.get('/my',                   protect, authorize('voter'), getMyVotes);
r.get('/results/:electionId',  protect, getResults);

module.exports = r;
