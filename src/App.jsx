import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import NewOrder from './pages/admin/NewOrder'
import EditOrder from './pages/admin/EditOrder'
import TechnicianLayout from './pages/technician/TechnicianLayout'
import TechnicianJobs from './pages/technician/TechnicianJobs'
import TechnicianJobDetail from './pages/technician/TechnicianJobDetail'
import TechnicianProfile from './pages/technician/TechnicianProfile'
import ManagerLayout from './pages/manager/ManagerLayout'
import ManagerJobs from './pages/manager/ManagerJobs'
import ManagerJobDetail from './pages/manager/ManagerJobDetail'

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

  const reportItems = [
    {
      label: 'Technicians',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.2L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
        </svg>
      ),
      path: '/admin/technicians',
    },
    {
      label: 'KPI',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13h2.8v6h-2.8v-6z"/>
        </svg>
      ),
      path: '/admin/kpi',
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

          {!collapsed && <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2 mt-2">Reports</p>}
          {reportItems.map(item => (
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

          {/* Admin — role: admin only */}
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
          <Route path="/admin/technicians" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Technicians — coming soon</div>
              </AdminLayoutWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin/kpi" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayoutWrapper>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">KPI Dashboard — coming soon</div>
              </AdminLayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Technician — role: technician only */}
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

          {/* Manager — role: manager only */}
          <Route path="/manager" element={<Navigate to="/manager/jobs" replace />} />
          <Route path="/manager/jobs" element={
            <ProtectedRoute allowedRole="manager">
              <ManagerLayout><ManagerJobs /></ManagerLayout>
            </ProtectedRoute>
          } />
          <Route path="/manager/jobs/:id" element={
            <ProtectedRoute allowedRole="manager">
              <ManagerLayout><ManagerJobDetail /></ManagerLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
