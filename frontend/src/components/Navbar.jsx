import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `pill-tab ${isActive ? 'pill-tab-active' : ''}`

  return (
    <>
      <nav className="navbar sticky top-0 z-50">
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

            {/* Logo */}
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
              <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#22d3ee,#2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(34,211,238,0.3)' }}>
                  <svg style={{ width: '20px', height: '20px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5" />
                  </svg>
                </div>
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', border: '2px solid #050810', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              </div>
              <div className="navbar-brand-text" style={{ display: 'block' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.025em' }}>NutriVision AI</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: "'JetBrains Mono',monospace" }}>EfficientNet-B0 · CNN</div>
              </div>
            </NavLink>

            {/* Center badge – desktop */}
            <div className="navbar-model-badge model-badge">
              <div className="status-dot" />
              ML Model Active
            </div>

            {/* Desktop Nav */}
            <div className="navbar-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <NavLink to="/" className={linkClass} end>Home</NavLink>
              <NavLink to="/food" className={linkClass}>Food Analysis</NavLink>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            </div>

            {/* Hamburger */}
            <button
              className="navbar-hamburger"
              style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg style={{ width: '22px', height: '22px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <div style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: '280px', background: '#080c18', borderLeft: '1px solid rgba(255,255,255,0.05)', zIndex: 50, boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#22d3ee,#2563eb)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                  </svg>
                </div>
                <span style={{ fontWeight: 700, color: '#f0f4ff' }}>NutriVision AI</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <NavLink to="/" className={linkClass} end onClick={() => setMobileOpen(false)} style={{ display: 'block' }}>🏠 Home</NavLink>
              <NavLink to="/food" className={linkClass} onClick={() => setMobileOpen(false)} style={{ display: 'block' }}>🧠 Food Analysis</NavLink>
              <NavLink to="/dashboard" className={linkClass} onClick={() => setMobileOpen(false)} style={{ display: 'block' }}>📊 Dashboard</NavLink>
            </div>
            <div style={{ position: 'absolute', bottom: '2rem', left: '1.25rem', right: '1.25rem' }}>
              <div className="model-badge" style={{ justifyContent: 'center' }}>
                <div className="status-dot" />
                EfficientNet-B0 Active
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
