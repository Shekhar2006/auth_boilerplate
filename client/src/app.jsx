import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import OAuthCallback from './pages/OAuthCallback'

// ── Placeholder dashboard — replace with your real app ──
function Dashboard() {
  const { user, logout, logoutAll } = useAuth()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ fontSize: 13, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Authenticated</div>
      <h1 style={{ fontSize: '2rem', fontFamily: 'DM Serif Display, serif', letterSpacing: '-0.03em' }}>Welcome, {user?.name || user?.email}</h1>
      <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>{user?.email}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={logout} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
          Log out
        </button>
        <button onClick={logoutAll} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
          Log out all devices
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"            element={<Login />} />
      <Route path="/register"         element={<Register />} />
      <Route path="/forgot-password"  element={<ForgotPassword />} />
      <Route path="/reset-password"   element={<ResetPassword />} />
      <Route path="/verify-email"     element={<VerifyEmail />} />
      <Route path="/oauth/callback"   element={<OAuthCallback />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}