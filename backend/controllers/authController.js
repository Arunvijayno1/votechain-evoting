const jwt      = require('jsonwebtoken');
const { User, Voter } = require('../models');

// ── Generate JWT ──────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

// ── Register ──────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Only admin can create admin accounts; default to voter
    const safeRole = ['voter', 'candidate'].includes(role) ? role : 'voter';
    const user = await User.create({ name, email, password, role: safeRole });

    // If voter, create a voter profile automatically
    if (safeRole === 'voter') {
      await Voter.create({ userId: user._id });
    }

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── Get current user ──────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
