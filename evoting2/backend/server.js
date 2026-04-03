require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const connectDB = require('./config/db');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

connectDB();
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(globalRateLimiter);

app.use('/api/auth',       routes.auth);
app.use('/api/elections',  routes.elections);
app.use('/api/candidates', routes.candidates);
app.use('/api/voters',     routes.voters);
app.use('/api/votes',      routes.votes);
app.use('/api/blockchain', routes.blockchain);
app.use('/api/admin',      routes.admin);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});

app.listen(process.env.PORT || 5000, () => console.log('Server on :' + (process.env.PORT || 5000)));
