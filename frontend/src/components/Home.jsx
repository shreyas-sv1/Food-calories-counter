import { Link } from 'react-router-dom'

export default function Home() {
  const features = [
    {
      title: 'Food Calorie Detection',
      description: 'Upload a food image and get instant calorie and macronutrient estimates powered by EfficientNet deep learning.',
      link: '/food',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'Body Fat Analysis',
      description: 'Upload 4 body images and receive AI-powered body fat percentage estimation using pose detection.',
      link: '/body',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Fitness Dashboard',
      description: 'Track your nutrition and body composition over time with interactive charts and progress reports.',
      link: '/dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-cyan-500/20">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          AI-Powered Fitness Analysis
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Analyze Your Food
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            & Body Composition
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Upload food images for instant calorie estimation or body images for body fat analysis.
          Powered by deep learning and computer vision.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/food"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200"
          >
            Analyze Food
          </Link>
          <Link
            to="/body"
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 border border-slate-700"
          >
            Body Fat Analysis
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 pb-16">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.link}
            className="group bg-slate-800/50 hover:bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300"
          >
            <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Tech Stack */}
      <div className="text-center pb-16">
        <p className="text-sm text-slate-500 mb-4">Built with</p>
        <div className="flex items-center justify-center gap-6 text-slate-500 text-sm">
          <span>React</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>FastAPI</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>PyTorch</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>MediaPipe</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>EfficientNet</span>
        </div>
      </div>
    </div>
  )
}
