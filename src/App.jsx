import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import NewOrder from './pages/admin/NewOrder'
import EditOrder from './pages/admin/EditOrder'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBranches from './pages/admin/AdminBranches'
import TechnicianLayout from './pages/technician/TechnicianLayout'
import TechnicianJobs from './pages/technician/TechnicianJobs'
import TechnicianJobDetail from './pages/technician/TechnicianJobDetail'
import TechnicianProfile from './pages/technician/TechnicianProfile'
import ManagerLayout from './pages/manager/ManagerLayout'
import ManagerJobs from './pages/manager/ManagerJobs'
import ManagerJobDetail from './pages/manager/ManagerJobDetail'
import KpiDashboard from './pages/manager/KpiDashboard'
import AiAssistant from './pages/manager/AiAssistant'

function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const navItems = [
    { label: 'Dashboard', icon: '▦', path: '/admin' },
    { label: 'Orders',    icon: '☰', path: '/admin/orders' },
  ]

  const managementItems = [
    {
      label: 'Users',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      path: '/admin/users',
    },
    {
      label: 'Branches',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      ),
      path: '/admin/branches',
    },
  ]

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  const handleNav = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-3 border-b border-white/15 min-h-14">
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              {collapsed ? <path d="M8 5l7 7-7 7V5z"/> : <path d="M16 5l-7 7 7 7V5z"/>}
            </svg>
          </button>
        )}
        {(isMobile || !collapsed) && (
          <div className="flex-1">
            <p className="text-white text-xs font-medium">Sejuk Sejuk Ops</p>
            <p className="text-white/60 text-xs">Admin Panel</p>
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 px-2 py-2">
        {(isMobile || !collapsed) && <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2">Main</p>}
        {navItems.map(item => (
          <button key={item.label} onClick={() => handleNav(item.path)}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-left transition-all ${
              isActive(item.path) ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/12 hover:text-white'
            }`}>
            <span className="flex-shrink-0">{item.icon}</span>
            {(isMobile || !collapsed) && <span className="text-xs">{item.label}</span>}
          </button>
        ))}

        {(isMobile || !collapsed) && <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2 mt-2">Management</p>}
        {managementItems.map(item => (
          <button key={item.label} onClick={() => handleNav(item.path)}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-left transition-all ${
              isActive(item.path) ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/12 hover:text-white'
            }`}>
            <span className="text-sm flex-shrink-0">{item.icon}</span>
            {(isMobile || !collapsed) && <span className="text-xs">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-white/15">
        {(isMobile || !collapsed) && <p className="text-white/50 text-xs px-2 pb-1 truncate">{user?.name}</p>}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:bg-white/12 hover:text-white text-left">
          <span className="text-sm flex-shrink-0">→</span>
          {(isMobile || !collapsed) && <span className="text-xs">Logout</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen text-sm bg-gray-50">

      {/* ── DESKTOP SIDEBAR ── */}
      <div className={`hidden md:flex ${collapsed ? 'w-12' : 'w-52'} bg-[#0e7fa8] flex-col flex-shrink-0 transition-all duration-200 sticky top-0 h-screen`}>
        <SidebarContent isMobile={false} />
      </div>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <div className="relative w-64 bg-[#0e7fa8] flex flex-col h-full z-10">
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0e7fa8] sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          <div>
            <p className="text-white text-xs font-medium">Sejuk Sejuk Ops</p>
            <p className="text-white/70 text-xs">Admin Panel</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

function AdminLayoutWrapper({ children }) { return <AdminLayout>{children}</AdminLayout> }
function TechnicianLayoutWrapper({ children }) { return <TechnicianLayout>{children}</TechnicianLayout> }
function ManagerLayoutWrapper({ children }) { return <ManagerLayout>{children}</ManagerLayout> }

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayoutWrapper><AdminDashboard /></AdminLayoutWrapper></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRole="admin"><AdminLayoutWrapper><AdminOrders /></AdminLayoutWrapper></ProtectedRoute>} />
          <Route path="/admin/orders/:id/detail" element={<ProtectedRoute allowedRole="admin"><AdminLayoutWrapper><AdminOrderDetail /></AdminLayoutWrapper></ProtectedRoute>} />
          <Route path="/admin/orders/new" element={<ProtectedRoute allowedRole="admin"><AdminLayoutWrapper><NewOrder /></AdminLayoutWrapper></ProtectedRoute>} />
          <Route path="/admin/orders/:id/edit" element={<ProtectedRoute allowedRole="admin"><AdminLayoutWrapper><EditOrder /></AdminLayoutWrapper></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminLayoutWrapper><AdminUsers /></AdminLayoutWrapper></ProtectedRoute>} />
          <Route path="/admin/branches" element={<ProtectedRoute allowedRole="admin"><AdminLayoutWrapper><AdminBranches /></AdminLayoutWrapper></ProtectedRoute>} />

          {/* Technician */}
          <Route path="/technician" element={<Navigate to="/technician/jobs" replace />} />
          <Route path="/technician/jobs" element={<ProtectedRoute allowedRole="technician"><TechnicianLayoutWrapper><TechnicianJobs /></TechnicianLayoutWrapper></ProtectedRoute>} />
          <Route path="/technician/jobs/:id" element={<ProtectedRoute allowedRole="technician"><TechnicianLayoutWrapper><TechnicianJobDetail /></TechnicianLayoutWrapper></ProtectedRoute>} />
          <Route path="/technician/profile" element={<ProtectedRoute allowedRole="technician"><TechnicianLayoutWrapper><TechnicianProfile /></TechnicianLayoutWrapper></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/manager" element={<Navigate to="/manager/jobs" replace />} />
          <Route path="/manager/jobs" element={<ProtectedRoute allowedRole="manager"><ManagerLayoutWrapper><ManagerJobs /></ManagerLayoutWrapper></ProtectedRoute>} />
          <Route path="/manager/jobs/:id" element={<ProtectedRoute allowedRole="manager"><ManagerLayoutWrapper><ManagerJobDetail /></ManagerLayoutWrapper></ProtectedRoute>} />
          <Route path="/manager/kpi" element={<ProtectedRoute allowedRole="manager"><ManagerLayoutWrapper><KpiDashboard /></ManagerLayoutWrapper></ProtectedRoute>} />
          <Route path="/manager/ai" element={<ProtectedRoute allowedRole="manager"><ManagerLayoutWrapper><AiAssistant /></ManagerLayoutWrapper></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
      </BrowserRouter>
    </AuthProvider>
  )
}

