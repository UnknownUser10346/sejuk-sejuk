import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const statusBadge = {
  new:         { label: 'Pending',     className: 'bg-amber-100 text-amber-700' },
  assigned:    { label: 'Assigned',    className: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  job_done:    { label: 'Completed',   className: 'bg-green-100 text-green-700' },
  reviewed:    { label: 'Reviewed',    className: 'bg-teal-100 text-teal-700' },
  closed:      { label: 'Closed',      className: 'bg-gray-100 text-gray-500' },
  postponed:   { label: 'Postponed',   className: 'bg-orange-100 text-orange-700' },
}

const serviceLabel = {
  servicing:    'AC Servicing',
  installation: 'AC Installation',
  gas_refill:   'Gas Refill',
  repair:       'Repair',
  cleaning:     'Cleaning',
}

const TABS = ['Today', 'All', 'Completed']

export default function TechnicianJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Today')

  useEffect(() => { fetchJobs() }, [])

  const fetchJobs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_technician_id', user?.id)
      .order('scheduled_date', { ascending: true })
    if (data) setJobs(data)
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = jobs.filter(j => {
    if (activeTab === 'Today') return j.scheduled_date === today
    if (activeTab === 'Completed') return j.status === 'job_done' || j.status === 'reviewed' || j.status === 'closed'
    return true
  })

  return (
    <div className="p-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Today', value: jobs.filter(j => j.scheduled_date === today).length, color: 'text-[#0e7fa8]' },
          { label: 'In Progress', value: jobs.filter(j => j.status === 'in_progress').length, color: 'text-blue-600' },
          { label: 'Completed', value: jobs.filter(j => j.status === 'job_done').length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className={`text-xl font-medium ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab filters */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium ${
              activeTab === tab
                ? 'bg-white text-[#0e7fa8] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Job cards */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-xs">Loading jobs...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-400 text-sm">No jobs for this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div
              key={job.id}
              onClick={() => navigate(`/technician/jobs/${job.id}`)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-[#0e7fa8]">{job.order_no}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[job.status]?.className}`}>
                  {statusBadge[job.status]?.label}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">{job.customer_name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-gray-400 flex-shrink-0">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="truncate">{job.customer_address}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {serviceLabel[job.service_type] || job.service_type}
                </span>
                <span className="text-xs text-gray-400">
                  {job.scheduled_date
                    ? new Date(job.scheduled_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
                    : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}