const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const registerRules  = [body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })];
const loginRules     = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];
const electionRules  = [body('title').trim().notEmpty(), body('startTime').isISO8601(), body('endTime').isISO8601()];
const candidateRules = [body('electionId').isMongoId(), body('party').trim().notEmpty()];
const voteRules      = [body('candidateId').isMongoId(), body('electionId').isMongoId()];

module.exports = { validate, registerRules, loginRules, electionRules, candidateRules, voteRules };
