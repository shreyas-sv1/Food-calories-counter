import { useState, useEffect } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

const GOALS = { calories: 2000, protein: 120, carbs: 250, fat: 65 }

function GoalRing({ value, goal, color, label }) {
  const pct = Math.min(value / goal, 1)
  const r = 36, stroke = 6, circ = 2 * Math.PI * r, offset = circ * (1 - pct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f4ff', lineHeight: 1 }}>{Math.round(pct * 100)}%</span>
          <span style={{ fontSize: '0.6rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>of goal</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>{label}</p>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f0f4ff' }}>{value}<span style={{ color: '#475569', fontSize: '0.7rem' }}>/{goal}</span></p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [foodHistory, setFoodHistory] = useState([])
  const [activeView, setActiveView] = useState('overview')

  useEffect(() => {
    setFoodHistory(JSON.parse(localStorage.getItem('foodHistory') || '[]'))
  }, [])

  const sum = (key) => foodHistory.reduce((s, i) => s + (i[key] || 0), 0)
  const totalCalories = sum('calories')
  const totalProtein  = sum('protein')
  const totalCarbs    = sum('carbs')
  const totalFat      = sum('fat')
  const totalFiber    = sum('fiber')

  const chartDefaults = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#4a5568', font: { size: 11 } }, grid: { display: false }, border: { display: false } },
      y: { ticks: { color: '#4a5568', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false } },
    },
  }

  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{ data: [totalProtein || 30, totalCarbs || 45, totalFat || 25], backgroundColor: ['rgba(0,212,255,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'], borderColor: ['#00d4ff', '#f59e0b', '#ef4444'], borderWidth: 2, hoverOffset: 10 }],
  }

  const calorieData = {
    labels: foodHistory.length > 0 ? foodHistory.slice(0, 10).reverse().map((_, i) => `Meal ${i + 1}`) : ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
    datasets: [{ label: 'Calories', data: foodHistory.length > 0 ? foodHistory.slice(0, 10).reverse().map(i => i.calories) : [350, 520, 180, 450], backgroundColor: 'rgba(79,142,247,0.6)', borderColor: '#4f8ef7', borderRadius: 8, borderSkipped: false, borderWidth: 0 }],
  }

  const proteinTrend = {
    labels: foodHistory.length > 0 ? foodHistory.slice(0, 7).reverse().map((_, i) => `M${i + 1}`) : ['M1','M2','M3','M4','M5','M6','M7'],
    datasets: [{ label: 'Protein (g)', data: foodHistory.length > 0 ? foodHistory.slice(0, 7).reverse().map(i => i.protein) : [22, 35, 18, 42, 28, 38, 25], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.06)', fill: true, tension: 0.4, pointBackgroundColor: '#00d4ff', pointBorderColor: '#050810', pointBorderWidth: 2, pointRadius: 5 }],
  }

  const clearHistory = () => {
    if (confirm('Clear all food history?')) { localStorage.removeItem('foodHistory'); setFoodHistory([]) }
  }

  const TABS = [{ id: 'overview', label: '📊 Overview' }, { id: 'trends', label: '📈 Trends' }, { id: 'history', label: '🍽 Meal Log' }]

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p className="section-label">Analytics</p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 900, color: '#f0f4ff' }}>Nutrition Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '4px' }}>Track your ML-analyzed meals and calorie intake</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {foodHistory.length > 0 && (
            <button onClick={clearHistory} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>🗑 Clear History</button>
          )}
          <div className="model-badge"><div className="status-dot" />{foodHistory.length} meals logged</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`pill-tab ${activeView === tab.id ? 'pill-tab-active' : ''}`}>{tab.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeView === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeInUp 0.5s ease-out forwards' }}>

          {/* Goal Rings */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f0f4ff' }}>Daily Goals</h2>
              <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>Based on logged meals</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              <GoalRing value={totalCalories} goal={GOALS.calories} color="#00d4ff" label="Calories (kcal)" />
              <GoalRing value={totalProtein}  goal={GOALS.protein}  color="#10d494" label="Protein (g)" />
              <GoalRing value={totalCarbs}    goal={GOALS.carbs}    color="#f59e0b" label="Carbs (g)" />
              <GoalRing value={totalFat}      goal={GOALS.fat}      color="#ef4444" label="Fat (g)" />
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Total Calories', value: totalCalories || 0, sub: `Goal: ${GOALS.calories} kcal`, color: 'cyan', icon: '🔥' },
              { label: 'Protein', value: `${totalProtein || 0}g`, sub: `Goal: ${GOALS.protein}g`, color: 'green', icon: '💪' },
              { label: 'Carbohydrates', value: `${totalCarbs || 0}g`, sub: `Goal: ${GOALS.carbs}g`, color: 'orange', icon: '⚡' },
              { label: 'Meals Analyzed', value: foodHistory.length, sub: 'by ML model', color: 'purple', icon: '🧠' },
            ].map(s => (
              <div key={s.label} className={`stat-card stat-card-${s.color}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>{s.sub}</span>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f0f4ff' }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '4px' }}>Macronutrient Distribution</h3>
              <p style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace", marginBottom: '1rem' }}>Protein · Carbs · Fat split</p>
              <div style={{ maxWidth: '220px', margin: '0 auto' }}>
                <Doughnut data={macroData} options={{ responsive: true, plugins: { legend: { labels: { color: '#64748b', font: { size: 11 }, padding: 16 } } }, cutout: '70%' }} />
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '4px' }}>Calories Per Meal</h3>
              <p style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace", marginBottom: '1rem' }}>Last {Math.min(foodHistory.length || 4, 10)} meals</p>
              <Bar data={calorieData} options={chartDefaults} />
            </div>
          </div>
        </div>
      )}

      {/* TRENDS */}
      {activeView === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.5s ease-out forwards' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '4px' }}>Protein Intake Trend</h3>
            <p style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace", marginBottom: '1.5rem' }}>Grams of protein per analyzed meal</p>
            <Line data={proteinTrend} options={{ ...chartDefaults, plugins: { legend: { display: false } } }} />
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '1rem' }}>Nutritional Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Avg. Calories/Meal', value: foodHistory.length ? Math.round(totalCalories / foodHistory.length) : 0, unit: 'kcal', color: '#00d4ff' },
                { label: 'Avg. Protein/Meal',  value: foodHistory.length ? Math.round(totalProtein / foodHistory.length) : 0,  unit: 'g',    color: '#10d494' },
                { label: 'Total Fiber',         value: Math.round(totalFiber), unit: 'g', color: '#8b5cf6' },
                { label: 'ML Analyses',         value: foodHistory.length, unit: 'meals', color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2px', color: item.color }}>{item.value}</p>
                  <p style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>{item.unit}</p>
                  <p style={{ fontSize: '0.7rem', color: '#334155', marginTop: '4px' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MEAL LOG */}
      {activeView === 'history' && (
        <div style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f4ff' }}>ML Analyzed Meals</h3>
                <p style={{ fontSize: '0.7rem', color: '#475569', fontFamily: "'JetBrains Mono',monospace", marginTop: '2px' }}>
                  {foodHistory.length} foods detected by EfficientNet-B0
                </p>
              </div>
            </div>
            {foodHistory.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Food (ML Predicted)</th>
                      <th style={{ textAlign: 'right' }}>Confidence</th>
                      <th style={{ textAlign: 'right' }}>Calories</th>
                      <th style={{ textAlign: 'right' }}>Protein</th>
                      <th style={{ textAlign: 'right' }}>Carbs</th>
                      <th style={{ textAlign: 'right' }}>Fat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foodHistory.map((item, i) => {
                      const conf = Math.round((item.confidence || 0) * 100)
                      const confColor = conf >= 80 ? '#10d494' : conf >= 60 ? '#f59e0b' : '#ef4444'
                      const confBg    = conf >= 80 ? 'rgba(16,212,148,0.1)' : conf >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
                      return (
                        <tr key={i}>
                          <td style={{ color: '#475569', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem' }}>{i + 1}</td>
                          <td style={{ fontWeight: 600, color: '#f0f4ff', textTransform: 'capitalize' }}>{item.food}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', fontFamily: "'JetBrains Mono',monospace", padding: '2px 8px', borderRadius: '20px', color: confColor, background: confBg }}>{conf}%</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#f0f4ff' }}>{item.calories}</td>
                          <td style={{ textAlign: 'right', color: '#22d3ee', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.875rem' }}>{item.protein}g</td>
                          <td style={{ textAlign: 'right', color: '#fbbf24', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.875rem' }}>{item.carbs}g</td>
                          <td style={{ textAlign: 'right', color: '#f87171', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.875rem' }}>{item.fat}g</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>🍽️</div>
                <p style={{ color: '#94a3b8', fontWeight: 500 }}>No meals analyzed yet</p>
                <p style={{ color: '#475569', fontSize: '0.875rem' }}>Go to Food Analysis and upload food images to start tracking.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
