import { useState, useEffect } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
)

export default function Dashboard() {
  const [foodHistory, setFoodHistory] = useState([])
  const [bodyHistory, setBodyHistory] = useState([])

  useEffect(() => {
    // Load history from localStorage
    const storedFood = JSON.parse(localStorage.getItem('foodHistory') || '[]')
    const storedBody = JSON.parse(localStorage.getItem('bodyHistory') || '[]')
    setFoodHistory(storedFood)
    setBodyHistory(storedBody)
  }, [])

  const totalCalories = foodHistory.reduce((sum, item) => sum + (item.calories || 0), 0)
  const totalProtein = foodHistory.reduce((sum, item) => sum + (item.protein || 0), 0)
  const totalCarbs = foodHistory.reduce((sum, item) => sum + (item.carbs || 0), 0)
  const totalFat = foodHistory.reduce((sum, item) => sum + (item.fat || 0), 0)

  const macroChartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [totalProtein || 30, totalCarbs || 45, totalFat || 25],
        backgroundColor: ['#06b6d4', '#f59e0b', '#ef4444'],
        borderColor: ['#0891b2', '#d97706', '#dc2626'],
        borderWidth: 2,
      },
    ],
  }

  const calorieChartData = {
    labels: foodHistory.length > 0
      ? foodHistory.map((_, i) => `Meal ${i + 1}`)
      : ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
    datasets: [
      {
        label: 'Calories',
        data: foodHistory.length > 0
          ? foodHistory.map((item) => item.calories)
          : [350, 520, 180, 450],
        backgroundColor: '#06b6d4',
        borderRadius: 8,
      },
    ],
  }

  const bodyFatTrendData = {
    labels: bodyHistory.length > 0
      ? bodyHistory.map((_, i) => `Week ${i + 1}`)
      : ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Body Fat %',
        data: bodyHistory.length > 0
          ? bodyHistory.map((item) => item.body_fat)
          : [22.5, 21.8, 21.2, 20.5],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  }

  const latestBodyFat = bodyHistory.length > 0
    ? bodyHistory[bodyHistory.length - 1]
    : { body_fat: 20.5, category: 'Average', lean_mass: 55.6, fat_mass: 14.4 }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Your fitness and nutrition overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50">
          <p className="text-sm text-slate-400">Total Calories</p>
          <p className="text-3xl font-bold text-white mt-1">{totalCalories || 1500}</p>
          <p className="text-xs text-cyan-400 mt-1">Today</p>
        </div>
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50">
          <p className="text-sm text-slate-400">Protein</p>
          <p className="text-3xl font-bold text-cyan-400 mt-1">{totalProtein || 65}g</p>
          <p className="text-xs text-slate-500 mt-1">Goal: 120g</p>
        </div>
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50">
          <p className="text-sm text-slate-400">Body Fat</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{latestBodyFat.body_fat}%</p>
          <p className="text-xs text-green-400 mt-1">{latestBodyFat.category}</p>
        </div>
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50">
          <p className="text-sm text-slate-400">Meals Logged</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{foodHistory.length || 4}</p>
          <p className="text-xs text-slate-500 mt-1">Today</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Macro Distribution */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Macronutrient Split</h3>
          <div className="max-w-[250px] mx-auto">
            <Doughnut
              data={macroChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: '#94a3b8' } },
                },
              }}
            />
          </div>
        </div>

        {/* Calories by Meal */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Calories by Meal</h3>
          <Bar
            data={calorieChartData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
              },
            }}
          />
        </div>

        {/* Body Fat Trend */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Body Fat Trend</h3>
          <Line
            data={bodyFatTrendData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
              },
            }}
          />
        </div>
      </div>

      {/* Recent Food History */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Food Analysis</h3>
        {foodHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Food</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Calories</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Protein</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Carbs</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Fat</th>
                </tr>
              </thead>
              <tbody>
                {foodHistory.map((item, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">{item.food}</td>
                    <td className="py-3 px-4 text-right text-white">{item.calories}</td>
                    <td className="py-3 px-4 text-right text-cyan-400">{item.protein}g</td>
                    <td className="py-3 px-4 text-right text-amber-400">{item.carbs}g</td>
                    <td className="py-3 px-4 text-right text-red-400">{item.fat}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No food analysis history yet. Start by analyzing some food images.</p>
            <p className="text-xs mt-1">Results will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}
