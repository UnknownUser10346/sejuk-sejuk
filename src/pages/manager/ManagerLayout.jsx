import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ManagerLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const handleNav = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  // Shared sidebar content
  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col h-full bg-[#0e7fa8]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/15 min-h-14">
        {onClose ? (
          <button onClick={onClose}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              {collapsed ? <path d="M8 5l7 7-7 7V5z"/> : <path d="M16 5l-7 7 7 7V5z"/>}
            </svg>
          </button>
        )}
        {(!collapsed || onClose) && (
          <div>
            <p className="text-white text-xs font-medium">Sejuk Sejuk Ops</p>
            <p className="text-white/60 text-xs">Manager Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 px-2 py-2">
        {(!collapsed || onClose) && (
          <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2">Main</p>
        )}
        {navItems.map(item => (
          <button key={item.label} onClick={() => handleNav(item.path)}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-left transition-all ${
              isActive(item.path) ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/12 hover:text-white'
            }`}>
            <span className="flex-shrink-0">{item.icon}</span>
            {(!collapsed || onClose) && <span className="text-xs">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-white/15">
        {(!collapsed || onClose) && (
          <p className="text-white/50 text-xs px-2 pb-1 truncate">{user?.name}</p>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:bg-white/12 hover:text-white text-left">
          <span className="text-sm flex-shrink-0">→</span>
          {(!collapsed || onClose) && <span className="text-xs">Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen text-sm bg-gray-50">

      {/* ── DESKTOP sidebar ── */}
      <div className={`hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-200 ${collapsed ? 'w-12' : 'w-52'}`}>
        <SidebarContent />
      </div>

      {/* ── MOBILE overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE drawer sidebar ── */}
      <div className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden transform transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      {/* ── MAIN content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0e7fa8] sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          <div>
            <p className="text-white text-xs font-medium">Sejuk Sejuk Ops</p>
            <p className="text-white/60 text-xs">Manager Portal</p>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
