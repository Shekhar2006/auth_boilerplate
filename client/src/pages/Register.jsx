import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthLayout, Alert, GoogleIcon, GitHubIcon } from '../components/AuthLayout'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Register() {
  const { register } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  // Simple client-side password strength
  const password = form.password
  const strength = !password ? 0
    : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : password.length >= 8 ? 2
    : 1

  const strengthLabel = ['', 'Weak', 'Fair', 'Strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e']

  async function handleSubmit(e) {
    e.preventDefault()
    if (strength < 2) {
      setError('Password must be at least 8 characters with one uppercase letter and one number.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(form.email, form.password, form.name)
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.length) {
        setError(data.errors[0].msg)
      } else {
        setError(data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        headline="Check your <em>inbox</em>"
        sub="One last step before you're in."
        features={['Secure email verification', 'Link expires in 24 hours', 'Resend anytime if needed']}
      >
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div className="success-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="form-title" style={{ textAlign: 'center' }}>Almost there!</h1>
          <p className="form-subtitle" style={{ textAlign: 'center', maxWidth: 320, margin: '0 auto 1.5rem' }}>
            We've sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" className="form-link" style={{ fontSize: '0.9375rem' }}>← Back to sign in</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline="Create your <em>account</em>"
      sub="Join thousands of developers using this auth boilerplate in production."
      features={[
        'Email verification on signup',
        'OAuth with Google & GitHub',
        'Secure JWT with refresh rotation',
      ]}
    >
      <div className="form-card">
        <h1 className="form-title">Get started</h1>
        <p className="form-subtitle">Already have an account? <Link to="/login" className="form-link">Sign in</Link></p>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              autoFocus
              className="form-input"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="form-input"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {/* Password strength bar */}
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
                <span style={{ fontSize: '0.75rem', color: strengthColor[strength] }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><div className="btn-spinner" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <div className="oauth-divider">or sign up with</div>

        <div className="oauth-buttons">
          <a href={`${API_URL}/auth/google`} className="btn-oauth">
            <GoogleIcon /> Google
          </a>
          <a href={`${API_URL}/auth/github`} className="btn-oauth">
            <GitHubIcon /> GitHub
          </a>
        </div>

        <p className="form-footer" style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: '#94a3b8' }}>
          By creating an account you agree to our Terms of Service.
        </p>
      </div>
    </AuthLayout>
  )
}