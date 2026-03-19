const { Vote, Election, Candidate, Voter } = require('../models');
const { verifyFace, validateEmbedding } = require('../services/faceRecognition');
const { blockchain, hashVoteData } = require('../services/blockchain');

// ── Cast Vote ─────────────────────────────────────────────
exports.castVote = async (req, res, next) => {
  try {
    const { candidateId, electionId, faceEmbedding } = req.body;

    // 1. Validate face embedding is provided
    if (!validateEmbedding(faceEmbedding)) {
      return res.status(400).json({ success: false, message: 'Valid face embedding required to vote' });
    }

    // 2. Load voter and verify face
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter?.faceRegistered) {
      return res.status(400).json({ success: false, message: 'Face not registered' });
    }

    const faceResult = verifyFace(voter.faceEmbedding, faceEmbedding);
    if (!faceResult.verified) {
      return res.status(401).json({
        success: false,
        message: `Face verification failed (similarity: ${faceResult.similarity})`,
        similarity: faceResult.similarity,
      });
    }

    // 3. Verify election is active
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });

    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      return res.status(400).json({ success: false, message: 'Election is not currently active' });
    }

    // 4. Verify candidate is approved for this election
    const candidate = await Candidate.findOne({ _id: candidateId, electionId, approvalStatus: 'approved' });
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found or not approved' });
    }

    // 5. Check for duplicate vote (compound index also prevents this at DB level)
    const existingVote = await Vote.findOne({ voterId: voter._id, electionId });
    if (existingVote) {
      return res.status(409).json({ success: false, message: 'You have already voted in this election' });
    }

    // 6. Generate vote hash for blockchain (voter_id + candidate_id + election_id + timestamp)
    const timestamp = new Date().toISOString();
    const voteHash  = hashVoteData({
      voterId     : voter._id.toString(),
      candidateId : candidateId,
      electionId  : electionId,
      timestamp,
    });

    // 7. Add to blockchain — only the hash is stored, never raw vote data
    const block = blockchain.addVoteBlock(voteHash);

    // 8. Save vote to MongoDB
    const vote = await Vote.create({
      voterId     : voter._id,
      candidateId,
      electionId,
      voteHash,
      blockIndex  : block.index,
    });

    console.log(`✅ Vote cast — Block #${block.index} — Hash: ${voteHash.slice(0, 16)}...`);

    res.status(201).json({
      success    : true,
      message    : 'Vote cast successfully',
      voteHash,
      blockIndex : block.index,
      blockHash  : block.hash,
      timestamp,
    });
  } catch (err) {
    // Duplicate vote caught at MongoDB unique index level
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate vote detected and blocked' });
    }
    next(err);
  }
};

// ── Get results for an election ───────────────────────────
exports.getResults = async (req, res, next) => {
  try {
    const { electionId } = req.params;

    const results = await Vote.aggregate([
      { $match: { electionId: require('mongoose').Types.ObjectId(electionId) } },
      { $group: { _id: '$candidateId', voteCount: { $sum: 1 } } },
      { $sort: { voteCount: -1 } },
    ]);

    // Populate candidate info
    const Candidate = require('../models').Candidate;
    const populated = await Promise.all(results.map(async (r) => {
      const cand = await Candidate.findById(r._id).populate('userId', 'name');
      return {
        candidateId  : r._id,
        name         : cand?.userId?.name || 'Unknown',
        party        : cand?.party,
        voteCount    : r.voteCount,
      };
    }));

    res.json({ success: true, results: populated });
  } catch (err) {
    next(err);
  }
};

// ── Get voter's own vote history ──────────────────────────
exports.getMyVotes = async (req, res, next) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id });
    const votes = await Vote.find({ voterId: voter._id })
      .populate({ path: 'electionId', select: 'title' })
      .populate({ path: 'candidateId', populate: { path: 'userId', select: 'name' } });

    res.json({ success: true, votes });
  } catch (err) {
    next(err);
  }
};
