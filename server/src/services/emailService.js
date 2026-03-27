const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// ─── Transport ────────────────────────────────────────────

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// ─── Base template ────────────────────────────────────────

function baseTemplate(title, bodyHtml) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
        body { margin: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #1a1a2e; padding: 28px 32px; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
        .body { padding: 32px; color: #374151; font-size: 15px; line-height: 1.6; }
        .body p { margin: 0 0 16px; }
        .btn { display: inline-block; margin: 8px 0 24px; padding: 12px 28px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; }
        .note { font-size: 13px; color: #9ca3af; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
        .link-fallback { font-size: 12px; color: #9ca3af; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Auth App</h1></div>
        <div class="body">${bodyHtml}</div>
      </div>
    </body>
    </html>
  `;
}

// ─── Send helper ─────────────────────────────────────────

async function sendMail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info('Email sent', { to, subject, messageId: info.messageId });
    // In dev, log preview URL (Ethereal)
    if (nodemailer.getTestMessageUrl(info)) {
      logger.info('Email preview URL', { url: nodemailer.getTestMessageUrl(info) });
    }
  } catch (err) {
    logger.error('Email send failed', { to, subject, error: err.message });
    throw err;
  }
}

// ─── Email types ─────────────────────────────────────────

async function sendVerificationEmail(user, token) {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your email address',
    html: baseTemplate('Verify your email', `
      <p>Hi ${user.name || 'there'},</p>
      <p>Thanks for signing up! Please verify your email address to activate your account.</p>
      <a href="${url}" class="btn">Verify Email</a>
      <p class="note">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
      <p class="link-fallback">Or copy this link: ${url}</p>
    `),
  });
}

async function sendPasswordResetEmail(user, token) {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your password',
    html: baseTemplate('Reset your password', `
      <p>Hi ${user.name || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="${url}" class="btn">Reset Password</a>
      <p class="note">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
      <p class="link-fallback">Or copy this link: ${url}</p>
    `),
  });
}

async function sendPasswordChangedEmail(user) {
  await sendMail({
    to: user.email,
    subject: 'Your password has been changed',
    html: baseTemplate('Password changed', `
      <p>Hi ${user.name || 'there'},</p>
      <p>This is a confirmation that your password was successfully changed.</p>
      <p>If you did not make this change, please <a href="${process.env.CLIENT_URL}/forgot-password">reset your password immediately</a> and contact support.</p>
    `),
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};