const jwtService = require('../services/jwtService');
const logger = require('../config/logger');

/**
 * Middleware to protect routes.
 * Reads the JWT from the Authorization header (Bearer) or httpOnly cookie.
 * Attaches decoded payload to req.user on success.
 */
module.exports = function authenticate(req, res, next) {
  // 1. Try Authorization header first (for API clients / mobile)
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // 2. Fall back to cookie (for browser clients)
  const cookieToken = req.cookies?.accessToken;

  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwtService.verifyAccessToken(token);
    req.user = { id: decoded.sub, email: decoded.email };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};