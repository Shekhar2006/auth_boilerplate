const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pool');
const logger = require('../config/logger');

// ─── Token signing ────────────────────────────────────────

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    issuer: 'auth-boilerplate',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'auth-boilerplate',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: 'auth-boilerplate' });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, { issuer: 'auth-boilerplate' });
}

// ─── Refresh token persistence ────────────────────────────

/**
 * Saves a hashed refresh token to the DB. Returns the raw token.
 * We store the hash so a DB breach doesn't expose valid tokens.
 */
async function saveRefreshToken(userId, token, { userAgent = null, ipAddress = null } = {}) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, userAgent, ipAddress]
  );
}

/**
 * Validates a refresh token against the DB.
 * Returns the DB row if valid, throws if not found or expired.
 */
async function validateRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash]
  );
  if (rows.length === 0) {
    throw new Error('Refresh token not found or expired');
  }
  return rows[0];
}

/** Deletes a specific refresh token (logout from one device). */
async function deleteRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

/** Deletes all refresh tokens for a user (logout from all devices). */
async function deleteAllRefreshTokens(userId) {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

/** Rotate: delete old token, return new access + refresh tokens. */
async function rotateRefreshToken(oldToken, user, options = {}) {
  await deleteRefreshToken(oldToken);

  const payload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await saveRefreshToken(user.id, refreshToken, options);

  return { accessToken, refreshToken };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  saveRefreshToken,
  validateRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
  rotateRefreshToken,
};