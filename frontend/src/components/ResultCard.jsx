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

export default function ResultCard({ result }) {
  if (!result) return null

  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [result.protein, result.carbs, result.fat],
        backgroundColor: ['#06b6d4', '#f59e0b', '#ef4444'],
        borderColor: ['#0891b2', '#d97706', '#dc2626'],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const barData = {
    labels: ['Protein', 'Carbs', 'Fat', 'Fiber'],
    datasets: [
      {
        label: 'Grams',
        data: [result.protein, result.carbs, result.fat, result.fiber || 0],
        backgroundColor: ['#06b6d4', '#f59e0b', '#ef4444', '#10b981'],
        borderRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 12 } },
      },
    },
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
    },
  }

  const confidencePercent = Math.round(result.confidence * 100)

  return (
    <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{result.food}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="text-sm text-slate-400">{confidencePercent}% confidence</span>
        </div>
      </div>

      {/* Calories */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 text-center border border-cyan-500/20">
        <p className="text-sm text-cyan-400 uppercase tracking-wide font-medium">Calories</p>
        <p className="text-4xl font-bold text-white mt-1">{result.calories}</p>
        <p className="text-xs text-slate-400 mt-1">{result.serving}</p>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/50 rounded-xl p-3 text-center">
          <p className="text-xs text-cyan-400 font-medium">Protein</p>
          <p className="text-xl font-bold text-white">{result.protein}g</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-400 font-medium">Carbs</p>
          <p className="text-xl font-bold text-white">{result.carbs}g</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 text-center">
          <p className="text-xs text-red-400 font-medium">Fat</p>
          <p className="text-xl font-bold text-white">{result.fat}g</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-slate-400 mb-2 text-center">Macro Split</p>
          <Doughnut data={macroData} options={chartOptions} />
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-2 text-center">Nutrients (g)</p>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  )
}
