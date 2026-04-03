import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const serviceLabel = {
  servicing:    'AC Servicing',
  installation: 'AC Installation',
  gas_refill:   'Gas Refill',
  repair:       'Repair',
  cleaning:     'Cleaning',
}

const statusBadge = {
  new:         { label: 'Pending',     className: 'bg-amber-100 text-amber-800' },
  assigned:    { label: 'Assigned',    className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  job_done:    { label: 'Completed',   className: 'bg-green-100 text-green-800' },
  reviewed:    { label: 'Reviewed',    className: 'bg-teal-100 text-teal-800' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-600' },
  postponed:   { label: 'Postponed',   className: 'bg-orange-100 text-orange-700' },
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completedToday: 0 })

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const today = new Date().toISOString().split('T')[0]

    // Fetch recent 20 for the table
    const { data } = await supabase
      .from('orders')
      .select('*, assigned_technician:profiles!orders_assigned_technician_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setOrders(data)

    // Fetch all orders for accurate stats
    const { data: all } = await supabase
      .from('orders')
      .select('status, completed_at, updated_at')

    if (all) {
      setStats({
        total:          all.length,
        pending:        all.filter(o => o.status === 'new').length,
        inProgress:     all.filter(o => o.status === 'in_progress').length,
        completedToday: all.filter(o =>
          o.status === 'job_done' && (
            o.completed_at?.startsWith(today) ||
            (!o.completed_at && o.updated_at?.startsWith(today))
          )
        ).length,
      })
    }
  }

  const filtered = orders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_no?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-sm font-medium text-gray-800">Dashboard</h1>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Logged in as <span className="font-medium text-gray-800">{user?.name || '—'}</span>
        </p>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Orders',       value: stats.total,          color: 'text-gray-800' },
            { label: 'Pending Assignment', value: stats.pending,        color: 'text-amber-600' },
            { label: 'In Progress',        value: stats.inProgress,     color: 'text-blue-700' },
            { label: 'Completed Today',    value: stats.completedToday, color: 'text-green-700' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders Table */}
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
                      
                      className="border-b border-gray-100"
                    >
                      <td className="px-4 py-2 text-[#0e7fa8] font-medium text-xs">{order.order_no}</td>
                      <td className="px-4 py-2 text-xs text-gray-800">{order.customer_name}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{serviceLabel[order.service_type] || order.service_type}</td>
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
  )
}