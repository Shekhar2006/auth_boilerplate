// Shared layout wrapper used by all auth pages
export function AuthLayout({ children, headline, sub, features }) {
  return (
    <div className="auth-shell">
      {/* ── Left: brand panel ── */}
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="brand-logo">
            <div className="brand-logo-mark">
              <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2L15.5 5.75V12.25L9 16L2.5 12.25V5.75L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 6.5V11.5M6.5 9H11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="brand-logo-name">AuthKit</span>
          </div>

          <h2 className="brand-headline" dangerouslySetInnerHTML={{ __html: headline }} />
          <p className="brand-sub">{sub}</p>
        </div>

        <div className="brand-features">
          {features.map((f, i) => (
            <div className="brand-feature" key={i}>
              <div className="brand-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="auth-panel">
        {children}
      </div>
    </div>
  )
}

// Reusable alert component
export function Alert({ type, children }) {
  const icon = type === 'error'
    ? <svg className="alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/><path d="M8 5v4M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
    : <svg className="alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#16a34a" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  return (
    <div className={`alert alert-${type}`}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

// Google SVG icon
export function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

// GitHub SVG icon
export function GitHubIcon() {
  return (
    <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M9 .5A8.5 8.5 0 0 0 .5 9a8.5 8.5 0 0 0 5.813 8.07c.425.078.582-.184.582-.41 0-.203-.008-.876-.011-1.584-2.364.514-2.862-1.04-2.862-1.04-.387-.982-.944-1.244-.944-1.244-.772-.527.058-.516.058-.516.853.06 1.302.876 1.302.876.758 1.299 1.99.924 2.475.707.077-.55.297-.924.54-1.136-1.888-.215-3.872-.944-3.872-4.202 0-.928.332-1.687.876-2.283-.088-.214-.38-1.079.083-2.25 0 0 .714-.229 2.34.873A8.17 8.17 0 0 1 9 5.028c.723.004 1.45.097 2.13.285 1.623-1.102 2.336-.873 2.336-.873.464 1.171.172 2.036.085 2.25.545.596.875 1.355.875 2.283 0 3.266-1.988 3.985-3.881 4.195.305.263.576.78.576 1.572 0 1.134-.01 2.05-.01 2.328 0 .228.153.492.585.409A8.5 8.5 0 0 0 17.5 9 8.5 8.5 0 0 0 9 .5z"/>
    </svg>
  )
}

// Loading spinner for ProtectedRoute
export function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}