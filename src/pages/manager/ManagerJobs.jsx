import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const statusBadge = {
  job_done: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
  reviewed: { label: 'Reviewed',       className: 'bg-teal-100 text-teal-700' },
  closed:   { label: 'Closed',         className: 'bg-gray-100 text-gray-500' },
}

const serviceLabel = {
  servicing:    'AC Servicing',
  installation: 'AC Installation',
  gas_refill:   'Gas Refill',
  repair:       'Repair',
  cleaning:     'Cleaning',
}

const TABS = ['Pending Review', 'Reviewed', 'All']

export default function ManagerJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Pending Review')
  const [managerBranch, setManagerBranch] = useState(null)

  useEffect(() => {
    fetchManagerProfile()
  }, [])

  const fetchManagerProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('branch')
      .eq('id', user?.id)
      .single()
    if (data?.branch) {
      setManagerBranch(data.branch)
      fetchJobs(data.branch)
    } else {
      fetchJobs(null)
    }
  }

  const fetchJobs = async (branch) => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('*')
      .in('status', ['job_done', 'reviewed', 'closed'])
      .order('completed_at', { ascending: false })

    if (branch) query = query.eq('branch', branch)

    const { data } = await query
    if (data) setJobs(data)
    setLoading(false)
  }

  const filtered = jobs.filter(j => {
    return activeTab === 'Pending Review' ? j.status === 'job_done'
         : activeTab === 'Reviewed'       ? j.status === 'reviewed'
         : true
  })

  const pendingCount  = jobs.filter(j => j.status === 'job_done').length
  const reviewedCount = jobs.filter(j => j.status === 'reviewed').length
  const closedCount   = jobs.filter(j => j.status === 'closed').length

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-800">Job Review</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Review and approve completed service jobs
            {managerBranch && <span className="ml-1 text-[#0e7fa8] font-medium">· {managerBranch}</span>}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Review', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: pendingCount > 0 },
            { label: 'Reviewed',       value: reviewedCount, color: 'text-teal-600',  bg: 'bg-teal-50 border-teal-200',   dot: false },
            { label: 'Closed',         value: closedCount,   color: 'text-gray-500',  bg: 'bg-white border-gray-200',     dot: false },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 text-center relative ${s.bg}`}>
              {s.dot && <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5 ${
                activeTab === tab ? 'bg-white text-[#0e7fa8] shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab}
              {tab === 'Pending Review' && pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-medium">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-xs">Loading jobs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">No jobs here yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(job => (
              <div key={job.id} onClick={() => navigate(`/manager/jobs/${job.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#0e7fa8] hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-[#0e7fa8]">{job.order_no}</span>
                    {job.branch && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{job.branch}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadge[job.status]?.className || 'bg-gray-100 text-gray-500'}`}>
                    {statusBadge[job.status]?.label || job.status}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-800 mb-0.5">{job.customer_name}</p>
                <p className="text-xs text-gray-400 mb-3">{serviceLabel[job.service_type] || job.service_type}</p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Final: <span className="font-medium text-gray-800">RM {parseFloat(job.final_amount ?? job.quoted_price ?? 0).toFixed(2)}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {job.completed_at
                      ? new Date(job.completed_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}