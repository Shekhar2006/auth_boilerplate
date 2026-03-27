import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { AuthLayout, Alert } from '../components/AuthLayout'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password strength
  const pw = form.password
  const strength = !pw ? 0
    : pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) ? 3
    : pw.length >= 8 ? 2
    : 1
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e']

  // Invalid token — no token in URL
  if (!token) {
    return (
      <AuthLayout
        headline="Invalid <em>link</em>"
        sub="This reset link is missing or broken."
        features={['Links expire after 1 hour', 'Request a new one anytime']}
      >
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="form-title" style={{ textAlign: 'center' }}>Invalid link</h1>
          <p className="form-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>This reset link is missing or broken.</p>
          <Link to="/forgot-password" className="form-link">Request a new reset link →</Link>
        </div>
      </AuthLayout>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (strength < 2) {
      setError('Password is too weak. Use 8+ characters, one uppercase, one number.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. This link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        headline="Password <em>reset</em>"
        sub="You're all set."
        features={['All sessions have been signed out', 'Use your new password to sign in']}
      >
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div className="success-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="form-title" style={{ textAlign: 'center' }}>Password updated!</h1>
          <p className="form-subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Your password has been reset. Redirecting you to sign in…
          </p>
          <Link to="/login" className="form-link">Sign in now →</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline="New <em>password</em>"
      sub="Choose a strong password you haven't used before."
      features={['Minimum 8 characters', 'One uppercase letter required', 'One number required']}
    >
      <div className="form-card">
        <h1 className="form-title">Set new password</h1>
        <p className="form-subtitle">Make it strong and memorable.</p>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                required
                className="form-input"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.password}
                onChange={e => { setForm(f => ({...f, password: e.target.value})); setError('') }}
              />
              <button type="button" className="input-toggle" onClick={() => setShowPassword(v => !v)} aria-label="Toggle password">
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3].map(n => (
                    <div key={n} style={{
                      flex: 1, height: 3, borderRadius: 99,
                      background: n <= strength ? strengthColor[strength] : '#e2e8f0',
                      transition: 'background 0.2s'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm new password</label>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`form-input ${form.confirm && form.confirm !== form.password ? 'error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => { setForm(f => ({...f, confirm: e.target.value})); setError('') }}
            />
            {form.confirm && form.confirm !== form.password && (
              <p className="field-error">Passwords don't match.</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !form.password || !form.confirm}
          >
            {loading ? <><div className="btn-spinner" /> Resetting…</> : 'Reset password'}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login" className="form-link">← Back to sign in</Link>
        </div>
      </div>
    </AuthLayout>
  )
}