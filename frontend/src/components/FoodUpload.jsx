import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { predictFood } from '../api'
import ResultCard from './ResultCard'

export default function FoodUpload() {
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Invalid file. Please upload a JPEG, PNG, or WebP image under 5MB.')
      return
    }
    const f = acceptedFiles[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload an image first.')
      return
    }
    setLoading(true)
    try {
      const data = await predictFood(file)
      setResult(data)
      toast.success(`Detected: ${data.food}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to analyze image. Make sure the backend is running.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
  }

  const handleCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const f = e.target.files[0]
      if (f) {
        setFile(f)
        setPreview(URL.createObjectURL(f))
        setResult(null)
      }
    }
    input.click()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Food Calorie Analyzer</h1>
        <p className="text-slate-400">Upload a food image to get calorie and macronutrient estimates</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center ${
              isDragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-600 hover:border-cyan-400/50 bg-slate-800/50'
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <img
                src={preview}
                alt="Food preview"
                className="max-h-64 rounded-xl object-contain"
              />
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Drop your food image here</p>
                  <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                  <p className="text-slate-600 text-xs mt-2">JPEG, PNG, WebP - Max 5MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : 'Analyze Food'}
            </button>
            <button
              onClick={handleCapture}
              className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-xl transition-all duration-200"
              title="Capture from camera"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </button>
            {preview && (
              <button
                onClick={handleReset}
                className="bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 py-3 px-4 rounded-xl transition-all duration-200"
                title="Clear"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div>
          {result ? (
            <ResultCard result={result} />
          ) : (
            <div className="bg-slate-800/50 rounded-2xl p-8 h-full flex items-center justify-center border border-slate-700/50">
              <div className="text-center text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Upload a food image to see nutritional analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
