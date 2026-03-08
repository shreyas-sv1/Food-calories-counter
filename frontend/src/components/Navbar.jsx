import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-cyan-500/20 text-cyan-400'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">AI Fitness Analyzer</span>
          </NavLink>

          <div className="flex items-center gap-2">
            <NavLink to="/" className={linkClass} end>Home</NavLink>
            <NavLink to="/food" className={linkClass}>Food Analysis</NavLink>
            <NavLink to="/body" className={linkClass}>Body Fat</NavLink>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}
