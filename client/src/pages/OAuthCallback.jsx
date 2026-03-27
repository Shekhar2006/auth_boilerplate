import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/AuthLayout'

/**
 * Landing page after Google/GitHub OAuth redirect.
 * Server redirects to: /oauth/callback?token=<accessToken>
 * We store the token, fetch the user, then redirect to the dashboard.
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { handleOAuthCallback } = useAuth()

  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('OAuth sign-in failed — no token received.')
      return
    }

    handleOAuthCallback(token)
      .then(() => {
        // Redirect to the page user originally wanted, or dashboard
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      })
      .catch(() => {
        setError('Failed to complete sign-in. Please try again.')
      })
  }, [])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, fontFamily: 'DM Sans, sans-serif', padding: '2rem'
      }}>
        <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'DM Serif Display, serif', letterSpacing: '-0.02em' }}>Sign-in failed</h2>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', textAlign: 'center', maxWidth: 320 }}>{error}</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 24px', borderRadius: 10, background: '#6366f1', color: '#fff',
            border: 'none', fontFamily: 'inherit', fontSize: '0.9375rem', cursor: 'pointer', fontWeight: 500
          }}
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return <PageLoader />
}