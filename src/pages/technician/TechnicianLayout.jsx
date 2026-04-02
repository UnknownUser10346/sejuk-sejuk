import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function TechnicianLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/') }

  const tabs = [
    {
      label: 'Jobs',
      path: '/technician/jobs',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      ),
    },
    {
      label: 'Profile',
      path: '/technician/profile',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      ),
    },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* Top Header */}
      <div className="bg-[#0e7fa8] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-xs font-medium">Sejuk Sejuk Ops</p>
          <p className="text-white/70 text-xs">Hi, {user?.name || 'Technician'} 👋</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/70 text-xs border border-white/30 px-3 py-1 rounded-lg hover:bg-white/10"
        >
          Logout
        </button>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto pb-20">
        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex z-10">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
              isActive(tab.path)
                ? 'text-[#0e7fa8] font-medium'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}