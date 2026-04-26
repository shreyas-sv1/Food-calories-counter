import { Link } from 'react-router-dom'

const ARCHITECTURE_STEPS = [
  { label: 'Image Input', sub: '224×224 RGB', icon: '📷', color: '#00d4ff' },
  { label: 'MBConv Blocks', sub: '×16 layers', icon: '⚙️', color: '#4f8ef7' },
  { label: 'SE Attention', sub: 'Channel squeeze', icon: '🔍', color: '#8b5cf6' },
  { label: 'Global AvgPool', sub: 'Feature map', icon: '🔲', color: '#10d494' },
  { label: 'Dense + Softmax', sub: '101 classes', icon: '📊', color: '#f59e0b' },
]

const STATS = [
  { label: 'Model Classes', value: '101', unit: 'foods', color: 'cyan' },
  { label: 'Val Accuracy', value: '85', unit: '%', color: 'green' },
  { label: 'Architecture', value: 'B0', unit: 'EfficientNet', color: 'purple' },
  { label: 'Dataset', value: '75K', unit: 'images', color: 'orange' },
]

const FEATURES = [
  {
    title: 'CNN Food Recognition',
    description: 'EfficientNetB0 trained on Food-101 dataset. Uses compound scaling to balance depth, width and resolution for optimal accuracy.',
    link: '/food',
    icon: (
      <svg style={{ width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5" />
      </svg>
    ),
    cardClass: 'feature-card-cyan',
    iconClass: 'icon-cyan',
    tag: 'EfficientNet-B0',
    tagStyle: { color: '#22d3ee', background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.2)' },
    iconColor: '#22d3ee',
  },
  {
    title: 'Nutrition Analysis',
    description: 'After food detection, the system performs instant nutritional lookup across 101 food categories with macro breakdowns.',
    link: '/food',
    icon: (
      <svg style={{ width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    cardClass: 'feature-card-green',
    iconClass: 'icon-green',
    tag: 'Real-time DB',
    tagStyle: { color: '#4ade80', background: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.2)' },
    iconColor: '#4ade80',
  },
  {
    title: 'Progress Dashboard',
    description: 'Visualize your daily calorie intake, macro distribution, and nutrition goals with interactive charts powered by Chart.js.',
    link: '/dashboard',
    icon: (
      <svg style={{ width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    cardClass: 'feature-card-purple',
    iconClass: 'icon-purple',
    tag: 'Analytics',
    tagStyle: { color: '#c084fc', background: 'rgba(192,132,252,0.1)', borderColor: 'rgba(192,132,252,0.2)' },
    iconColor: '#c084fc',
  },
]

const TECH = [
  { name: 'PyTorch', icon: '🔥', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
  { name: 'EfficientNet', icon: '🧠', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
  { name: 'FastAPI', icon: '⚡', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
  { name: 'React + Vite', icon: '⚛️', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
  { name: 'Food-101', icon: '🍽️', color: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)' },
  { name: 'scikit-learn', icon: '📐', color: '#facc15', bg: 'rgba(250,204,21,0.08)', border: 'rgba(250,204,21,0.2)' },
]

export default function Home() {
  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', paddingBottom: '5rem', display: 'flex', flexDirection: 'column', gap: '5rem' }}>

      {/* ── HERO ── */}
      <section className="neural-bg grid-bg hero-section">
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '25%', left: '25%', width: '18rem', height: '18rem', borderRadius: '50%', background: 'rgba(34,211,238,0.05)', filter: 'blur(64px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '18rem', height: '18rem', borderRadius: '50%', background: 'rgba(192,132,252,0.05)', filter: 'blur(64px)', pointerEvents: 'none' }} />

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="model-badge">
            <div className="status-dot" />
            EfficientNet-B0 · PyTorch
          </div>
          <div className="model-badge" style={{ borderColor: 'rgba(74,222,128,0.3)', color: '#4ade80', background: 'rgba(74,222,128,0.08)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
            Food-101 Dataset
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', fontWeight: 900, color: '#f0f4ff', marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
          AI-Powered<br />
          <span className="hero-gradient">Food Recognition</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#94a3b8', maxWidth: '40rem', margin: '0 auto 3rem', lineHeight: 1.7 }}>
          Upload a food photo. Our <strong style={{ color: '#f0f4ff' }}>Convolutional Neural Network</strong> identifies the food,
          then returns precise <strong style={{ color: '#22d3ee' }}>calorie &amp; macronutrient data</strong> in real-time.
        </p>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/food" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Analyze Food Now
          </Link>
          <Link to="/dashboard" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            View Dashboard
          </Link>
        </div>
      </section>

      {/* ── STATS ── */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="section-label">Model Specifications</p>
          <h2 className="section-title">CNN Architecture Stats</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {STATS.map((s) => (
            <div key={s.label} className={`stat-card stat-card-${s.color}`} style={{ textAlign: 'center' }}>
              <p style={{ color: '#475569', fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{s.label}</p>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#f0f4ff', marginBottom: '0.25rem' }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: '#475569' }}>{s.unit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(192,132,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '16px', height: '16px', color: '#c084fc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f0f4ff' }}>EfficientNet-B0 Pipeline</h2>
            <p style={{ fontSize: '0.875rem', color: '#475569' }}>Convolutional Neural Network Architecture</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {ARCHITECTURE_STEPS.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="pipeline-step">
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{step.icon}</div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f0f4ff', textAlign: 'center' }}>{step.label}</p>
                <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", color: '#475569', textAlign: 'center' }}>{step.sub}</p>
                <div style={{ width: '100%', height: '2px', borderRadius: '1px', background: step.color, opacity: 0.4, marginTop: '4px' }} />
              </div>
              {i < ARCHITECTURE_STEPS.length - 1 && (
                <svg style={{ width: '16px', height: '16px', color: '#475569', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { label: 'Preprocessing', value: 'Resize → Normalize (ImageNet stats)', icon: '🔧' },
            { label: 'Inference', value: 'torch.no_grad() → Softmax probs', icon: '⚡' },
            { label: 'Confidence', value: 'Top-1 & Top-5 predictions returned', icon: '📈' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '2px' }}>{item.label}</p>
                <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", color: '#475569' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="section-label">Features</p>
          <h2 className="section-title">What This ML App Does</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              to={f.link}
              className={`glass-card group ${f.cardClass}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', border: '1px solid', borderRadius: '16px', textDecoration: 'none', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className={`${f.iconClass}`} style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.iconColor, transition: 'transform 0.3s' }}>
                {f.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff' }}>{f.title}</h3>
                  <span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", padding: '2px 8px', borderRadius: '20px', border: '1px solid', ...f.tagStyle }}>{f.tag}</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.description}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                Explore
                <svg style={{ width: '16px', height: '16px', transition: 'transform 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>Powered By</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
          {TECH.map((t) => (
            <div
              key={t.name}
              className="tech-badge"
              style={{ color: t.color, background: t.bg, borderColor: t.border }}
            >
              <span>{t.icon}</span>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
