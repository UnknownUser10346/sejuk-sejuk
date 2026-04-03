import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrderForm from './components/OrderForm'

function generateOrderNo() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const rand = Math.floor(100 + Math.random() * 900)
  return `ORD-${y}${m}${d}-${rand}`
}

const emptyForm = () => ({
  order_no: generateOrderNo(),
  scheduled_date: new Date().toISOString().split('T')[0],
  customer_name: '',
  customer_phone: '',
  customer_address: '',
  problem_description: '',
  service_type: '',
  quoted_price: '',
  assigned_technician_id: '',
  branch: '',          // ← auto-filled from technician
  admin_notes: '',
})

const serviceLabel = {
  servicing:    'AC Servicing',
  installation: 'AC Installation',
  gas_refill:   'Gas Refill',
  repair:       'Repair',
  cleaning:     'Cleaning',
}

const formatPhoneForWa = (phone) => {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '60' + digits.slice(1)
  if (!digits.startsWith('60')) digits = '60' + digits
  return digits
}

export default function NewOrder() {
  const navigate = useNavigate()
  const [technicians, setTechnicians] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState(null)

  // ── Task 4: Technician WA notification ──────────────────────
  const [techWaUrl, setTechWaUrl] = useState(null)
  // ────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'technician')
      .then(({ data }) => setTechnicians(data || []))
  }, [])

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

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_no:               form.order_no,
        scheduled_date:         form.scheduled_date,
        customer_name:          form.customer_name,
        customer_phone:         form.customer_phone,
        customer_address:       form.customer_address,
        problem_description:    form.problem_description,
        service_type:           form.service_type,
        quoted_price:           parseFloat(form.quoted_price),
        assigned_technician_id: form.assigned_technician_id || null,
        branch:                 form.branch || null,
        admin_notes:            form.admin_notes,
        status:                 form.assigned_technician_id ? 'assigned' : 'new',
      }])
      .select('*, assigned_technician:profiles!orders_assigned_technician_id_fkey(name)')

    setLoading(false)

    if (error) {
      console.error('Insert error:', error)
      alert(`Failed to save order: ${error.message}`)
      return
    }

    setSubmittedOrder(data[0])
    setSubmitted(true)

    // 🔔 Task 4: Build technician WA notification link
    if (form.assigned_technician_id) {
      const { data: techProfile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', form.assigned_technician_id)
        .single()

      const svc = serviceLabel[form.service_type] || form.service_type
      const msg =
        `Hi *${techProfile?.name || 'Technician'}*,\n\n` +
        `A new job *${data[0].order_no}* has been assigned to you.\n` +
        `Customer: ${form.customer_name}\n` +
        `Service: ${svc}\n` +
        `Date: ${form.scheduled_date}\n` +
        `Address: ${form.customer_address}\n\n` +
        `Please check your job list.`

      const phone = formatPhoneForWa(techProfile?.phone)
      if (phone) {
        setTechWaUrl(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`)
      } else {
        // No phone on profile — still show button with generic WA link
        setTechWaUrl(`https://wa.me/?text=${encodeURIComponent(msg)}`)
      }
    }
  }

  const handleReset = () => {
    setForm(emptyForm())
    setErrors({})
  }

  // ── Success Summary ──
  if (submitted && submittedOrder) {
    const tech = submittedOrder.assigned_technician
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-sm font-medium text-gray-800">New Order</h1>
            <p className="text-xs text-gray-400">Order submitted successfully</p>
          </div>
          <button onClick={() => navigate('/admin/orders')}
            className="text-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            ← Back to Orders
          </button>
        </div>

        <div className="p-5 flex-1 overflow-auto">
          <div className="max-w-xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <span className="text-green-500 text-lg">✓</span>
              <div>
                <p className="text-sm font-medium text-green-800">Order Created Successfully</p>
                <p className="text-xs text-green-600 mt-0.5">Saved to database.</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800">Order Summary</h3>
                <span className="text-xs font-medium text-[#0e7fa8]">{submittedOrder.order_no}</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ['Customer',     submittedOrder.customer_name],
                  ['Phone',        submittedOrder.customer_phone],
                  ['Service Type', submittedOrder.service_type],
                  ['Quoted Price', `RM ${parseFloat(submittedOrder.quoted_price).toFixed(2)}`],
                  ['Technician',   tech?.name || '—'],
                  ['Branch',       submittedOrder.branch || '—'],
                  ['Scheduled',    submittedOrder.scheduled_date],
                  ['Status',       submittedOrder.assigned_technician_id ? 'Assigned' : 'Pending'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400">{k}</p>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">{v}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-xs font-medium text-gray-800 mt-0.5">{submittedOrder.customer_address}</p>
                </div>
                {submittedOrder.problem_description && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Problem</p>
                    <p className="text-xs text-gray-700 mt-0.5">{submittedOrder.problem_description}</p>
                  </div>
                )}
                {submittedOrder.admin_notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Admin Notes</p>
                    <p className="text-xs text-gray-700 mt-0.5">{submittedOrder.admin_notes}</p>
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
              <button onClick={() => { setSubmitted(false); setTechWaUrl(null); handleReset() }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
                + Create Another Order
              </button>
              <button onClick={() => navigate('/admin/orders')}
                className="flex-1 py-2 bg-[#0e7fa8] text-white rounded-lg text-xs hover:bg-[#0c6d92]">
                View All Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200">
        <div className="flex-1">
          <h1 className="text-sm font-medium text-gray-800">New Order</h1>
          <p className="text-xs text-gray-400">Fill in details to create a service order</p>
        </div>
        <button onClick={() => navigate('/admin/orders')}
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
        />
      </div>
    </div>
  )
}
