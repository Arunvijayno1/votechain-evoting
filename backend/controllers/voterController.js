const { Voter, User } = require('../models');
const { verifyFace, validateEmbedding, findDuplicateFace } = require('../services/faceRecognition');

/** Register face — with duplicate-face detection across ALL voters */
exports.registerFace = async (req, res, next) => {
  try {
    const { embedding } = req.body;
    if (!validateEmbedding(embedding))
      return res.status(400).json({ success: false, message: 'Invalid face embedding (must be 128-d array)' });

    // Load ALL existing registered faces to check for duplicates
    const allVoters = await Voter.find({ faceRegistered: true });
    const currentVoter = await Voter.findOne({ userId: req.user._id });

    // Exclude this user's own existing embedding from duplicate check
    const othersVoters = allVoters.filter(v => v.userId.toString() !== req.user._id.toString());
    const dupCheck = findDuplicateFace(embedding, othersVoters);

    if (dupCheck.duplicate) {
      return res.status(409).json({
        success: false,
        message: 'This face is already registered to another account. One person can only have one voter account.',
        similarity: dupCheck.cosine,
      });
    }

    if (!currentVoter)
      return res.status(404).json({ success: false, message: 'Voter profile not found' });

    currentVoter.faceEmbedding  = embedding;
    currentVoter.faceRegistered = true;
    currentVoter.registeredAt   = new Date();
    await currentVoter.save();

    res.json({ success: true, message: 'Face registered successfully' });
  } catch (err) { next(err); }
};

/** Verify face — strict dual-gate check */
exports.verifyFaceEmbedding = async (req, res, next) => {
  try {
    const { embedding } = req.body;
    if (!validateEmbedding(embedding))
      return res.status(400).json({ success: false, message: 'Invalid embedding format' });

    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter?.faceRegistered)
      return res.status(400).json({ success: false, message: 'Face not registered. Please register your face first.' });

    const result = verifyFace(voter.faceEmbedding, embedding);

    if (!result.verified) {
      console.warn(`⚠ FAILED face verify — user ${req.user._id} — cosine: ${result.cosine} euclidean: ${result.euclidean}`);
      return res.status(401).json({
        success: false, verified: false,
        similarity: result.cosine,
        euclidean: result.euclidean,
        threshold: result.threshold,
        message: `Face verification failed: ${result.reason}`,
      });
    }

    console.log(`✅ Face verified — user ${req.user._id} — cosine: ${result.cosine}`);
    res.json({ success: true, verified: true, similarity: result.cosine, message: 'Identity verified' });
  } catch (err) { next(err); }
};

exports.getVoterProfile = async (req, res, next) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id }).select('-faceEmbedding');
    res.json({ success: true, voter });
  } catch (err) { next(err); }
};
