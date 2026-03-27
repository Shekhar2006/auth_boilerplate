require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const { generalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const logger = require('./config/logger');

const app = express();

// ─── Security middleware ──────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.set('trust proxy', 1); // Trust first proxy (needed for rate limiter + req.ip)

// ─── Body / cookie parsing ────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Passport (stateless — no sessions) ──────────────────
app.use(passport.initialize());

// ─── Rate limiting ────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Routes ───────────────────────────────────────────────

app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── 404 handler ─────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));

// ─── Global error handler ─────────────────────────────────

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ message: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

module.exports = app;