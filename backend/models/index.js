const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── USER MODEL ────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  role:      { type: String, enum: ['admin', 'voter', 'candidate'], default: 'voter' },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── VOTER MODEL ───────────────────────────────────────────
// Stores face embedding (NOT raw image) for privacy
const voterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  // 128-dimensional face embedding vector from face-api.js
  faceEmbedding: { type: [Number], required: false, default: null },
  faceRegistered: { type: Boolean, default: false },
  registeredAt: { type: Date },
});

// ── CANDIDATE MODEL ───────────────────────────────────────
const candidateSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  electionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  party:          { type: String, required: true, trim: true },
  symbol:         { type: String, default: '🌟' },
  statement:      { type: String, maxlength: 500 },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:     { type: Date },
  createdAt:      { type: Date, default: Date.now },
});

// ── ELECTION MODEL ────────────────────────────────────────
const electionSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  status:    { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

// Virtual: auto-compute status based on time
electionSchema.methods.computeStatus = function () {
  const now = new Date();
  if (now < this.startTime) return 'draft';
  if (now >= this.startTime && now <= this.endTime) return 'active';
  return 'closed';
};

// ── VOTE MODEL ────────────────────────────────────────────
const voteSchema = new mongoose.Schema({
  voterId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Voter', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  electionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  voteHash:    { type: String, required: true }, // SHA-256 hash stored on blockchain
  blockIndex:  { type: Number },                 // Reference to blockchain block
  createdAt:   { type: Date, default: Date.now },
});

// CRITICAL: Compound unique index — prevents duplicate voting
// A voter can only vote ONCE per election
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

module.exports = {
  User:      mongoose.model('User', userSchema),
  Voter:     mongoose.model('Voter', voterSchema),
  Candidate: mongoose.model('Candidate', candidateSchema),
  Election:  mongoose.model('Election', electionSchema),
  Vote:      mongoose.model('Vote', voteSchema),
};
