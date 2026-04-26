import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './components/Home'
import FoodUpload from './components/FoodUpload'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '2rem 1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/food" element={<FoodUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0f1420',
            color: '#f0f4ff',
            border: '1px solid rgba(99, 179, 237, 0.15)',
            borderRadius: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10d494', secondary: '#0f1420' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0f1420' } },
        }}
      />
    </div>
  )
}
