const router = require('express').Router();
const { body } = require('express-validator');
const passport = require('../config/passport');
const controller = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { authLimiter, sensitiveActionLimiter } = require('../middleware/rateLimiter');

// ─── Validation schemas ───────────────────────────────────

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const emailRule = [body('email').isEmail().normalizeEmail()];

const resetPasswordRules = [
  body('token').notEmpty(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[0-9]/),
];

// ─── Local auth ───────────────────────────────────────────

router.post('/register', authLimiter, registerRules, controller.register);
router.post('/login', authLimiter, loginRules, controller.login);
router.post('/logout', controller.logout);
router.post('/logout-all', authenticate, controller.logoutAll);
router.post('/refresh', controller.refresh);

// ─── Email verification ───────────────────────────────────

router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', sensitiveActionLimiter, emailRule, controller.resendVerification);

// ─── Password reset ───────────────────────────────────────

router.post('/forgot-password', sensitiveActionLimiter, emailRule, controller.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, controller.resetPassword);

// ─── Current user ─────────────────────────────────────────

router.get('/me', authenticate, controller.getMe);

// ─── Google OAuth ─────────────────────────────────────────

router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  controller.oauthCallback
);

// ─── GitHub OAuth ─────────────────────────────────────────

router.get('/github', passport.authenticate('github', { session: false, scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=github_failed` }),
  controller.oauthCallback
);

module.exports = router;