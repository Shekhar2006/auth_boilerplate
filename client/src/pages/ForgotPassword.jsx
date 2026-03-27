import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { AuthLayout, Alert } from '../components/AuthLayout'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      headline="Reset your <em>password</em>"
      sub="Enter your email and we'll send you a secure link to choose a new one."
      features={[
        'Reset link expires in 1 hour',
        'All sessions revoked after reset',
        'Confirmation email sent on change',
      ]}
    >
      <div className="form-card">
        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div className="success-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className="form-title" style={{ textAlign: 'center' }}>Check your email</h1>
            <p className="form-subtitle" style={{ textAlign: 'center', maxWidth: 300, margin: '0 auto 1.5rem' }}>
              If an account with <strong>{email}</strong> exists, a reset link is on its way.
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Didn't get it? Check your spam folder or{' '}
              <button
                onClick={() => { setSubmitted(false); setEmail('') }}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, fontWeight: 500 }}
              >
                try again
              </button>.
            </p>
            <Link to="/login" className="form-link" style={{ fontSize: '0.9375rem' }}>← Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="form-title">Forgot password?</h1>
            <p className="form-subtitle">
              Remember it? <Link to="/login" className="form-link">Sign in</Link>
            </p>

            {error && <Alert type="error">{error}</Alert>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading || !email}>
                {loading ? <><div className="btn-spinner" /> Sending link…</> : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}