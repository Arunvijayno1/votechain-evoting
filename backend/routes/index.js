const c = require('../controllers');
const { protect, authorize } = require('../middleware/auth');
const { loginRateLimiter, voteRateLimiter, faceScanLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, electionRules, candidateRules, voteRules, validate } = require('../middleware/validator');
const express = require('express');

// Auth
const auth = express.Router();
auth.post('/register', registerRules, validate, c.register);
auth.post('/login', loginRateLimiter, loginRules, validate, c.login);
auth.get('/me', protect, c.getMe);

// Elections
const elections = express.Router();
elections.get('/', protect, c.getElections);
elections.get('/:id', protect, c.getElection);
elections.post('/', protect, authorize('admin'), electionRules, validate, c.createElection);
elections.patch('/:id', protect, authorize('admin'), c.updateElectionStatus);

// Candidates
const candidates = express.Router();
candidates.get('/', protect, c.getCandidates);
candidates.post('/apply', protect, authorize('candidate'), candidateRules, validate, c.applyAsCandidate);
candidates.patch('/:id/approve', protect, authorize('admin'), c.approveCandidate);

// Voters / Face
const voters = express.Router();
voters.get('/profile', protect, c.getVoterProfile);
voters.post('/face/register', protect, authorize('voter'), faceScanLimiter, c.registerFace);
voters.post('/face/verify', protect, authorize('voter'), faceScanLimiter, c.verifyFaceEmbedding);

// Votes
const votes = express.Router();
votes.post('/', protect, authorize('voter'), voteRateLimiter, voteRules, validate, c.castVote);
votes.get('/my', protect, authorize('voter'), c.getMyVotes);
votes.get('/results/:electionId', protect, c.getResults);

// Blockchain
const blockchain = express.Router();
blockchain.get('/', protect, c.getChain);
blockchain.get('/validate', protect, c.validateChain);
blockchain.get('/block/:index', protect, c.getBlock);

// Admin
const admin = express.Router();
admin.get('/stats', protect, authorize('admin'), c.getDashboardStats);
admin.get('/voters', protect, authorize('admin'), c.getAllVoters);

module.exports = { auth, elections, candidates, voters, votes, blockchain, admin };
