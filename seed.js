/**
 * Seed script — creates demo admin, voter, candidate accounts
 * Run: node backend/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { User, Voter, Candidate, Election } = require('./backend/models');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Voter.deleteMany(), Candidate.deleteMany(), Election.deleteMany()]);
  console.log('Cleared existing data');

  // Create admin
  const admin = await User.create({
    name: 'Admin User', email: 'admin@vote.com',
    password: 'admin123', role: 'admin',
  });

  // Create voters
  const voter1 = await User.create({
    name: 'Mala Krishnan', email: 'voter@vote.com',
    password: 'voter123', role: 'voter',
  });
  const voter2 = await User.create({
    name: 'Deepak Singh', email: 'voter2@vote.com',
    password: 'voter123', role: 'voter',
  });
  await Voter.create({ userId: voter1._id });
  await Voter.create({ userId: voter2._id });

  // Create candidates
  const cand1 = await User.create({
    name: 'Arjun Mehta', email: 'candidate@vote.com',
    password: 'cand123', role: 'candidate',
  });
  const cand2 = await User.create({
    name: 'Priya Sharma', email: 'candidate2@vote.com',
    password: 'cand123', role: 'candidate',
  });

  // Create election
  const election = await Election.create({
    title: 'General Election 2025',
    startTime: new Date(),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'active',
    createdBy: admin._id,
  });

  // Add candidates to election
  await Candidate.create({
    userId: cand1._id, electionId: election._id,
    party: 'Progressive Alliance', symbol: '🌟',
    statement: 'Building a better tomorrow for all citizens.',
    approvalStatus: 'approved', approvedBy: admin._id, approvedAt: new Date(),
  });
  await Candidate.create({
    userId: cand2._id, electionId: election._id,
    party: 'National Front', symbol: '🦅',
    statement: 'Strength, unity, and prosperity for our nation.',
    approvalStatus: 'approved', approvedBy: admin._id, approvedAt: new Date(),
  });

  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Admin:     admin@vote.com     / admin123');
  console.log('  Voter:     voter@vote.com     / voter123');
  console.log('  Candidate: candidate@vote.com / cand123');
  console.log('\nElection created:', election.title);

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
