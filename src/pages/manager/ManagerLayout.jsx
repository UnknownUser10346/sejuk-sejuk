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
    {
      label: 'KPI Dashboard',
      path: '/manager/kpi',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13h2.8v6h-2.8v-6z"/>
        </svg>
      ),
    },
    {
     label: 'AI Assistant',
      path: '/manager/ai',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
        </svg>
      ),
    },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div className="flex min-h-screen text-sm bg-gray-50">
      <div className={`${collapsed ? 'w-12' : 'w-52'} bg-[#0e7fa8] flex flex-col flex-shrink-0 transition-all duration-200 sticky top-0 h-screen`}>
        <div className="flex items-center gap-2 px-2 py-3 border-b border-white/15 min-h-14">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              {collapsed ? <path d="M8 5l7 7-7 7V5z"/> : <path d="M16 5l-7 7 7 7V5z"/>}
            </svg>
          </button>
          {!collapsed && (
            <div>
              <p className="text-white text-xs font-medium">Sejuk Sejuk Ops</p>
              <p className="text-white/60 text-xs">Manager Portal</p>
            </div>
          )}
        </div>

        <div className="flex-1 px-2 py-2">
          {!collapsed && <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2">Main</p>}
          {navItems.map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-left transition-all ${
                isActive(item.path) ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/12 hover:text-white'
              }`}>
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-xs">{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="px-2 py-2 border-t border-white/15">
          {!collapsed && <p className="text-white/50 text-xs px-2 pb-1 truncate">{user?.name}</p>}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:bg-white/12 hover:text-white text-left">
            <span className="text-sm flex-shrink-0">→</span>
            {!collapsed && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}