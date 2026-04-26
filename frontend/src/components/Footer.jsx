import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#050810', marginTop: 'auto' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#22d3ee,#2563eb)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f0f4ff' }}>NutriVision AI</p>
              <p style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: "'JetBrains Mono',monospace" }}>EfficientNet-B0 · Food-101 · PyTorch</p>
            </div>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {[['/', 'Home'], ['/food', 'Food Analysis'], ['/dashboard', 'Dashboard']].map(([to, label]) => (
              <Link key={to} to={to} style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#cbd5e1'}
                onMouseLeave={e => e.target.style.color = '#64748b'}
              >{label}</Link>
            ))}
          </nav>

          {/* Tech */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: '#475569' }}>
            <span>🔥 PyTorch</span><span>·</span><span>⚡ FastAPI</span><span>·</span><span>⚛️ React</span>
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '0.75rem', color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
          © {year} NutriVision AI · CNN Food Recognition · EfficientNet-B0 on Food-101 · 101 classes
        </div>
      </div>
    </footer>
  )
}
