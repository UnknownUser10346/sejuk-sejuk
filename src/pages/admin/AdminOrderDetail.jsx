import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value || '—'}</span>
    </div>
  )
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, assigned_technician:profiles!orders_assigned_technician_id_fkey(name, phone)')
      .eq('id', id)
      .single()
    if (data) setOrder(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading order...</div>
  )

  if (!order) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Order not found.</div>
  )

  const badge = statusBadge[order.status]
  const isPostponed = order.status === 'postponed'

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Topbar */}
      <div className="px-5 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-[#0e7fa8] hover:underline flex items-center gap-1 mb-0.5"
          >
            ← Back to Orders
          </button>
          <h1 className="text-sm font-medium text-gray-800">{order.order_no}</h1>
          <p className="text-xs text-gray-400">Order Summary</p>
        </div>
        <button
          onClick={() => navigate(`/admin/orders/${id}/edit`)}
          className="flex items-center gap-1.5 bg-[#0e7fa8] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#0c6d92] transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Edit Order
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-auto space-y-4">

        {/* Postponed Alert */}
        {isPostponed && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-orange-400 text-lg mt-0.5">⏸</span>
            <div>
              <p className="text-sm font-semibold text-orange-700">This job has been postponed</p>
              {order.postpone_reason && (
                <p className="text-xs text-orange-600 mt-0.5">Reason: {order.postpone_reason}</p>
              )}
              {order.postponed_count > 0 && (
                <p className="text-xs text-orange-500 mt-0.5">Postponed {order.postponed_count}× total</p>
              )}
              <p className="text-xs text-orange-500 mt-1">Set a new scheduled date in Edit Order to reassign this job.</p>
            </div>
          </div>
        )}

        {/* 2x2 Card Grid */}
        <div className="grid grid-cols-2 gap-4">

          {/* Order Info */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-[#0e7fa8] uppercase tracking-wide">Order Info</h2>
              {badge && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Order No" value={order.order_no} />
              <InfoRow label="Scheduled Date" value={order.scheduled_date
                ? new Date(order.scheduled_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
                : null} />
              <InfoRow label="Created At" value={new Date(order.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} />
              {order.rescheduled_count > 0 && (
                <InfoRow label="Rescheduled" value={`${order.rescheduled_count}× time(s)`} />
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
            <h2 className="text-xs font-semibold text-[#0e7fa8] uppercase tracking-wide mb-3">Customer Details</h2>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Customer Name" value={order.customer_name} />
              <InfoRow label="Phone" value={order.customer_phone} />
              <InfoRow label="Address" value={order.customer_address} />
              <InfoRow label="Problem Description" value={order.problem_description} />
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
            <h2 className="text-xs font-semibold text-[#0e7fa8] uppercase tracking-wide mb-3">Service Details</h2>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Service Type" value={serviceLabel[order.service_type] || order.service_type} />
              <InfoRow label="Quoted Price" value={order.quoted_price ? `RM ${order.quoted_price}` : null} />
              {order.notes && <InfoRow label="Notes" value={order.notes} />}
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
            <h2 className="text-xs font-semibold text-[#0e7fa8] uppercase tracking-wide mb-3">Assignment</h2>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Assigned Technician" value={order.assigned_technician?.name} />
              <InfoRow label="Technician Phone" value={order.assigned_technician?.phone} />
              <InfoRow label="Branch" value={order.branch} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
