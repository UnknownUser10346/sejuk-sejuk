import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const statusBadge = {
  new:         { label: 'Pending',     className: 'bg-amber-100 text-amber-700' },
  assigned:    { label: 'Assigned',    className: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  job_done:    { label: 'Completed',   className: 'bg-green-100 text-green-700' },
  reviewed:    { label: 'Reviewed',    className: 'bg-teal-100 text-teal-700' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-500' },
}

const serviceLabel = {
  servicing:    'AC Servicing',
  installation: 'AC Installation',
  gas_refill:   'Gas Refill',
  repair:       'Repair',
  cleaning:     'Cleaning',
}

const PAYMENT_METHODS = ['Cash', 'Online Transfer', 'QR Pay', 'Card']

export default function TechnicianJobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    work_done: '',
    extra_charges: '',
    remarks: '',
    payment_amount: '',
    payment_method: '',
  })
  const [errors, setErrors] = useState({})
  const [files, setFiles] = useState([])
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setFetching(false); return }
        setJob(data)
        if (data.work_done) {
          setForm({
            work_done:      data.work_done ?? '',
            extra_charges:  data.extra_charges != null ? String(data.extra_charges) : '',
            remarks:        data.remarks ?? '',
            payment_amount: data.payment_amount != null ? String(data.payment_amount) : '',
            payment_method: data.payment_method ?? '',
          })
        }
        setFetching(false)
      })
  }, [id])

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const quoted = parseFloat(job?.quoted_price ?? 0)
  const extra = parseFloat(form.extra_charges || 0)
  const finalAmount = (isNaN(quoted) ? 0 : quoted) + (isNaN(extra) ? 0 : extra)

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files)
    const remaining = 6 - files.length
    setFiles(prev => [...prev, ...selected.slice(0, remaining)])
  }

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index))

  const validate = () => {
    const newErrors = {}
    if (!form.work_done.trim()) newErrors.work_done = 'Please describe work done'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Mark as In Progress
  const handleStartJob = async () => {
    if (job.status !== 'assigned') return
    setStarting(true)
    const { data } = await supabase
      .from('orders')
      .update({ status: 'in_progress' })
      .eq('id', id)
      .select()
    setStarting(false)
    if (data?.[0]) setJob(data[0])
  }

  // Upload files to Supabase Storage
  const uploadFiles = async () => {
    const urls = []
    for (const file of files) {
      const path = `job-photos/${id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('job-uploads').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('job-uploads').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  // Submit completion
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)

    let photoUrls = []
    if (files.length > 0) photoUrls = await uploadFiles()

    const { data, error } = await supabase
      .from('orders')
      .update({
        work_done:      form.work_done,
        extra_charges:  parseFloat(form.extra_charges || 0),
        final_amount:   finalAmount,
        remarks:        form.remarks || null,
        payment_amount: form.payment_amount ? parseFloat(form.payment_amount) : null,
        payment_method: form.payment_method || null,
        photo_urls:     photoUrls.length > 0 ? photoUrls : null,
        completed_at:   new Date().toISOString(),
        status:         'job_done',
      })
      .eq('id', id)
      .select()

    setSubmitting(false)

    if (error) {
      alert(`Failed to submit: ${error.message}`)
      return
    }

    if (data?.[0]) setJob(data[0])
  }

  // ── Loading / Not found ──
  if (fetching) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-xs text-gray-400">Loading job...</p>
    </div>
  )

  if (notFound) return (
    <div className="p-4 text-center py-20">
      <p className="text-gray-400 text-sm mb-4">Job not found.</p>
      <button onClick={() => navigate('/technician/jobs')}
        className="text-xs px-4 py-2 bg-[#0e7fa8] text-white rounded-lg">
        ← Back to Jobs
      </button>
    </div>
  )

  const isDone = ['job_done', 'reviewed', 'closed'].includes(job.status)

  // ── Completed view ──
  if (isDone) return (
    <div className="p-4">
      <button onClick={() => navigate('/technician/jobs')}
        className="flex items-center gap-1 text-xs text-gray-500 mb-4">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Back to Jobs
      </button>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-3">
        <span className="text-green-500 text-xl">✓</span>
        <div>
          <p className="text-sm font-medium text-green-800">Job Completed</p>
          <p className="text-xs text-green-600 mt-0.5">{job.order_no} has been marked as done.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">Job Summary</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[job.status]?.className}`}>
            {statusBadge[job.status]?.label}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {[
            ['Order No',      job.order_no],
            ['Customer',      job.customer_name],
            ['Service',       serviceLabel[job.service_type] || job.service_type],
            ['Quoted Price',  `RM ${parseFloat(job.quoted_price).toFixed(2)}`],
            ['Extra Charges', `RM ${parseFloat(job.extra_charges ?? 0).toFixed(2)}`],
            ['Final Amount',  `RM ${parseFloat(job.final_amount ?? 0).toFixed(2)}`],
            ['Work Done',     job.work_done],
            ['Remarks',       job.remarks || '—'],
            ['Payment',       job.payment_amount ? `RM ${parseFloat(job.payment_amount).toFixed(2)} via ${job.payment_method}` : '—'],
            ['Completed At',  job.completed_at ? new Date(job.completed_at).toLocaleString('en-MY') : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <p className="text-xs text-gray-400 w-28 flex-shrink-0">{k}</p>
              <p className="text-xs text-gray-800 font-medium flex-1">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Job Detail + Form ──
  return (
    <div className="p-4">
      {/* Back */}
      <button onClick={() => navigate('/technician/jobs')}
        className="flex items-center gap-1 text-xs text-gray-500 mb-4">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Back to Jobs
      </button>

      {/* Job info card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#0e7fa8]">{job.order_no}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[job.status]?.className}`}>
            {statusBadge[job.status]?.label}
          </span>
        </div>
        <p className="text-base font-medium text-gray-800 mb-1">{job.customer_name}</p>
        <p className="text-xs text-gray-500 mb-1">📞 {job.customer_phone}</p>
        <p className="text-xs text-gray-500 mb-3">📍 {job.customer_address}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {serviceLabel[job.service_type] || job.service_type}
          </span>
          <span className="text-xs text-gray-500">
            Quoted: <span className="font-medium text-gray-800">RM {parseFloat(job.quoted_price).toFixed(2)}</span>
          </span>
        </div>
        {job.problem_description && (
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2">
            <p className="text-xs text-amber-700">⚠️ {job.problem_description}</p>
          </div>
        )}
        {job.admin_notes && (
          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2">
            <p className="text-xs text-blue-700">📝 Admin: {job.admin_notes}</p>
          </div>
        )}
      </div>

      {/* ── ASSIGNED: show Start Job button only, no form yet ── */}
      {job.status === 'assigned' && (
        <div>
          <button
            onClick={handleStartJob}
            disabled={starting}
            className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {starting ? 'Starting...' : 'Start Job'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Tap "Start Job" to begin and view the completion form.
          </p>
        </div>
      )}

      {/* ── IN PROGRESS: show full completion form ── */}
      {job.status === 'in_progress' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Service Completion</p>

          {/* Work Done + Charges + Remarks */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Work Done <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.work_done}
              onChange={e => set('work_done', e.target.value)}
              placeholder="Describe what was done..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none resize-none transition-colors ${
                errors.work_done ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[#0e7fa8]'
              }`}
            />
            {errors.work_done && <p className="text-xs text-red-500 mt-1">{errors.work_done}</p>}

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Extra Charges (RM)</label>
                <input
                  type="number"
                  value={form.extra_charges}
                  onChange={e => set('extra_charges', e.target.value)}
                  placeholder="0.00"
                  min="0" step="0.01"
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0e7fa8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Final Amount (RM)</label>
                <input
                  value={`RM ${finalAmount.toFixed(2)}`}
                  readOnly
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={e => set('remarks', e.target.value)}
                placeholder="Any additional remarks..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none resize-none focus:border-[#0e7fa8]"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Photos / Files</label>
              <span className="text-xs text-gray-400">{files.length}/6</span>
            </div>
            {files.length < 6 && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-[#0e7fa8] transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-400">
                  <path d="M19 7v2.99s-2.01.01-2 0V7h-3s.01-2 0-2h3V2h2v3h3v2h-3zm-3 4H8v-2c0-2.2 1.8-4 4-4h.6l1.4-2H8C5.8 3 4 4.8 4 7v13c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-9h-4zM8 17l2.5-3.21 1.79 2.15 2.5-3.22L18 17H8z"/>
                </svg>
                <span className="text-xs text-gray-500">Tap to upload photo / video / PDF</span>
                <input type="file" accept="image/*,video/*,.pdf" multiple className="hidden" onChange={handleFiles} />
              </label>
            )}
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {files.map((file, i) => (
                  <div key={i} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-2xl">📄</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                      </div>
                    )}
                    <button onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment (optional collapsible) */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <button
              onClick={() => setShowPayment(!showPayment)}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700"
            >
              <span>💰 Record Payment Received</span>
              <span className="text-gray-400">{showPayment ? '▲' : '▼'}</span>
            </button>
            {showPayment && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Amount (RM)</label>
                  <input
                    type="number"
                    value={form.payment_amount}
                    onChange={e => set('payment_amount', e.target.value)}
                    placeholder="e.g. 180.00"
                    min="0" step="0.01"
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0e7fa8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(method => (
                      <button key={method} onClick={() => set('payment_method', method)}
                        className={`py-2 text-xs rounded-lg border transition-colors ${
                          form.payment_method === method
                            ? 'bg-[#0e7fa8] text-white border-[#0e7fa8]'
                            : 'border-gray-300 text-gray-600 hover:border-[#0e7fa8]'
                        }`}>
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Technician + Timestamp */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#0e7fa8] rounded-full flex items-center justify-center text-white text-xs font-medium">
                {user?.name?.charAt(0) || 'T'}
              </div>
              <span className="text-xs font-medium text-gray-700">{user?.name || 'Technician'}</span>
            </div>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-green-600 text-white text-sm font-medium rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : '✓ Mark Job as Done'}
          </button>
        </div>
      )}
    </div>
  )
}