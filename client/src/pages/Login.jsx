import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthLayout, Alert, GoogleIcon, GitHubIcon } from '../components/AuthLayout'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const urlError = new URLSearchParams(location.search).get('error')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      headline="Welcome <em>back</em>"
      sub="Sign in to your account and pick up right where you left off."
      features={[
        'JWT access + refresh token rotation',
        'Google & GitHub OAuth',
        'Email verification & password reset',
      ]}
    >
      <div className="form-card">
        <h1 className="form-title">Sign in</h1>
        <p className="form-subtitle">Don't have an account? <Link to="/register" className="form-link">Create one</Link></p>

        {/* OAuth error from redirect */}
        {urlError && (
          <Alert type="error">
            {urlError === 'google_failed' ? 'Google sign-in failed. Please try again.' :
             urlError === 'github_failed' ? 'GitHub sign-in failed. Please try again.' :
             'OAuth sign-in failed. Please try again.'}
          </Alert>
        )}

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              className={`form-input ${error ? 'error' : ''}`}
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
                autoComplete="current-password"
                required
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="input-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <div className="form-helper">
              <Link to="/forgot-password" className="form-link" style={{ fontSize: '0.8125rem' }}>Forgot password?</Link>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><div className="btn-spinner" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <div className="oauth-divider">or continue with</div>

        <div className="oauth-buttons">
          <a href={`${API_URL}/auth/google`} className="btn-oauth">
            <GoogleIcon /> Google
          </a>
          <a href={`${API_URL}/auth/github`} className="btn-oauth">
            <GitHubIcon /> GitHub
          </a>
        </div>
      </div>
    </AuthLayout>
  )
}