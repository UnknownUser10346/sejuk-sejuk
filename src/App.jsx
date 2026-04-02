import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import NewOrder from './pages/admin/NewOrder'
import EditOrder from './pages/admin/EditOrder'
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

function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

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
              <p className="text-white/60 text-xs">Admin Panel</p>
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

          {!collapsed && <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2 mt-2">Management</p>}
          {managementItems.map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-left transition-all ${
                isActive(item.path) ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/12 hover:text-white'
              }`}>
              <span className="text-sm flex-shrink-0">{item.icon}</span>
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

function AdminLayoutWrapper({ children }) {
  return <AdminLayout>{children}</AdminLayout>
}

function TechnicianLayoutWrapper({ children }) {
  return <TechnicianLayout>{children}</TechnicianLayout>
}

function ManagerLayoutWrapper({ children }) {
  return <ManagerLayout>{children}</ManagerLayout>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper><AdminDashboard /></AdminLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper><AdminOrders /></AdminLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders/new" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper><NewOrder /></AdminLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders/:id" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper><EditOrder /></AdminLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper><AdminUsers /></AdminLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin/branches" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper><AdminBranches /></AdminLayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Technician */}
          <Route path="/technician" element={<Navigate to="/technician/jobs" replace />} />
          <Route path="/technician/jobs" element={
            <ProtectedRoute allowedRole="technician">
              <TechnicianLayoutWrapper><TechnicianJobs /></TechnicianLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/technician/jobs/:id" element={
            <ProtectedRoute allowedRole="technician">
              <TechnicianLayoutWrapper><TechnicianJobDetail /></TechnicianLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/technician/profile" element={
            <ProtectedRoute allowedRole="technician">
              <TechnicianLayoutWrapper><TechnicianProfile /></TechnicianLayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Manager */}
          <Route path="/manager" element={<Navigate to="/manager/jobs" replace />} />
          <Route path="/manager/kpi" element={
            <ProtectedRoute allowedRole="manager">
              <ManagerLayoutWrapper><KpiDashboard /></ManagerLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/manager/jobs" element={
            <ProtectedRoute allowedRole="manager">
              <ManagerLayoutWrapper><ManagerJobs /></ManagerLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/manager/jobs/:id" element={
            <ProtectedRoute allowedRole="manager">
              <ManagerLayoutWrapper><ManagerJobDetail /></ManagerLayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}