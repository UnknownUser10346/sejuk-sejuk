import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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
  postponed:   { label: 'Postponed',   className: 'bg-orange-100 text-orange-700' },
  job_done:    { label: 'Completed',   className: 'bg-green-100 text-green-800' },
  reviewed:    { label: 'Reviewed',    className: 'bg-teal-100 text-teal-800' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-600' },
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, assigned_technician:profiles!orders_assigned_technician_id_fkey(name)')
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const filtered = orders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_no?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Topbar */}
      <div className="px-5 py-3 bg-white border-b border-gray-200">
        <h1 className="text-sm font-medium text-gray-800">Orders</h1>
        <p className="text-xs text-gray-400">Manage all service orders</p>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-auto">

        {/* New Order button above table */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/admin/orders/new')}
            className="bg-[#0e7fa8] text-white text-xs px-3 py-2 rounded-lg hover:bg-[#0c6d92]"
          >
            + New Order
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <span className="text-xs font-medium text-[#0e7fa8] border-b-2 border-[#0e7fa8] pb-1">All Orders</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="ml-2 h-8 px-3 border border-gray-300 rounded-lg text-xs bg-gray-50 outline-none w-48 focus:border-[#0e7fa8]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10 text-xs">Loading orders...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-10 text-xs">No orders found</td></tr>
                ) : (
                  filtered.map(order => (
                    <tr key={order.id} onClick={() => navigate(`/admin/orders/${order.id}/detail`)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                      {/* Edit button — leftmost cell */}
                      
                      <td className="px-4 py-3 text-[#0e7fa8] font-medium text-xs">{order.order_no}</td>
                      <td className="px-4 py-3 text-xs text-gray-800">{order.customer_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{serviceLabel[order.service_type] || order.service_type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge[order.status]?.className}`}>
                          {statusBadge[order.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{order.assigned_technician?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
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