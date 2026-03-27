const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const pool = require('../db/pool');
const jwtService = require('../services/jwtService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────

function safeUser(user) {
  const { password_hash, email_verify_token, password_reset_token, ...safe } = user;
  return safe;
}

function setCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',         // Scope cookie to refresh endpoint only
  });
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

function clearCookies(res) {
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.clearCookie('accessToken');
}

// ─── Register ─────────────────────────────────────────────

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password, name } = req.body;

  try {
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verify_token, email_verify_expires)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email.toLowerCase(), passwordHash, name, verifyToken, verifyExpires]
    );

    const user = rows[0];
    await emailService.sendVerificationEmail(user, verifyToken);

    return res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
      user: safeUser(user),
    });
  } catch (err) {
    logger.error('Register error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── Login ────────────────────────────────────────────────

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    // Generic error — don't reveal whether email exists
    const INVALID_MSG = 'Invalid email or password.';

    if (!user || !user.password_hash) return res.status(401).json({ message: INVALID_MSG });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: INVALID_MSG });

    if (!user.is_email_verified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = jwtService.signAccessToken(payload);
    const refreshToken = jwtService.signRefreshToken(payload);

    await jwtService.saveRefreshToken(user.id, refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    setCookies(res, accessToken, refreshToken);

    return res.json({
      message: 'Logged in successfully.',
      user: safeUser(user),
      accessToken, // Also send in body so SPAs can choose storage strategy
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── Refresh Token ────────────────────────────────────────

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token provided.' });

  try {
    // 1. Verify JWT signature + expiry
    const decoded = jwtService.verifyRefreshToken(token);

    // 2. Validate against DB (ensures revoked tokens are rejected)
    await jwtService.validateRefreshToken(token);

    // 3. Get user
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
    if (!rows.length) return res.status(401).json({ message: 'User not found.' });

    // 4. Rotate tokens (delete old, issue new)
    const { accessToken, refreshToken: newRefreshToken } = await jwtService.rotateRefreshToken(
      token,
      rows[0],
      { userAgent: req.headers['user-agent'], ipAddress: req.ip }
    );

    setCookies(res, accessToken, newRefreshToken);

    return res.json({ accessToken });
  } catch (err) {
    clearCookies(res);
    return res.status(401).json({ message: 'Invalid or expired refresh token. Please log in again.' });
  }
};

// ─── Logout ───────────────────────────────────────────────

exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) {
    try { await jwtService.deleteRefreshToken(token); } catch (_) {}
  }
  clearCookies(res);
  return res.json({ message: 'Logged out successfully.' });
};

exports.logoutAll = async (req, res) => {
  try {
    await jwtService.deleteAllRefreshTokens(req.user.id);
    clearCookies(res);
    return res.json({ message: 'Logged out from all devices.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── Email Verification ───────────────────────────────────

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Verification token is required.' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email_verify_token = $1 AND email_verify_expires > NOW()`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    const user = rows[0];
    if (user.is_email_verified) {
      return res.json({ message: 'Email already verified.' });
    }

    await pool.query(
      `UPDATE users SET is_email_verified = TRUE, email_verify_token = NULL, email_verify_expires = NULL WHERE id = $1`,
      [user.id]
    );

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    logger.error('Email verification error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.resendVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    // Always return 200 to prevent email enumeration
    if (!rows.length || rows[0].is_email_verified) {
      return res.json({ message: 'If an unverified account exists, a new verification email has been sent.' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET email_verify_token = $1, email_verify_expires = $2 WHERE id = $3`,
      [verifyToken, verifyExpires, rows[0].id]
    );

    await emailService.sendVerificationEmail(rows[0], verifyToken);

    return res.json({ message: 'If an unverified account exists, a new verification email has been sent.' });
  } catch (err) {
    logger.error('Resend verification error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── Forgot Password ──────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    // Always return 200 — don't reveal whether email exists
    if (!rows.length) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
      [resetToken, resetExpires, rows[0].id]
    );

    await emailService.sendPasswordResetEmail(rows[0], resetToken);

    return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    logger.error('Forgot password error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── Reset Password ───────────────────────────────────────

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { token, password } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const user = rows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Invalidate all sessions after password change
    await jwtService.deleteAllRefreshTokens(user.id);
    clearCookies(res);

    await emailService.sendPasswordChangedEmail(user);

    return res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    logger.error('Reset password error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── Get current user ─────────────────────────────────────

exports.getMe = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: safeUser(rows[0]) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── OAuth callback handler ───────────────────────────────

exports.oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    const payload = { sub: user.id, email: user.email };
    const accessToken = jwtService.signAccessToken(payload);
    const refreshToken = jwtService.signRefreshToken(payload);

    await jwtService.saveRefreshToken(user.id, refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    setCookies(res, accessToken, refreshToken);

    // Redirect to frontend with token in query for initial hydration
    res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${accessToken}`);
  } catch (err) {
    logger.error('OAuth callback error', { error: err.message });
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};