const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getChain, validateChain, getBlock } = require('../controllers/mainControllers');

r.get('/',                protect, getChain);
r.get('/validate',        protect, validateChain);
r.get('/block/:index',    protect, getBlock);

module.exports = r;
