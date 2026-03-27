require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool = require('../db/pool');
const logger = require('./logger');

// ─── Helper: find or create user from OAuth profile ───────
async function findOrCreateOAuthUser(provider, providerId, profile) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if this OAuth account already exists
    const { rows: existing } = await client.query(
      'SELECT u.* FROM users u JOIN oauth_accounts oa ON oa.user_id = u.id WHERE oa.provider = $1 AND oa.provider_id = $2',
      [provider, providerId]
    );
    if (existing.length > 0) {
      await client.query('COMMIT');
      return existing[0];
    }

    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.username;
    const avatarUrl = profile.photos?.[0]?.value;

    // 2. If email exists, link this OAuth to the existing account
    let userId;
    if (email) {
      const { rows: byEmail } = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (byEmail.length > 0) {
        userId = byEmail[0].id;
      }
    }

    // 3. Otherwise create a new user
    if (!userId) {
      const { rows: newUser } = await client.query(
        `INSERT INTO users (email, name, avatar_url, is_email_verified)
         VALUES ($1, $2, $3, TRUE)
         RETURNING *`,
        [email, name, avatarUrl]
      );
      userId = newUser[0].id;
    }

    // 4. Always create the oauth_accounts row
    await client.query(
      'INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1, $2, $3)',
      [userId, provider, providerId]
    );

    await client.query('COMMIT');

    const { rows: finalUser } = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    return finalUser[0];
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('OAuth findOrCreate error', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

// ─── Google ───────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    scope: ['profile', 'email'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser('google', profile.id, profile);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// ─── GitHub ───────────────────────────────────────────────
passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/github/callback`,
    scope: ['user:email'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser('github', profile.id, profile);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;