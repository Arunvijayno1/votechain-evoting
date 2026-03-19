const { Election, Candidate, Vote, User, Voter } = require('../models');
const { blockchain } = require('../services/blockchain');

// ════════════════════════════════════════════════════════
// ELECTION CONTROLLER
// ════════════════════════════════════════════════════════

exports.createElection = async (req, res, next) => {
  try {
    const { title, startTime, endTime } = req.body;
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }
    const election = await Election.create({ title, startTime, endTime, status: 'active', createdBy: req.user._id });
    res.status(201).json({ success: true, election });
  } catch (err) { next(err); }
};

exports.getElections = async (req, res, next) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json({ success: true, elections });
  } catch (err) { next(err); }
};

exports.getElection = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });
    res.json({ success: true, election });
  } catch (err) { next(err); }
};

exports.updateElectionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const election = await Election.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });
    res.json({ success: true, election });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════
// CANDIDATE CONTROLLER
// ════════════════════════════════════════════════════════

exports.applyAsCandidate = async (req, res, next) => {
  try {
    const { electionId, party, symbol, statement } = req.body;

    // Prevent duplicate applications
    const existing = await Candidate.findOne({ userId: req.user._id, electionId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already applied for this election' });
    }

    const candidate = await Candidate.create({
      userId: req.user._id, electionId, party, symbol: symbol || '🌟',
      statement, approvalStatus: 'pending',
    });
    res.status(201).json({ success: true, candidate });
  } catch (err) { next(err); }
};

exports.getCandidates = async (req, res, next) => {
  try {
    const filter = req.query.electionId ? { electionId: req.query.electionId } : {};
    if (req.query.status) filter.approvalStatus = req.query.status;
    const candidates = await Candidate.find(filter)
      .populate('userId', 'name email')
      .populate('electionId', 'title');
    res.json({ success: true, candidates });
  } catch (err) { next(err); }
};

exports.approveCandidate = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: status, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, candidate });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ════════════════════════════════════════════════════════

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalVoters, totalCandidates, totalElections, totalVotes, pendingCandidates] =
      await Promise.all([
        Voter.countDocuments(),
        Candidate.countDocuments({ approvalStatus: 'approved' }),
        Election.countDocuments(),
        Vote.countDocuments(),
        Candidate.countDocuments({ approvalStatus: 'pending' }),
      ]);

    const blockchainStats = blockchain.getStats();

    res.json({
      success: true,
      stats: {
        totalVoters, totalCandidates, totalElections, totalVotes,
        pendingCandidates, blockchain: blockchainStats,
      },
    });
  } catch (err) { next(err); }
};

exports.getAllVoters = async (req, res, next) => {
  try {
    const voters = await Voter.find()
      .populate('userId', 'name email createdAt')
      .select('-faceEmbedding'); // Never expose embedding in API
    res.json({ success: true, voters });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════
// BLOCKCHAIN CONTROLLER
// ════════════════════════════════════════════════════════

exports.getChain = async (req, res) => {
  res.json({ success: true, chain: blockchain.getChain(), stats: blockchain.getStats() });
};

exports.validateChain = async (req, res) => {
  const isValid = blockchain.isChainValid();
  res.json({ success: true, isValid, message: isValid ? 'Chain is valid' : 'Chain has been tampered!' });
};

exports.getBlock = async (req, res) => {
  const block = blockchain.getBlock(parseInt(req.params.index));
  if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
  res.json({ success: true, block });
};
