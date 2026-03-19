const { Voter } = require('../models');
const { verifyFace, validateEmbedding } = require('../services/faceRecognition');

// ── Register Face Embedding ───────────────────────────────
// Receives 128-d embedding vector from frontend face-api.js
// NEVER receives or stores raw image data
exports.registerFace = async (req, res, next) => {
  try {
    const { embedding } = req.body;

    if (!validateEmbedding(embedding)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid face embedding. Must be a 128-dimensional numeric array.',
      });
    }

    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter profile not found' });
    }

    voter.faceEmbedding  = embedding;
    voter.faceRegistered = true;
    voter.registeredAt   = new Date();
    await voter.save();

    res.json({ success: true, message: 'Face registered successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Verify Face Embedding ─────────────────────────────────
// Used before casting a vote — compares live embedding with stored one
exports.verifyFaceEmbedding = async (req, res, next) => {
  try {
    const { embedding } = req.body;

    if (!validateEmbedding(embedding)) {
      return res.status(400).json({ success: false, message: 'Invalid embedding format' });
    }

    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter || !voter.faceRegistered) {
      return res.status(400).json({ success: false, message: 'Face not registered. Register first.' });
    }

    const result = verifyFace(voter.faceEmbedding, embedding);

    if (!result.verified) {
      // Log failed attempt for security audit
      console.warn(`⚠ Face verification FAILED for voter ${voter._id} — similarity: ${result.similarity}`);
      return res.status(401).json({
        success   : false,
        verified  : false,
        similarity: result.similarity,
        threshold : result.threshold,
        message   : `Face verification failed. Similarity ${result.similarity} < threshold ${result.threshold}`,
      });
    }

    console.log(`✅ Face verified for voter ${voter._id} — similarity: ${result.similarity}`);
    res.json({
      success   : true,
      verified  : true,
      similarity: result.similarity,
      threshold : result.threshold,
      message   : 'Face verified successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Voter Profile ─────────────────────────────────────
exports.getVoterProfile = async (req, res, next) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id }).select('-faceEmbedding');
    res.json({ success: true, voter });
  } catch (err) {
    next(err);
  }
};
