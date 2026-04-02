import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const statusBadge = {
  new:         { label: 'Pending',        className: 'bg-amber-100 text-amber-700' },
  assigned:    { label: 'Assigned',       className: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'In Progress',    className: 'bg-blue-100 text-blue-700' },
  job_done:    { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
  reviewed:    { label: 'Reviewed',       className: 'bg-teal-100 text-teal-700' },
  closed:      { label: 'Closed',         className: 'bg-gray-100 text-gray-500' },
}

const serviceLabel = {
  servicing:    'AC Servicing',
  installation: 'AC Installation',
  gas_refill:   'Gas Refill',
  repair:       'Repair',
  cleaning:     'Cleaning',
}

export default function ManagerJobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob]           = useState(null)
  const [fetching, setFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [approving, setApproving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [techName, setTechName] = useState('')

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setFetching(false); return }
        setJob(data)
        setFetching(false)
        // Fetch technician name separately
        if (data.assigned_technician_id) {
          supabase
            .from('profiles')
            .select('name')
            .eq('id', data.assigned_technician_id)
            .single()
            .then(({ data: p }) => { if (p?.name) setTechName(p.name) })
        }
      })
  }, [id])

  const handleApprove = async () => {
    setApproving(true)
    const { data, error } = await supabase
      .from('orders')
      .update({
        status:      'reviewed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq('id', id)
      .select()
    setApproving(false)
    setConfirmOpen(false)
    if (!error && data?.[0]) setJob(data[0])
  }

  // ── Loading ──
  if (fetching) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-xs text-gray-400">Loading job...</p>
    </div>
  )

  // ── Not found ──
  if (notFound) return (
    <div className="flex-1 p-6 text-center py-20">
      <p className="text-gray-400 text-sm mb-4">Job not found.</p>
      <button
        onClick={() => navigate('/manager/jobs')}
        className="text-xs px-4 py-2 bg-[#0e7fa8] text-white rounded-lg"
      >
        ← Back to Jobs
      </button>
    </div>
  )

  const isPhoto = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url)

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-6">

        {/* Back */}
        <button
          onClick={() => navigate('/manager/jobs')}
          className="flex items-center gap-1 text-xs text-gray-500 mb-4 hover:text-gray-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Job Review
        </button>

        {/* Reviewed banner */}
        {job.status === 'reviewed' && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <span className="text-teal-500 text-xl">✓</span>
            <div>
              <p className="text-sm font-medium text-teal-800">Job Approved</p>
              <p className="text-xs text-teal-600 mt-0.5">
                Reviewed on{' '}
                {job.reviewed_at
                  ? new Date(job.reviewed_at).toLocaleString('en-MY')
                  : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Closed banner */}
        {job.status === 'closed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <span className="text-gray-400 text-xl">🔒</span>
            <div>
              <p className="text-sm font-medium text-gray-700">Job Closed</p>
              <p className="text-xs text-gray-400 mt-0.5">This job has been closed.</p>
            </div>
          </div>
        )}

        {/* ── Job Info ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#0e7fa8]">{job.order_no}</span>
              {job.branch && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {job.branch}
                </span>
              )}
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                statusBadge[job.status]?.className || 'bg-gray-100 text-gray-500'
              }`}
            >
              {statusBadge[job.status]?.label || job.status}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {[
              ['Customer',   job.customer_name],
              ['Phone',      job.customer_phone],
              ['Address',    job.customer_address],
              ['Service',    serviceLabel[job.service_type] || job.service_type],
              ['Technician', techName || '—'],
              ['Scheduled',  job.scheduled_date || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <p className="text-xs text-gray-400 w-24 flex-shrink-0">{k}</p>
                <p className="text-xs text-gray-800 font-medium flex-1">{v}</p>
              </div>
            ))}

            {job.problem_description && (
              <div className="mt-1 bg-amber-50 border border-amber-100 rounded-lg p-2">
                <p className="text-xs text-amber-700">⚠️ {job.problem_description}</p>
              </div>
            )}
            {job.admin_notes && (
              <div className="mt-1 bg-blue-50 border border-blue-100 rounded-lg p-2">
                <p className="text-xs text-blue-700">📝 Admin: {job.admin_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Completion Details ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">Completion Details</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              ['Work Done',     job.work_done || '—'],
              ['Quoted Price',  `RM ${parseFloat(job.quoted_price ?? 0).toFixed(2)}`],
              ['Extra Charges', `RM ${parseFloat(job.extra_charges ?? 0).toFixed(2)}`],
              ['Final Amount',  `RM ${parseFloat(job.final_amount ?? 0).toFixed(2)}`],
              ['Remarks',       job.remarks || '—'],
              ['Payment',       job.payment_amount
                ? `RM ${parseFloat(job.payment_amount).toFixed(2)} via ${job.payment_method || '—'}`
                : '—'],
              ['Completed At',  job.completed_at
                ? new Date(job.completed_at).toLocaleString('en-MY')
                : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <p className="text-xs text-gray-400 w-28 flex-shrink-0">{k}</p>
                <p className={`text-xs font-medium flex-1 ${
                  k === 'Final Amount' ? 'text-[#0e7fa8] text-sm' : 'text-gray-800'
                }`}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Photos / Files ── */}
        {job.photo_urls && job.photo_urls.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-medium text-gray-700 mb-3">
              Photos / Files ({job.photo_urls.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photo_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity">
                    {isPhoto(url) ? (
                      <img
                        src={url}
                        alt={`Job photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                        <span className="text-2xl">📄</span>
                        <span className="text-xs text-gray-500 text-center truncate w-full text-center">
                          File {i + 1}
                        </span>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Approve Button (job_done only) ── */}
        {job.status === 'job_done' && (
          <div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full py-3.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 active:scale-[0.98] transition-all"
            >
              ✓ Approve Job
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Marks this job as Reviewed
            </p>
          </div>
        )}
      </div>

      {/* ── Confirm Dialog ── */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Approve this job?</h3>
              <p className="text-xs text-gray-500">
                {job.order_no} · {job.customer_name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Final Amount:{' '}
                <span className="font-medium text-gray-700">
                  RM {parseFloat(job.final_amount ?? 0).toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 py-2.5 bg-teal-600 text-white text-xs font-medium rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors"
              >
                {approving ? 'Approving...' : 'Yes, Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
