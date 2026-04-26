import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const MACRO_COLORS = {
  protein: { fill: '#00d4ff', label: '#22d3ee' },
  carbs:   { fill: '#f59e0b', label: '#fbbf24' },
  fat:     { fill: '#ef4444', label: '#f87171' },
  fiber:   { fill: '#10d494', label: '#4ade80' },
}

function ProgressRing({ value, max, color, size = 52, stroke = 5 }) {
  const radius = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * radius
  const pct = Math.min(value / (max || 1), 1)
  const offset = circ * (1 - pct)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
    </svg>
  )
}

export default function ResultCard({ result }) {
  if (!result) return null

  const pct = Math.round(result.confidence * 100)
  const total = (result.protein + result.carbs + result.fat) || 1
  const maxMacro = Math.max(result.protein, result.carbs, result.fat, result.fiber || 1) * 1.2

  const confColor = pct >= 80 ? '#10d494' : pct >= 60 ? '#f59e0b' : '#ef4444'
  const confGrad  = pct >= 80 ? 'linear-gradient(90deg,#10d494,#06b6d4)' : pct >= 60 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#ef4444,#dc2626)'

  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{ data: [result.protein, result.carbs, result.fat], backgroundColor: ['rgba(0,212,255,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'], borderColor: ['#0891b2', '#d97706', '#dc2626'], borderWidth: 2, hoverOffset: 8 }],
  }
  const barData = {
    labels: ['Protein', 'Carbs', 'Fat', 'Fiber'],
    datasets: [{ label: 'Grams', data: [result.protein, result.carbs, result.fat, result.fiber || 0], backgroundColor: ['rgba(0,212,255,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(16,212,148,0.7)'], borderRadius: 8, borderSkipped: false }],
  }
  const chartOpts = { responsive: true, plugins: { legend: { labels: { color: '#64748b', font: { size: 11 } } } } }
  const barOpts   = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { display: false }, border: { display: false } }, y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } } } }

  const macros = [
    { key: 'protein', label: 'Protein',        value: result.protein,    ...MACRO_COLORS.protein },
    { key: 'carbs',   label: 'Carbohydrates',   value: result.carbs,      ...MACRO_COLORS.carbs },
    { key: 'fat',     label: 'Total Fat',        value: result.fat,        ...MACRO_COLORS.fat },
    { key: 'fiber',   label: 'Dietary Fiber',    value: result.fiber || 0, ...MACRO_COLORS.fiber },
  ]

  return (
    <div className="glass-card animate-slide-in-right" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f0f4ff', textTransform: 'capitalize' }}>{result.food}</h2>
          <p style={{ fontSize: '0.75rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace", marginTop: '2px' }}>{result.serving}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", color: '#475569' }}>CNN Confidence</span>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: confColor }}>{pct}%</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>Model confidence</span>
          <span style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono',monospace", color: '#94a3b8' }}>{result.confidence?.toFixed(4)}</span>
        </div>
        <div className="confidence-bar">
          <div className="confidence-fill" style={{ width: `${pct}%`, background: confGrad }} />
        </div>
        {result.warning && (
          <p style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚠️</span>{result.warning}
          </p>
        )}
      </div>

      {/* Calories hero */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', padding: '1.25rem', textAlign: 'center', background: 'linear-gradient(135deg,rgba(0,212,255,0.08),rgba(79,142,247,0.08))', border: '1px solid rgba(0,212,255,0.2)' }}>
        <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Total Calories</p>
        <p style={{ fontSize: '3rem', fontWeight: 900, color: '#f0f4ff', lineHeight: 1 }}>{result.calories}</p>
        <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '4px' }}>kcal per serving</p>
      </div>

      {/* Macro rings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {macros.map(m => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProgressRing value={m.value} max={maxMacro} color={m.fill} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: m.fill }}>{m.value}g</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '2px' }}>{m.label}</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f4ff' }}>{m.value}<span style={{ fontSize: '0.7rem', color: '#475569' }}>g</span></p>
              <p style={{ fontSize: '0.7rem', color: '#334155' }}>{total > 0 ? Math.round((m.value / total) * 100) : 0}% of macros</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.5rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", marginBottom: '0.5rem' }}>Macro Split</p>
          <div style={{ maxWidth: '160px', margin: '0 auto' }}>
            <Doughnut data={macroData} options={chartOpts} />
          </div>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", marginBottom: '0.5rem' }}>Nutrients (g)</p>
          <Bar data={barData} options={barOpts} />
        </div>
      </div>

      {/* Matched as */}
      {result.matched_as && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace", padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span>ℹ️</span>
          Nutrition matched as: <span style={{ color: '#cbd5e1' }}>{result.matched_as}</span>
        </div>
      )}
    </div>
  )
}
