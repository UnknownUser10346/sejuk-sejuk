import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<div className="p-8 text-2xl font-bold">Admin Dashboard — Coming Soon</div>} />
          <Route path="/technician" element={<div className="p-8 text-2xl font-bold">Technician Portal — Coming Soon</div>} />
          <Route path="/manager" element={<div className="p-8 text-2xl font-bold">Manager Portal — Coming Soon</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}