require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { globalRateLimiter } = require('./middleware/rateLimiter');

// ── Connect Database ──────────────────────────────────────
connectDB();

const app = express();

// ── Security Middleware ───────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' })); // Allow base64 face images
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(globalRateLimiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/elections',  require('./routes/elections'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/voters',     require('./routes/voters'));
app.use('/api/votes',      require('./routes/votes'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/admin',      require('./routes/admin'));

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
