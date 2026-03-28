# Auth Boilerplate

A production-ready authentication system built with React, Node.js, Express, and PostgreSQL. Designed to be reused across projects — clone, configure, and build your app on top.

---

## Features

- **Email & Password auth** — register, login, logout
- **Email verification** — token-based, expires in 24h
- **Forgot / Reset password** — secure token, expires in 1h
- **OAuth 2.0** — Google and GitHub (easily extendable)
- **JWT auth** — access token (15min) + refresh token (7 days) with automatic rotation
- **Multi-device logout** — logout single device or all devices
- **Rate limiting** — brute-force protection on all sensitive endpoints
- **Security hardened** — Helmet, CORS, bcrypt (12 rounds), hashed refresh tokens, email enumeration prevention

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router v7 |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT, Passport.js |
| Email | Nodemailer (Ethereal for dev, any SMTP for prod) |
| Logging | Winston |

---

## Project Structure

```
auth-boilerplate/
├── client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # Axios instance with silent token refresh
│   │   ├── components/
│   │   │   ├── AuthLayout.jsx     # Shared two-column layout
│   │   │   └── ProtectedRoute.jsx # Route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   └── OAuthCallback.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── server/                        # Express backend
    ├── src/
    │   ├── config/
    │   │   ├── passport.js        # Google & GitHub OAuth strategies
    │   │   └── logger.js          # Winston logger
    │   ├── controllers/
    │   │   └── authController.js  # All route handlers
    │   ├── db/
    │   │   ├── pool.js            # PostgreSQL connection pool
    │   │   └── schema.sql         # Database schema
    │   ├── middleware/
    │   │   ├── authenticate.js    # JWT auth guard
    │   │   └── rateLimiter.js     # Rate limiters
    │   ├── routes/
    │   │   └── authRoutes.js      # Route definitions + validation
    │   ├── services/
    │   │   ├── jwtService.js      # Token signing, rotation, revocation
    │   │   └── emailService.js    # Email templates + sending
    │   └── index.js               # Express app entry point
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- A Google OAuth app (optional)
- A GitHub OAuth app (optional)
- An SMTP provider (Ethereal for dev)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/auth-boilerplate.git
cd auth-boilerplate
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Fill in your `.env` (see Environment Variables section below).

### 3. Create the database

```bash
createdb -U postgres auth_db
```

Then run the migration:

```bash
npm run db:migrate
```

This creates the `users`, `oauth_accounts`, and `refresh_tokens` tables.

### 4. Set up the client

```bash
cd ../client
npm install
cp .env.example .env
```

Client `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Run the project

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

### Server (`server/.env`)

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/auth_db

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_64_byte_hex_secret
JWT_REFRESH_SECRET=your_different_64_byte_hex_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth — https://console.developers.google.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth — https://github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# SMTP — use https://ethereal.email for development
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Auth App <no-reply@yourapp.com>"
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register with email + password | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| POST | `/api/auth/logout` | Logout current device | No |
| POST | `/api/auth/logout-all` | Logout all devices | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No (cookie) |
| GET | `/api/auth/me` | Get current user | Yes |

### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/verify-email?token=` | Verify email address |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Password Reset

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/forgot-password` | Send reset link to email |
| POST | `/api/auth/reset-password` | Reset password with token |

### OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/github` | Start GitHub OAuth flow |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |

---

## Database Schema

```sql
users
  id                    UUID PRIMARY KEY
  email                 TEXT UNIQUE
  password_hash         TEXT (null for OAuth-only users)
  name                  TEXT
  avatar_url            TEXT
  is_email_verified     BOOLEAN
  email_verify_token    TEXT
  email_verify_expires  TIMESTAMPTZ
  password_reset_token  TEXT
  password_reset_expires TIMESTAMPTZ
  created_at            TIMESTAMPTZ
  updated_at            TIMESTAMPTZ

oauth_accounts
  id           UUID PRIMARY KEY
  user_id      UUID → users.id
  provider     TEXT  ('google' | 'github')
  provider_id  TEXT

refresh_tokens
  id          UUID PRIMARY KEY
  user_id     UUID → users.id
  token_hash  TEXT  (SHA-256 hash, never raw)
  expires_at  TIMESTAMPTZ
  user_agent  TEXT
  ip_address  TEXT
```

---

## Security Decisions

| Decision | Reason |
|----------|--------|
| Refresh tokens hashed in DB | A DB breach doesn't expose valid tokens |
| Refresh token cookie scoped to `/api/auth/refresh` | Minimizes exposure surface |
| Generic error messages on login | Prevents email enumeration |
| Constant-time 200 on forgot-password | Prevents email enumeration |
| All sessions revoked on password reset | Protects against compromised sessions |
| OAuth accounts linked by email | Same user across multiple providers |
| bcrypt with 12 rounds | Balance between security and performance |

---

## Reusing in a New Project

1. Copy the entire boilerplate
2. Change the app name in `package.json` and `index.css`
3. Fill in a fresh `.env` with new secrets
4. Run `db:migrate`
5. Replace the placeholder `Dashboard` in `App.jsx` with your real app

---

## Switching to Production Email

Replace Ethereal credentials with a real SMTP provider:

**Resend (recommended — generous free tier):**
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
EMAIL_FROM="Your App <no-reply@yourdomain.com>"
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

---

## License

MIT