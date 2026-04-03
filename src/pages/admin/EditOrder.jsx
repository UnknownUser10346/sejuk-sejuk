import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrderForm from './components/OrderForm'

const statusBadge = {
  new:         { label: 'Pending',     className: 'bg-amber-100 text-amber-800' },
  assigned:    { label: 'Assigned',    className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  postponed:   { label: 'Postponed',   className: 'bg-orange-100 text-orange-800' },  // ← NEW
  job_done:    { label: 'Completed',   className: 'bg-green-100 text-green-800' },
  reviewed:    { label: 'Reviewed',    className: 'bg-teal-100 text-teal-800' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-600' },
}

export default function EditOrder() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [technicians, setTechnicians] = useState([])
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [savedOrder, setSavedOrder] = useState(null)
  const [notFound, setNotFound] = useState(false)

  // ── Reschedule tracking ─────────────────────────────────────
  const [originalScheduledDate, setOriginalScheduledDate] = useState('')
  const [originalRescheduleCount, setOriginalRescheduleCount] = useState(0)
  // ────────────────────────────────────────────────────────────

  // ── Task 4: Technician WA notification ──────────────────────
  const [techWaUrl, setTechWaUrl] = useState(null)
  // ────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'technician')
      .then(({ data }) => setTechnicians(data || []))

    supabase
      .from('orders')
      .select('*, assigned_technician:profiles!orders_assigned_technician_id_fkey(name)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setFetching(false); return }

        // ← Store originals for reschedule detection
        setOriginalScheduledDate(data.scheduled_date ?? '')
        setOriginalRescheduleCount(data.rescheduled_count ?? 0)

        setForm({
          order_no:               data.order_no,
          scheduled_date:         data.scheduled_date ?? '',
          customer_name:          data.customer_name ?? '',
          customer_phone:         data.customer_phone ?? '',
          customer_address:       data.customer_address ?? '',
          problem_description:    data.problem_description ?? '',
          service_type:           data.service_type ?? '',
          quoted_price:           data.quoted_price !== null ? String(data.quoted_price) : '',
          assigned_technician_id: data.assigned_technician_id ?? '',
          branch:                 data.branch ?? '',
          admin_notes:            data.admin_notes ?? '',
          status:                 data.status,
        })
        setFetching(false)
      })
  }, [id])

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const required = {
      customer_name:           'Customer name is required',
      customer_phone:          'Phone number is required',
      customer_address:        'Address is required',
      problem_description:     'Problem description is required',
      service_type:            'Please select a service type',
      quoted_price:            'Quoted price is required',
      assigned_technician_id:  'Please assign a technician',
    }
    const newErrors = {}
    for (const [key, msg] of Object.entries(required)) {
      if (!form[key]) newErrors[key] = msg
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    const newStatus =
      form.status === 'new' && form.assigned_technician_id
        ? 'assigned'
        : form.status

    // ── Reschedule detection ──────────────────────────────────
    const dateChanged =
      form.scheduled_date &&
      form.scheduled_date !== originalScheduledDate

    const newRescheduleCount = dateChanged
      ? originalRescheduleCount + 1
      : originalRescheduleCount
    // ──────────────────────────────────────────────────────────

    // If the order was postponed and admin sets a new date → revert to assigned
    const resolvedStatus =
      form.status === 'postponed' && dateChanged && form.assigned_technician_id
        ? 'assigned'
        : newStatus

    const { data, error } = await supabase
      .from('orders')
      .update({
        scheduled_date:          form.scheduled_date,
        customer_name:           form.customer_name,
        customer_phone:          form.customer_phone,
        customer_address:        form.customer_address,
        problem_description:     form.problem_description,
        service_type:            form.service_type,
        quoted_price:            parseFloat(form.quoted_price),
        assigned_technician_id:  form.assigned_technician_id || null,
        branch:                  form.branch || null,
        admin_notes:             form.admin_notes,
        status:                  resolvedStatus,
        rescheduled_count:       newRescheduleCount,  // ← NEW
      })
      .eq('id', id)
      .select('*, assigned_technician:profiles!orders_assigned_technician_id_fkey(name)')

    setLoading(false)

    if (error) {
      console.error('Update error:', error)
      alert(`Failed to update order: ${error.message}`)
      return
    }

    // Update originals so "Continue Editing" → save again won't double-count
    setOriginalScheduledDate(form.scheduled_date)
    setOriginalRescheduleCount(newRescheduleCount)

    setSavedOrder(data[0])
    setSaved(true)

    // 🔔 Task 4: Build technician WA notification link
    if (form.assigned_technician_id) {
      const { data: techProfile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', form.assigned_technician_id)
        .single()

      if (techProfile?.phone) {
        let digits = techProfile.phone.replace(/\D/g, '')
        if (digits.startsWith('0')) digits = '60' + digits.slice(1)
        if (!digits.startsWith('60')) digits = '60' + digits

        const serviceLabels = {
          servicing: 'AC Servicing', installation: 'AC Installation',
          gas_refill: 'Gas Refill',  repair: 'Repair', cleaning: 'Cleaning',
        }
        const svc = serviceLabels[form.service_type] || form.service_type
        const isRescheduled = dateChanged

        const msg =
          `Hi *${techProfile.name}*,\n\n` +
          (isRescheduled
            ? `Job *${data[0].order_no}* has been *rescheduled* to *${form.scheduled_date}*.\n`
            : `Job *${data[0].order_no}* details have been updated.\n`) +
          `Customer: ${form.customer_name}\n` +
          `Service: ${svc}\n` +
          `Date: ${form.scheduled_date}\n` +
          `Address: ${form.customer_address}\n\n` +
          `Please check your job list.`

        setTechWaUrl(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`)
      }
    }
  }

  const handleReset = () => {
    setFetching(true)
    setSaved(false)
    supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setOriginalScheduledDate(data.scheduled_date ?? '')
          setOriginalRescheduleCount(data.rescheduled_count ?? 0)
          setForm({
            order_no:               data.order_no,
            scheduled_date:         data.scheduled_date ?? '',
            customer_name:          data.customer_name ?? '',
            customer_phone:         data.customer_phone ?? '',
            customer_address:       data.customer_address ?? '',
            problem_description:    data.problem_description ?? '',
            service_type:           data.service_type ?? '',
            quoted_price:           data.quoted_price !== null ? String(data.quoted_price) : '',
            assigned_technician_id: data.assigned_technician_id ?? '',
            branch:                 data.branch ?? '',
            admin_notes:            data.admin_notes ?? '',
            status:                 data.status,
          })
        }
        setFetching(false)
      })
  }

  // ── Not found ──
  if (notFound) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3 bg-white border-b border-gray-200">
          <h1 className="text-sm font-medium text-gray-800">Order Not Found</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">This order does not exist or was deleted.</p>
            <button onClick={() => navigate(`/admin/orders/${id}/detail`)}
              className="text-xs px-4 py-2 bg-[#0e7fa8] text-white rounded-lg hover:bg-[#0c6d92]">
              ← Back to Orders
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (fetching || !form) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-gray-400">Loading order...</p>
      </div>
    )
  }

  // ── Success Summary ──
  if (saved && savedOrder) {
    const tech = savedOrder.assigned_technician
    const wasRescheduled = savedOrder.rescheduled_count > 0

    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-sm font-medium text-gray-800">Edit Order</h1>
            <p className="text-xs text-gray-400">Order updated successfully</p>
          </div>
          <button onClick={() => navigate(`/admin/orders/${id}/detail`)}
            className="text-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            ← Back to Orders
          </button>
        </div>

        <div className="p-5 flex-1 overflow-auto">
          <div className="max-w-xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <span className="text-green-500 text-lg">✓</span>
              <div>
                <p className="text-sm font-medium text-green-800">Order Updated Successfully</p>
                <p className="text-xs text-green-600 mt-0.5">Changes have been saved to the database.</p>
              </div>
            </div>

            {/* ← NEW: Reschedule notice */}
            {wasRescheduled && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <span className="text-blue-500">📅</span>
                <p className="text-xs text-blue-700">
                  Rescheduled <span className="font-semibold">{savedOrder.rescheduled_count}×</span> total
                  · New date: <span className="font-semibold">{savedOrder.scheduled_date}</span>
                </p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800">Order Summary</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge[savedOrder.status]?.className}`}>
                    {statusBadge[savedOrder.status]?.label}
                  </span>
                  <span className="text-xs font-medium text-[#0e7fa8]">{savedOrder.order_no}</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ['Customer',        savedOrder.customer_name],
                  ['Phone',           savedOrder.customer_phone],
                  ['Service Type',    savedOrder.service_type],
                  ['Quoted Price',    `RM ${parseFloat(savedOrder.quoted_price).toFixed(2)}`],
                  ['Technician',      tech?.name || '—'],
                  ['Branch',          savedOrder.branch || '—'],
                  ['Scheduled Date',  savedOrder.scheduled_date || '—'],
                  ['Rescheduled',     savedOrder.rescheduled_count > 0 ? `${savedOrder.rescheduled_count}×` : 'No'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400">{k}</p>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">{v}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-xs font-medium text-gray-800 mt-0.5">{savedOrder.customer_address}</p>
                </div>
                {savedOrder.problem_description && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Problem</p>
                    <p className="text-xs text-gray-700 mt-0.5">{savedOrder.problem_description}</p>
                  </div>
                )}
                {savedOrder.admin_notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Admin Notes</p>
                    <p className="text-xs text-gray-700 mt-0.5">{savedOrder.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 🔔 Task 4: Notify Technician button */}
            {techWaUrl && (
              <a
                href={techWaUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
              >
                📲 Notify Technician via WhatsApp
              </a>
            )}

            <div className="flex gap-2 mt-3">
              <button onClick={() => { setSaved(false); setTechWaUrl(null) }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
                ← Continue Editing
              </button>
              <button onClick={() => navigate(`/admin/orders/${id}/detail`)}
                className="flex-1 py-2 bg-[#0e7fa8] text-white rounded-lg text-xs hover:bg-[#0c6d92]">
                View All Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Edit Form ──
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200">
        <div className="flex-1">
          <h1 className="text-sm font-medium text-gray-800">Edit Order</h1>
          <p className="text-xs text-gray-400">
            {form.order_no} &nbsp;·&nbsp;
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[form.status]?.className}`}>
              {statusBadge[form.status]?.label}
            </span>
            {originalRescheduleCount > 0 && (
              <span className="ml-2 text-blue-500 font-medium">📅 Rescheduled {originalRescheduleCount}×</span>
            )}
          </p>
        </div>
        <button onClick={() => navigate(`/admin/orders/${id}/detail`)}
          className="text-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          ← Back to Orders
        </button>
      </div>

      <div className="p-5 flex-1 overflow-auto">
        <OrderForm
          form={form}
          errors={errors}
          technicians={technicians}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          loading={loading}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  )
}
