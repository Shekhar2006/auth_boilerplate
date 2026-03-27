const { Pool } = require('pg');
const logger = require('../config/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Failed to connect to PostgreSQL', { error: err.message });
    process.exit(1);
  }
  release();
  logger.info('PostgreSQL connected');
});

module.exports = pool;