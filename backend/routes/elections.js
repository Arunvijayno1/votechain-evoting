// routes/elections.js
const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createElection, getElections, getElection, updateElectionStatus } = require('../controllers/mainControllers');
const { electionRules, validate } = require('../middleware/validator');

r.get('/',           protect, getElections);
r.get('/:id',        protect, getElection);
r.post('/',          protect, authorize('admin'), electionRules, validate, createElection);
r.patch('/:id',      protect, authorize('admin'), updateElectionStatus);

module.exports = r;
