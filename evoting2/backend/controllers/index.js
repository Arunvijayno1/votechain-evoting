const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Voter, Candidate, Election, Vote } = require('../models');
const { verifyFace, findDuplicateFace, validateEmbedding } = require('../services/faceRecognition');
const { blockchain, hashVoteData } = require('../services/blockchain');

// ── AUTH ──────────────────────────────────────────────────
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const safeRole = ['voter','candidate'].includes(role) ? role : 'voter';
    const user = await User.create({ name, email, password, role: safeRole });
    if (safeRole === 'voter') await Voter.create({ userId: user._id });
    res.status(201).json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    res.json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.getMe = (req, res) => res.json({ success: true, user: req.user });

// ── VOTER / FACE ──────────────────────────────────────────
exports.registerFace = async (req, res, next) => {
  try {
    const { embedding } = req.body;
    if (!validateEmbedding(embedding))
      return res.status(400).json({ success: false, message: 'Invalid 128-d embedding' });

    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter profile not found' });

    // Duplicate face check — block same face on multiple accounts
    const others = await Voter.find({ userId: { $ne: req.user._id }, faceRegistered: true });
    const dup = findDuplicateFace(embedding, others);
    if (dup.duplicate)
      return res.status(409).json({ success: false, message: 'This face is already registered to another account.' });

    voter.faceEmbedding = embedding; voter.faceRegistered = true; voter.registeredAt = new Date();
    await voter.save();
    res.json({ success: true, message: 'Face registered' });
  } catch (err) { next(err); }
};

exports.verifyFaceEmbedding = async (req, res, next) => {
  try {
    const { embedding } = req.body;
    if (!validateEmbedding(embedding))
      return res.status(400).json({ success: false, message: 'Invalid embedding' });
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter?.faceRegistered)
      return res.status(400).json({ success: false, message: 'Face not registered. Register first.' });
    const result = verifyFace(voter.faceEmbedding, embedding);
    if (!result.verified)
      return res.status(401).json({ success: false, verified: false, similarity: result.similarity, threshold: result.threshold, message: result.reason });
    res.json({ success: true, verified: true, similarity: result.similarity, message: 'Identity verified' });
  } catch (err) { next(err); }
};

exports.getVoterProfile = async (req, res, next) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id }).select('-faceEmbedding');
    res.json({ success: true, voter });
  } catch (err) { next(err); }
};

// ── ELECTIONS ─────────────────────────────────────────────
exports.createElection = async (req, res, next) => {
  try {
    const { title, startTime, endTime } = req.body;
    if (new Date(endTime) <= new Date(startTime))
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    const election = await Election.create({ title, startTime, endTime, status: 'active', createdBy: req.user._id });
    res.status(201).json({ success: true, election });
  } catch (err) { next(err); }
};

exports.getElections = async (req, res, next) => {
  try {
    // Auto-close elections past end time
    await Election.updateMany({ status: 'active', endTime: { $lt: new Date() } }, { status: 'closed' });
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json({ success: true, elections });
  } catch (err) { next(err); }
};

exports.getElection = async (req, res, next) => {
  try {
    const e = await Election.findById(req.params.id);
    if (!e) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, election: e });
  } catch (err) { next(err); }
};

exports.updateElectionStatus = async (req, res, next) => {
  try {
    const e = await Election.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, election: e });
  } catch (err) { next(err); }
};

// ── CANDIDATES ────────────────────────────────────────────
exports.applyAsCandidate = async (req, res, next) => {
  try {
    const { electionId, party, symbol, statement } = req.body;
    const existing = await Candidate.findOne({ userId: req.user._id, electionId });
    if (existing) return res.status(409).json({ success: false, message: 'Already applied' });
    const c = await Candidate.create({ userId: req.user._id, electionId, party, symbol: symbol || '—', statement, approvalStatus: 'pending' });
    res.status(201).json({ success: true, candidate: c });
  } catch (err) { next(err); }
};

exports.getCandidates = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.electionId) filter.electionId = req.query.electionId;
    if (req.query.status)     filter.approvalStatus = req.query.status;
    const candidates = await Candidate.find(filter).populate('userId','name email').populate('electionId','title');
    res.json({ success: true, candidates });
  } catch (err) { next(err); }
};

exports.approveCandidate = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved','rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });
    const c = await Candidate.findByIdAndUpdate(req.params.id, { approvalStatus: status, approvedBy: req.user._id, approvedAt: new Date() }, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, candidate: c });
  } catch (err) { next(err); }
};

// ── VOTES ─────────────────────────────────────────────────
exports.castVote = async (req, res, next) => {
  try {
    const { candidateId, electionId, faceEmbedding } = req.body;
    if (!validateEmbedding(faceEmbedding))
      return res.status(400).json({ success: false, message: 'Face embedding required' });

    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter?.faceRegistered)
      return res.status(400).json({ success: false, message: 'Register your face before voting' });

    // Strict face check
    const face = verifyFace(voter.faceEmbedding, faceEmbedding);
    if (!face.verified)
      return res.status(401).json({ success: false, message: `Face check failed: ${face.reason}` });

    // Election must be active
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });
    const now = new Date();
    if (election.status !== 'active' || now < new Date(election.startTime) || now > new Date(election.endTime))
      return res.status(400).json({ success: false, message: 'Election is not currently active' });

    // Candidate must be approved
    const candidate = await Candidate.findOne({ _id: candidateId, electionId, approvalStatus: 'approved' });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not approved' });

    // Already voted?
    if (await Vote.findOne({ voterId: voter._id, electionId }))
      return res.status(409).json({ success: false, message: 'You have already voted in this election' });

    // Hash + blockchain
    const timestamp = new Date().toISOString();
    const voteHash  = hashVoteData({ voterId: voter._id.toString(), candidateId, electionId, timestamp });
    const block     = blockchain.addVoteBlock(voteHash);

    await Vote.create({ voterId: voter._id, candidateId, electionId, voteHash, blockIndex: block.index });

    res.status(201).json({ success: true, message: 'Vote recorded', voteHash, blockIndex: block.index, blockHash: block.hash, timestamp });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate vote blocked' });
    next(err);
  }
};

exports.getResults = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: 'Not found' });

    const agg = await Vote.aggregate([
      { $match: { electionId: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidateId', voteCount: { $sum: 1 } } },
      { $sort: { voteCount: -1 } },
    ]);
    const total = agg.reduce((s, r) => s + r.voteCount, 0);

    // All approved candidates (include 0-vote ones)
    const allCands = await Candidate.find({ electionId, approvalStatus: 'approved' }).populate('userId','name');
    const votedIds = new Map(agg.map(r => [r._id.toString(), r.voteCount]));

    const results = allCands.map(c => ({
      candidateId: c._id,
      name:        c.userId?.name || 'Unknown',
      party:       c.party,
      symbol:      c.symbol,
      voteCount:   votedIds.get(c._id.toString()) || 0,
      percentage:  total > 0 ? parseFloat(((votedIds.get(c._id.toString()) || 0) / total * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.voteCount - a.voteCount);

    res.json({ success: true, election, results, totalVotes: total, status: election.status });
  } catch (err) { next(err); }
};

exports.getMyVotes = async (req, res, next) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) return res.json({ success: true, votes: [] });
    const votes = await Vote.find({ voterId: voter._id })
      .populate('electionId','title status')
      .populate({ path: 'candidateId', populate: { path: 'userId', select: 'name' } });
    res.json({ success: true, votes });
  } catch (err) { next(err); }
};

// ── ADMIN ─────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalVoters, totalCandidates, totalElections, totalVotes, pendingCandidates] =
      await Promise.all([Voter.countDocuments(), Candidate.countDocuments({ approvalStatus:'approved' }), Election.countDocuments(), Vote.countDocuments(), Candidate.countDocuments({ approvalStatus:'pending' })]);
    res.json({ success: true, stats: { totalVoters, totalCandidates, totalElections, totalVotes, pendingCandidates, blockchain: blockchain.getStats() } });
  } catch (err) { next(err); }
};

exports.getAllVoters = async (req, res, next) => {
  try {
    const voters = await Voter.find().populate('userId','name email createdAt').select('-faceEmbedding');
    res.json({ success: true, voters });
  } catch (err) { next(err); }
};

// ── BLOCKCHAIN ────────────────────────────────────────────
exports.getChain     = (req, res) => res.json({ success: true, chain: blockchain.chain, stats: blockchain.getStats() });
exports.validateChain= (req, res) => { const v = blockchain.isChainValid(); res.json({ success: true, isValid: v, message: v ? 'Chain is valid' : 'Chain tampered!' }); };
exports.getBlock     = (req, res) => { const b = blockchain.chain[parseInt(req.params.index)]; if (!b) return res.status(404).json({ success: false }); res.json({ success: true, block: b }); };
