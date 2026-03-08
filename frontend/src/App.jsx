import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import FoodUpload from './components/FoodUpload'
import BodyUpload from './components/BodyUpload'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/food" element={<FoodUpload />} />
          <Route path="/body" element={<BodyUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}
