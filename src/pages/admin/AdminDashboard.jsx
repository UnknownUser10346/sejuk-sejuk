import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const statusBadge = {
  new: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  assigned: { label: 'Assigned', className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  job_done: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  reviewed: { label: 'Reviewed', className: 'bg-teal-100 text-teal-800' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-600' },
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({
    total: 0, pending: 0, inProgress: 0, completedToday: 0
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, assigned_technician:profiles!orders_assigned_technician_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setOrders(data)
      const today = new Date().toISOString().split('T')[0]
      setStats({
        total: data.length,
        pending: data.filter(o => o.status === 'new').length,
        inProgress: data.filter(o => o.status === 'in_progress').length,
        completedToday: data.filter(o =>
          o.status === 'job_done' && o.updated_at?.startsWith(today)
        ).length,
      })
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const filtered = orders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_no?.toLowerCase().includes(search.toLowerCase())
  )

  const navItems = [
    { label: 'Dashboard', icon: '▦', path: '/admin', active: true },
    { label: 'Orders', icon: '☰', path: '/admin/orders' },
    { label: 'New Order', icon: '+', path: '/admin/orders/new' },
  ]

  const reportItems = [
    { label: 'Technicians', 
        icon: (
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.2L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
          </svg>
        ),
        path: '/admin/technicians' 
    },
    { label: 'KPI', 
        icon: (
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
            <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13h2.8v6h-2.8v-6z"/>
          </svg>
        ),
        path: '/admin/kpi' 
    },
  ]

  return (
    <div className="flex min-h-screen text-sm bg-gray-50">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-12' : 'w-52'} bg-[#0e7fa8] flex flex-col flex-shrink-0 transition-all duration-200`}>
        {/* Brand */}
        <div className="flex items-center gap-2 px-2 py-3 border-b border-white/15 min-h-14">
            <button onClick={() => setCollapsed(!collapsed)}
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
                <p className="text-white/60 text-xs">Admin Panel</p>
            </div>
            )}
        </div>

        {/* Nav */}
        <div className="flex-1 px-2 py-2">
            {!collapsed && <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2">Main</p>}
            {navItems.map(item => (
                <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-left transition-all ${
                        item.active
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-white/80 hover:bg-white/12 hover:text-white'
                    }`}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="text-xs">{item.label}</span>}
                </button>
            ))}

          {!collapsed && <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2 mt-2">Reports</p>}
          {reportItems.map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-white/80 hover:bg-white/12 hover:text-white text-left transition-all"
            >
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-xs">{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="px-2 py-2 border-t border-white/15">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/60 hover:bg-white/12 hover:text-white text-left"
          >
            <span className="text-sm flex-shrink-0">→</span>
            {!collapsed && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-sm font-medium text-gray-800">Dashboard</h1>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-xs text-gray-500">
            Logged in as <span className="font-medium text-gray-800">{user?.name}</span>
          </div>
          <button
            onClick={() => navigate('/admin/orders/new')}
            className="bg-[#0e7fa8] text-white text-xs px-3 py-2 rounded-lg hover:bg-[#0c6d92]"
          >
            + New Order
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Orders', value: stats.total, color: 'text-gray-800' },
              { label: 'Pending Assignment', value: stats.pending, color: 'text-amber-600' },
              { label: 'In Progress', value: stats.inProgress, color: 'text-blue-700' },
              { label: 'Completed Today', value: stats.completedToday, color: 'text-green-700' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-800">Recent Orders</h3>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="h-8 px-3 border border-gray-300 rounded-lg text-xs bg-gray-50 outline-none w-40 focus:border-[#0e7fa8]"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Order No', 'Customer', 'Service Type', 'Status', 'Technician', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-2 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-gray-400 py-8 text-xs">No orders found</td></tr>
                  ) : (
                    filtered.map(order => (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-2 text-[#0e7fa8] font-medium text-xs">{order.order_no}</td>
                        <td className="px-4 py-2 text-xs text-gray-800">{order.customer_name}</td>
                        <td className="px-4 py-2 text-xs text-gray-600 capitalize">{order.service_type}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge[order.status]?.className}`}>
                            {statusBadge[order.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600">{order.assigned_technician?.name || '—'}</td>
                        <td className="px-4 py-2 text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}