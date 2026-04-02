/**
 * Run this to create admin + demo accounts:
 * cd backend && node ../create-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const voters = db.collection('voters');

  const accounts = [
    { name: 'Admin',      email: 'admin@vote.com',     password: 'admin123', role: 'admin' },
    { name: 'Demo Voter', email: 'voter@vote.com',      password: 'voter123', role: 'voter' },
    { name: 'Candidate',  email: 'candidate@vote.com',  password: 'cand123',  role: 'candidate' },
  ];

  for (const acc of accounts) {
    await users.deleteOne({ email: acc.email });
    const hash = await bcrypt.hash(acc.password, 12);
    const res  = await users.insertOne({
      name: acc.name, email: acc.email, password: hash,
      role: acc.role, createdAt: new Date(),
    });
    if (acc.role === 'voter') {
      await voters.deleteOne({ userId: res.insertedId });
      await voters.insertOne({ userId: res.insertedId, faceRegistered: false, faceEmbedding: null });
    }
    console.log(`✓ Created ${acc.role}: ${acc.email} / ${acc.password}`);
  }

  console.log('\nAll accounts ready. Start the backend: cd backend && npm run dev');
  await mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
