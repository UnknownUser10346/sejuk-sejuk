import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/technician" element={<div className="p-8 text-2xl font-bold">Technician Portal — Coming Soon</div>} />
          <Route path="/manager" element={<div className="p-8 text-2xl font-bold">Manager Portal — Coming Soon</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}