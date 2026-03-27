import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { AuthLayout } from '../components/AuthLayout'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error' | 'already'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link.')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(res => {
        if (res.data.message?.toLowerCase().includes('already')) {
          setStatus('already')
        } else {
          setStatus('success')
        }
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.')
      })
  }, [token])

  const states = {
    loading: {
      icon: (
        <div style={{ width: 56, height: 56, background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <div style={{ width: 24, height: 24, border: '2.5px solid #c7d2fe', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ),
      title: 'Verifying your email…',
      sub: 'Just a moment.',
      link: null,
    },
    success: {
      icon: (
        <div className="success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      ),
      title: 'Email verified!',
      sub: 'Your account is active. You can now sign in.',
      link: <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-flex', width: 'auto', padding: '0 2rem' }}>Sign in →</Link>,
    },
    already: {
      icon: (
        <div className="success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      ),
      title: 'Already verified',
      sub: 'Your email is already confirmed. Go ahead and sign in.',
      link: <Link to="/login" className="form-link">Sign in →</Link>,
    },
    error: {
      icon: (
        <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
      ),
      title: 'Verification failed',
      sub: message || 'This link may have expired or already been used.',
      link: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <Link to="/login" className="form-link" style={{ fontSize: '0.9375rem' }}>← Back to sign in</Link>
          <button
            onClick={() => {
              const email = prompt('Enter your email to resend the verification link:')
              if (email) {
                api.post('/auth/resend-verification', { email })
                  .then(() => alert('If an unverified account exists, a new link has been sent.'))
                  .catch(() => alert('Something went wrong. Please try again.'))
              }
            }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Resend verification email
          </button>
        </div>
      ),
    },
  }

  const current = states[status]

  return (
    <AuthLayout
      headline="Verify your <em>email</em>"
      sub="Confirming your identity keeps your account secure."
      features={['One-click email confirmation', 'Link valid for 24 hours', 'Resend if needed']}
    >
      <div className="form-card" style={{ textAlign: 'center' }}>
        {current.icon}
        <h1 className="form-title" style={{ textAlign: 'center' }}>{current.title}</h1>
        <p className="form-subtitle" style={{ textAlign: 'center', maxWidth: 300, margin: '0 auto 1.5rem' }}>{current.sub}</p>
        {current.link}
      </div>
    </AuthLayout>
  )
}