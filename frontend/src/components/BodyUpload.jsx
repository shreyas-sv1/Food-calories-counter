import { useCallback, useState, useMemo, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { predictBodyFat } from '../api'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const VIEWS = ['front', 'back', 'left', 'right']

const VIEW_LABELS = {
  front: 'Front View',
  back: 'Back View',
  left: 'Left Side',
  right: 'Right Side',
}

function ImageDropZone({ view, image, onDrop }) {
  const previewUrl = useMemo(() => {
    if (image) return URL.createObjectURL(image)
    return null
  }, [image])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(view, files[0]),
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0]
      if (error?.code === 'file-too-large') {
        toast.error('Image must be under 5 MB')
      } else if (error?.code === 'file-invalid-type') {
        toast.error('Only JPEG, PNG, and WebP images are accepted')
      } else {
        toast.error('File rejected: ' + (error?.message || 'Unknown error'))
      }
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 aspect-square flex flex-col items-center justify-center ${
        isDragActive
          ? 'border-cyan-400 bg-cyan-400/10'
          : image
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-slate-600 hover:border-cyan-400/50 bg-slate-800/50'
      }`}
    >
      <input {...getInputProps()} />
      {image ? (
        <div className="relative w-full h-full">
          <img
            src={previewUrl}
            alt={view}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 rounded-b-lg">
            <p className="text-xs text-green-400 font-medium">{VIEW_LABELS[view]}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <svg className="w-8 h-8 mx-auto text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="text-sm text-slate-400 font-medium">{VIEW_LABELS[view]}</p>
          <p className="text-xs text-slate-600">Drop image here</p>
        </div>
      )}
    </div>
  )
}

export default function BodyUpload() {
  const [images, setImages] = useState({})
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(175)
  const [gender, setGender] = useState('male')
  const [age, setAge] = useState(25)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDrop = useCallback((view, file) => {
    if (file) {
      setImages((prev) => ({ ...prev, [view]: file }))
      setResult(null)
    }
  }, [])

  const allImagesUploaded = VIEWS.every((v) => images[v])

  const handleAnalyze = async () => {
    if (!allImagesUploaded) {
      toast.error('Please upload all 4 body images.')
      return
    }
    setLoading(true)
    try {
      const data = await predictBodyFat(images, weight, height, gender, age)
      setResult(data)
      toast.success(`Body Fat: ${data.body_fat}%`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to analyze images. Make sure the backend is running.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImages({})
    setResult(null)
  }

  const categoryColor = (category) => {
    const colors = {
      'Essential Fat': '#ef4444',
      'Athletic': '#06b6d4',
      'Fitness': '#10b981',
      'Average': '#f59e0b',
      'Above Average': '#f97316',
      'Obese': '#dc2626',
    }
    return colors[category] || '#94a3b8'
  }

  const compositionData = result
    ? {
        labels: ['Lean Mass', 'Fat Mass'],
        datasets: [
          {
            data: [result.lean_mass, result.fat_mass],
            backgroundColor: ['#06b6d4', '#f59e0b'],
            borderColor: ['#0891b2', '#d97706'],
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      }
    : null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Body Fat Analyzer</h1>
        <p className="text-slate-400">Upload 4 body images for body composition analysis</p>
      </div>

      {/* Image Upload Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {VIEWS.map((view) => (
          <ImageDropZone
            key={view}
            view={view}
            image={images[view]}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Inputs and Actions */}
      <div className="bg-slate-800/50 p-6 rounded-2xl mb-8 border border-slate-700 backdrop-blur-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-medium">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Math.max(30, Math.min(200, parseFloat(e.target.value) || 70)))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-medium">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Math.max(100, Math.min(250, parseFloat(e.target.value) || 175)))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-medium">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Math.max(10, Math.min(100, parseInt(e.target.value) || 25)))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-medium">Gender</label>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-600">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 capitalize py-1.5 rounded-md text-sm font-medium transition-all ${
                    gender === g
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!allImagesUploaded || loading}
          className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing Body Composition...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Calculate Body Fat %
            </span>
          )}
        </button>
          <button
            onClick={handleReset}
            className="bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 py-3 px-4 rounded-xl transition-all duration-200"
          >
            Clear All
          </button>
      </div>

      {/* Results */}
      {result && (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          {/* Body Fat Result */}
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50 space-y-6">
            <h3 className="text-lg font-semibold text-white">Body Composition</h3>

            {/* Body Fat Percentage */}
            <div className="text-center">
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#334155" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={categoryColor(result.category)}
                    strokeWidth="10"
                    strokeDasharray={`${(result.body_fat / 50) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{result.body_fat}%</span>
                  <span className="text-xs text-slate-400">Body Fat</span>
                </div>
              </div>
              <span
                className="inline-block mt-3 px-4 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: categoryColor(result.category) + '20',
                  color: categoryColor(result.category),
                }}
              >
                {result.category}
              </span>
            </div>

            {/* Mass Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-xs text-cyan-400 font-medium">Lean Mass</p>
                <p className="text-xl font-bold text-white">{result.lean_mass} kg</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-400 font-medium">Fat Mass</p>
                <p className="text-xl font-bold text-white">{result.fat_mass} kg</p>
              </div>
            </div>

            {/* Composition Chart */}
            {compositionData && (
              <div className="max-w-[200px] mx-auto">
                <Doughnut
                  data={compositionData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        labels: { color: '#94a3b8', font: { size: 12 } },
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Measurements */}
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50 space-y-4">
            <h3 className="text-lg font-semibold text-white">Measurements</h3>

            {result.measurements && (
              <div className="space-y-3">
                {Object.entries(result.measurements).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Views Processed */}
            <div className="mt-6">
              <p className="text-sm text-slate-400 mb-2">Views Processed</p>
              <div className="flex gap-2">
                {VIEWS.map((view) => (
                  <span
                    key={view}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.views_processed?.includes(view)
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    {view}
                  </span>
                ))}
              </div>
            </div>

            {/* Body Fat Reference */}
            <div className="mt-6 bg-slate-900/50 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-3">Body Fat Categories</p>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Essential Fat', range: '2-5%', color: '#ef4444' },
                  { label: 'Athletic', range: '6-13%', color: '#06b6d4' },
                  { label: 'Fitness', range: '14-17%', color: '#10b981' },
                  { label: 'Average', range: '18-24%', color: '#f59e0b' },
                  { label: 'Above Average', range: '25-31%', color: '#f97316' },
                  { label: 'Obese', range: '32%+', color: '#dc2626' },
                ].map((cat) => (
                  <div key={cat.label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className={`text-slate-400 ${result.category === cat.label ? 'text-white font-medium' : ''}`}>
                      {cat.label}: {cat.range}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
