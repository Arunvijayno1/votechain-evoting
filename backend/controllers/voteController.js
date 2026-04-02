const mongoose = require('mongoose');
const { Vote, Election, Candidate, Voter } = require('../models');
const { verifyFace, validateEmbedding } = require('../services/faceRecognition');
const { blockchain, hashVoteData } = require('../services/blockchain');

/** Cast Vote — full pipeline with strict face check */
exports.castVote = async (req, res, next) => {
  try {
    const { candidateId, electionId, faceEmbedding } = req.body;

    if (!validateEmbedding(faceEmbedding))
      return res.status(400).json({ success: false, message: 'Valid face embedding required to vote' });

    // 1. Load voter + verify face
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter?.faceRegistered)
      return res.status(400).json({ success: false, message: 'Please register your face before voting' });

    const faceResult = verifyFace(voter.faceEmbedding, faceEmbedding);
    if (!faceResult.verified) {
      return res.status(401).json({
        success: false,
        message: `Identity verification failed (${(faceResult.cosine * 100).toFixed(1)}% match < ${faceResult.threshold * 100}% required)`,
      });
    }

    // 2. Election must be active RIGHT NOW
    const election = await Election.findById(electionId);
    if (!election)
      return res.status(404).json({ success: false, message: 'Election not found' });

    const now = new Date();
    if (election.status !== 'active' || now < new Date(election.startTime) || now > new Date(election.endTime)) {
      return res.status(400).json({ success: false, message: 'This election is not currently active' });
    }

    // 3. Candidate must be approved for this election
    const candidate = await Candidate.findOne({
      _id: candidateId, electionId, approvalStatus: 'approved'
    });
    if (!candidate)
      return res.status(404).json({ success: false, message: 'Candidate not found or not approved' });

    // 4. Check duplicate vote (belt + suspenders — compound index also handles it)
    const existingVote = await Vote.findOne({ voterId: voter._id, electionId });
    if (existingVote)
      return res.status(409).json({ success: false, message: 'You have already voted in this election' });

    // 5. Hash vote for blockchain
    const timestamp = new Date().toISOString();
    const voteHash  = hashVoteData({ voterId: voter._id.toString(), candidateId, electionId, timestamp });

    // 6. Add to blockchain
    const block = blockchain.addVoteBlock(voteHash);

    // 7. Save vote in MongoDB
    const vote = await Vote.create({ voterId: voter._id, candidateId, electionId, voteHash, blockIndex: block.index });

    res.status(201).json({
      success: true, message: 'Vote recorded',
      voteHash, blockIndex: block.index, blockHash: block.hash, timestamp,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Duplicate vote blocked' });
    next(err);
  }
};

/** Live results — works during AND after election */
exports.getResults = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });

    const results = await Vote.aggregate([
      { $match: { electionId: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidateId', voteCount: { $sum: 1 } } },
      { $sort: { voteCount: -1 } },
    ]);

    const totalVotes = results.reduce((s, r) => s + r.voteCount, 0);

    const populated = await Promise.all(results.map(async (r) => {
      const cand = await Candidate.findById(r._id).populate('userId', 'name');
      return {
        candidateId : r._id,
        name        : cand?.userId?.name || 'Unknown',
        party       : cand?.party || '',
        symbol      : cand?.symbol || '🌟',
        voteCount   : r.voteCount,
        percentage  : totalVotes > 0 ? parseFloat((r.voteCount / totalVotes * 100).toFixed(1)) : 0,
      };
    }));

    // Also add candidates with 0 votes
    const allCandidates = await Candidate.find({ electionId, approvalStatus: 'approved' }).populate('userId', 'name');
    const resultIds = new Set(populated.map(r => r.candidateId.toString()));
    for (const c of allCandidates) {
      if (!resultIds.has(c._id.toString())) {
        populated.push({ candidateId: c._id, name: c.userId?.name, party: c.party, symbol: c.symbol, voteCount: 0, percentage: 0 });
      }
    }

    res.json({ success: true, election, results: populated, totalVotes, status: election.status });
  } catch (err) { next(err); }
};

exports.getMyVotes = async (req, res, next) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) return res.json({ success: true, votes: [] });
    const votes = await Vote.find({ voterId: voter._id })
      .populate('electionId', 'title status')
      .populate({ path: 'candidateId', populate: { path: 'userId', select: 'name' } });
    res.json({ success: true, votes });
  } catch (err) { next(err); }
};
