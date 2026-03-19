# VoteChain — E-Voting System with Face Recognition & Blockchain

A production-grade, modular e-voting platform with:
- **JWT authentication** with role-based access (Admin / Voter / Candidate)
- **Face recognition** via face-api.js (128-d embeddings, cosine similarity, no raw images stored)
- **Private blockchain** (SHA-256, proof of work, immutable vote hashes)
- **MongoDB** with compound unique index preventing duplicate votes
- **Rate limiting**, input validation, and security hardening

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, face-api.js |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (HS256), bcryptjs |
| Face AI | face-api.js (TensorFlow.js) |
| Blockchain | Custom Node.js (SHA-256, PoW) |
| Security | Helmet, express-rate-limit, express-validator |

---

## Project Structure

```
evoting/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, getMe
│   │   ├── voterController.js     # Face register & verify
│   │   ├── voteController.js      # Cast vote + blockchain
│   │   └── mainControllers.js     # Elections, candidates, admin, blockchain
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + authorize
│   │   ├── rateLimiter.js         # express-rate-limit configs
│   │   └── validator.js           # express-validator rule sets
│   ├── models/
│   │   └── index.js               # User, Voter, Candidate, Election, Vote schemas
│   ├── routes/
│   │   ├── auth.js
│   │   ├── elections.js
│   │   ├── candidates.js
│   │   ├── voters.js
│   │   ├── votes.js
│   │   ├── blockchain.js
│   │   └── admin.js
│   ├── services/
│   │   ├── blockchain.js          # Block class, Blockchain class, hashVoteData()
│   │   └── faceRecognition.js     # cosineSimilarity(), verifyFace(), validateEmbedding()
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── models/                # ← face-api.js model weights go here (see below)
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js          # Sidebar + topbar shell
│   │   ├── context/
│   │   │   └── AuthContext.js     # React auth context + JWT rehydration
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Elections.js
│   │   │   ├── CandidateList.js
│   │   │   ├── Vote.js            # Face verify → cast vote flow
│   │   │   ├── FaceRegister.js    # Webcam → embedding → MongoDB
│   │   │   ├── BlockchainExplorer.js
│   │   │   ├── Results.js
│   │   │   ├── AdminCandidates.js
│   │   │   ├── MyVotes.js
│   │   │   └── Analytics.js
│   │   ├── services/
│   │   │   ├── api.js             # Axios wrapper for all API calls
│   │   │   └── useFaceRecognition.js  # React hook for face-api.js
│   │   ├── App.js                 # Routes + AuthProvider
│   │   ├── index.js
│   │   └── index.css              # Dark theme design system
│   └── package.json
│
├── seed.js                        # Demo data seeder
├── .env.example                   # Environment variable template
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### Step 1 — Clone and install dependencies

```bash
# Backend
cd evoting/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### Step 2 — Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/evoting
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=24h
FACE_SIMILARITY_THRESHOLD=0.6
NODE_ENV=development
```

---

### Step 3 — Download face-api.js model weights

The face recognition models must be placed in `frontend/public/models/`.

```bash
cd frontend/public
mkdir models && cd models

# Download these 6 files from the face-api.js GitHub releases:
# https://github.com/justadudewhohacks/face-api.js/tree/master/weights

# Required files:
# ssd_mobilenetv1_model-weights_manifest.json
# ssd_mobilenetv1_model-shard1
# face_landmark_68_model-weights_manifest.json
# face_landmark_68_model-shard1
# face_recognition_model-weights_manifest.json
# face_recognition_model-shard1
# face_recognition_model-shard2
```

Quick download script:
```bash
BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
for f in \
  ssd_mobilenetv1_model-weights_manifest.json \
  ssd_mobilenetv1_model-shard1 \
  face_landmark_68_model-weights_manifest.json \
  face_landmark_68_model-shard1 \
  face_recognition_model-weights_manifest.json \
  face_recognition_model-shard1 \
  face_recognition_model-shard2; do
  curl -O "$BASE/$f"
done
```

---

### Step 4 — Seed the database (optional)

```bash
cd evoting
node seed.js
```

This creates:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vote.com | admin123 |
| Voter | voter@vote.com | voter123 |
| Candidate | candidate@vote.com | cand123 |

---

### Step 5 — Run the application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App running on http://localhost:3000
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register voter or candidate |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user |

### Elections
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/elections` | JWT | List all elections |
| POST | `/api/elections` | Admin | Create election |
| PATCH | `/api/elections/:id` | Admin | Update status |

### Voting
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/votes` | Voter | Cast vote (requires face embedding) |
| GET | `/api/votes/my` | Voter | My vote history |
| GET | `/api/votes/results/:electionId` | JWT | Live results |

### Face Recognition
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/voters/face/register` | Voter | Store 128-d embedding |
| POST | `/api/voters/face/verify` | Voter | Verify face before voting |

### Blockchain
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/blockchain` | JWT | Full chain |
| GET | `/api/blockchain/validate` | JWT | Validate integrity |
| GET | `/api/blockchain/block/:index` | JWT | Single block |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/voters` | Admin | All voters (no embeddings) |
| PATCH | `/api/candidates/:id/approve` | Admin | Approve/reject candidate |

---

## Security Architecture

### Duplicate Vote Prevention
The Vote model has a compound unique index:
```js
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });
```
This prevents duplicate votes at both the application layer AND the database layer.

### Face Verification Flow
```
Webcam frame
    → face-api.js SSD detection
    → 68 landmark points
    → 128-dimensional embedding (Float32Array)
    → cosine_similarity(stored_embedding, live_embedding)
    → similarity >= 0.6 threshold → ALLOW
    → similarity < 0.6 → REJECT (logged)
```

### Blockchain Vote Recording
```
vote_data = { voterId, candidateId, electionId, timestamp }
vote_hash = SHA-256(vote_data)           ← only hash stored on chain
block = { index, timestamp, vote_hash, prev_hash, nonce }
block.hash = SHA-256(block contents + nonce)  ← proof of work
```

Raw vote data is stored only in MongoDB. The blockchain stores only the hash, making it tamper-evident without exposing voter identity.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | 5000 |
| `MONGO_URI` | MongoDB connection string | localhost:27017/evoting |
| `JWT_SECRET` | JWT signing secret | **CHANGE THIS** |
| `JWT_EXPIRE` | Token expiry | 24h |
| `FACE_SIMILARITY_THRESHOLD` | Minimum face match score | 0.6 |
| `NODE_ENV` | Environment | development |

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value (32+ chars)
- [ ] Use MongoDB Atlas or a secured MongoDB instance
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (reverse proxy: nginx or Caddy)
- [ ] Set `CLIENT_URL` in `.env` to your frontend domain
- [ ] Run `npm run build` in frontend and serve statically
- [ ] Consider storing blockchain to MongoDB for persistence across restarts
- [ ] Add liveness detection to face recognition (anti-spoofing)
