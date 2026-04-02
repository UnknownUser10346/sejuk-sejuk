import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ManagerLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const navItems = [
    {
      label: 'Review Jobs',
      path: '/manager/jobs',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      ),
    },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div className="flex min-h-screen text-sm bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? 'w-12' : 'w-52'
        } bg-[#0e7fa8] flex flex-col flex-shrink-0 transition-all duration-200 sticky top-0 h-screen`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-2 py-3 border-b border-white/15 min-h-14">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              {collapsed
                ? <path d="M8 5l7 7-7 7V5z"/>
                : <path d="M16 5l-7 7 7 7V5z"/>
              }
            </svg>
          </button>
          {!collapsed && (
            <div>
              <p className="text-white text-xs font-medium">Sejuk Sejuk Ops</p>
              <p className="text-white/60 text-xs">Manager Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 px-2 py-2">
          {!collapsed && (
            <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2">Main</p>
          )}
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-left transition-all ${
                isActive(item.path)
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/80 hover:bg-white/12 hover:text-white'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-xs">{item.label}</span>}
            </button>
          ))}
        </div>

        {/* User + Logout */}
        <div className="px-2 py-2 border-t border-white/15">
          {!collapsed && (
            <p className="text-white/50 text-xs px-2 pb-1 truncate">{user?.name}</p>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:bg-white/12 hover:text-white text-left"
          >
            <span className="text-sm flex-shrink-0">→</span>
            {!collapsed && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  )
}
