import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function TechnicianProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="p-4">
      {/* Avatar + Name */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center text-center mb-4">
        <div className="w-16 h-16 bg-[#0e7fa8] rounded-full flex items-center justify-center text-white text-2xl font-medium mb-3">
          {user?.name?.charAt(0) || 'T'}
        </div>
        <p className="text-base font-medium text-gray-800">{user?.name || '—'}</p>
        <p className="text-xs text-gray-400 mt-0.5">{user?.email || '—'}</p>
        <span className="mt-2 text-xs bg-[#0e7fa8]/10 text-[#0e7fa8] px-3 py-1 rounded-full font-medium">
          Technician
        </span>
      </div>

      {/* Info */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        {[
          ['Branch', user?.branch || '—'],
          ['Phone', user?.phone || '—'],
          ['Role', 'Technician'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-xs font-medium text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 border border-red-200 text-red-500 text-sm rounded-xl hover:bg-red-50 transition-colors"
      >
        Logout
      </button>
    </div>
  )
}