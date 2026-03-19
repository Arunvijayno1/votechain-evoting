const { body, validationResult } = require('express-validator');

// ── Validate request and return errors ───────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ── Validation Rule Sets ──────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['voter', 'candidate']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const electionRules = [
  body('title').trim().notEmpty().withMessage('Election title is required'),
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('endTime').isISO8601().withMessage('Valid end time required'),
];

const candidateRules = [
  body('electionId').isMongoId().withMessage('Valid election ID required'),
  body('party').trim().notEmpty().withMessage('Party name is required'),
];

const voteRules = [
  body('candidateId').isMongoId().withMessage('Valid candidate ID required'),
  body('electionId').isMongoId().withMessage('Valid election ID required'),
];

module.exports = { validate, registerRules, loginRules, electionRules, candidateRules, voteRules };
