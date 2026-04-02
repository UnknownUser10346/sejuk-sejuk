import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()

  // Not logged in → go to login
  if (!user) return <Navigate to="/" replace />

  // Wrong role → redirect to their correct portal
  if (user.role !== allowedRole) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'technician') return <Navigate to="/technician" replace />
    if (user.role === 'manager') return <Navigate to="/manager" replace />
    return <Navigate to="/" replace />
  }

  return children
}