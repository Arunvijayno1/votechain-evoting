const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, select: false },
  role:      { type: String, enum: ['admin','voter','candidate'], default: 'voter' },
  createdAt: { type: Date, default: Date.now },
});
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function(p) { return bcrypt.compare(p, this.password); };

const voterSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  faceEmbedding:  { type: [Number], default: null },
  faceRegistered: { type: Boolean, default: false },
  registeredAt:   { type: Date },
});

const candidateSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  electionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  party:          { type: String, required: true },
  symbol:         { type: String, default: '—' },
  statement:      { type: String, maxlength: 500 },
  approvalStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:     { type: Date },
  createdAt:      { type: Date, default: Date.now },
});

const electionSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  status:    { type: String, enum: ['draft','active','closed'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const voteSchema = new mongoose.Schema({
  voterId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Voter', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  electionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  voteHash:    { type: String, required: true },
  blockIndex:  { type: Number },
  createdAt:   { type: Date, default: Date.now },
});
// Compound unique index — prevents duplicate votes
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

module.exports = {
  User:      mongoose.model('User', userSchema),
  Voter:     mongoose.model('Voter', voterSchema),
  Candidate: mongoose.model('Candidate', candidateSchema),
  Election:  mongoose.model('Election', electionSchema),
  Vote:      mongoose.model('Vote', voteSchema),
};
