const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getAllVoters } = require('../controllers/mainControllers');

r.get('/stats',   protect, authorize('admin'), getDashboardStats);
r.get('/voters',  protect, authorize('admin'), getAllVoters);

module.exports = r;
