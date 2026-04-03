import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const VIEWS = ['Weekly', 'Monthly', 'All Time']

export default function KpiDashboard() {
  const [view, setView] = useState('Weekly')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalJobs: 0,
    totalRevenue: 0,
    techCount: 0,
    totalRescheduled: 0,
    totalPostponed: 0,
  })

  useEffect(() => { fetchKpi() }, [view])

  const fetchKpi = async () => {
    setLoading(true)

    const now = new Date()
    let fromDate = null
    if (view === 'Weekly') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      fromDate = d.toISOString()
    } else if (view === 'Monthly') {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      fromDate = d.toISOString()
    }

    let query = supabase
      .from('orders')
      .select(`
        assigned_technician_id,
        final_amount,
        completed_at,
        rescheduled_count,
        postponed_count,
        technician:profiles!assigned_technician_id(name)
      `)
      .in('status', ['job_done', 'reviewed', 'closed'])

    if (fromDate) query = query.gte('completed_at', fromDate)

    const { data: orders, error } = await query

    if (error || !orders) { setLoading(false); return }

    // Group by technician
    const techMap = {}
    orders.forEach(o => {
      const tid = o.assigned_technician_id
      if (!tid) return
      const tname = o.technician?.name || 'Unknown'
      if (!techMap[tid]) {
        techMap[tid] = { id: tid, name: tname, jobs: 0, revenue: 0, rescheduled: 0, postponed: 0 }
      }
      techMap[tid].jobs += 1
      techMap[tid].revenue += parseFloat(o.final_amount || 0)
      techMap[tid].rescheduled += parseInt(o.rescheduled_count || 0)
      techMap[tid].postponed += parseInt(o.postponed_count || 0)
    })

    const sorted = Object.values(techMap).sort((a, b) => b.jobs - a.jobs || b.revenue - a.revenue)
    setData(sorted)
    setSummary({
      totalJobs: orders.length,
      totalRevenue: orders.reduce((s, o) => s + parseFloat(o.final_amount || 0), 0),
      techCount: sorted.length,
      totalRescheduled: sorted.reduce((s, t) => s + t.rescheduled, 0),
      totalPostponed: sorted.reduce((s, t) => s + t.postponed, 0),
    })
    setLoading(false)
  }

  const maxJobs = data.length > 0 ? Math.max(...data.map(d => d.jobs), 1) : 1
  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.revenue), 1) : 1
  const maxRescheduled = data.length > 0 ? Math.max(...data.map(d => d.rescheduled), 1) : 1
  const maxPostponed = data.length > 0 ? Math.max(...data.map(d => d.postponed), 1) : 1

  const rankBadge = (i) => {
    if (i === 0) return { emoji: '🥇', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' }
    if (i === 1) return { emoji: '🥈', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500' }
    if (i === 2) return { emoji: '🥉', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-500' }
    return { emoji: null, bg: 'bg-white', border: 'border-gray-100', text: 'text-gray-400' }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white" style={{ padding: '24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">KPI Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Technician performance overview</p>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                  view === v
                    ? 'bg-white text-[#0e7fa8] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400 text-xs">Loading KPI data...</div>
        ) : (
          <>
            {/* Summary Cards — 5 columns */}
            <div className="grid grid-cols-5 gap-3 mb-6">

              {/* Jobs Completed */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-500">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-800">{summary.totalJobs}</p>
                <p className="text-xs text-gray-400 mt-1">Jobs Completed</p>
              </div>

              {/* Total Revenue */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0e7fa8]">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-800">RM {summary.totalRevenue.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400 mt-1">Total Revenue</p>
              </div>

              {/* Active Technicians */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-purple-500">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-800">{summary.techCount}</p>
                <p className="text-xs text-gray-400 mt-1">Active Technicians</p>
              </div>

              {/* Rescheduled */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-orange-400">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-800">{summary.totalRescheduled}</p>
                <p className="text-xs text-gray-400 mt-1">Rescheduled</p>
              </div>

              {/* Postponed */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-800">{summary.totalPostponed}</p>
                <p className="text-xs text-gray-400 mt-1">Postponed</p>
              </div>
            </div>

            {data.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 shadow-sm">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm font-medium text-gray-500">No completed jobs for this period</p>
                <p className="text-xs text-gray-400 mt-1">Try switching to Monthly or All Time</p>
              </div>
            ) : (
              <>
                {/* Charts row — Jobs & Revenue */}
                <div className="grid grid-cols-2 gap-4 mb-4">

                  {/* Bar Chart — Jobs Completed */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-[#0e7fa8]"></div>
                      <h3 className="text-sm font-semibold text-gray-700">Jobs Completed</h3>
                    </div>
                    <div className="space-y-3">
                      {data.map((tech) => (
                        <div key={tech.id} className="flex items-center gap-3">
                          <p className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{tech.name}</p>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#0e7fa8] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(tech.jobs / maxJobs) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-5 text-right flex-shrink-0">{tech.jobs}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bar Chart — Revenue */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <h3 className="text-sm font-semibold text-gray-700">Revenue (RM)</h3>
                    </div>
                    <div className="space-y-3">
                      {data.map((tech) => (
                        <div key={tech.id} className="flex items-center gap-3">
                          <p className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{tech.name}</p>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(tech.revenue / maxRevenue) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-14 text-right flex-shrink-0">
                            {tech.revenue.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Charts row — Rescheduled & Postponed (always shown) */}
                <div className="grid grid-cols-2 gap-4 mb-4">

                  {/* Bar Chart — Rescheduled */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                      <h3 className="text-sm font-semibold text-gray-700">Rescheduled</h3>
                    </div>
                    <div className="space-y-3">
                      {data.map((tech) => (
                        <div key={tech.id} className="flex items-center gap-3">
                          <p className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{tech.name}</p>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: tech.rescheduled > 0 ? `${(tech.rescheduled / maxRescheduled) * 100}%` : '0%' }}
                            />
                          </div>
                          <p className="text-xs font-bold text-orange-500 w-5 text-right flex-shrink-0">{tech.rescheduled}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bar Chart — Postponed */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <h3 className="text-sm font-semibold text-gray-700">Postponed</h3>
                    </div>
                    <div className="space-y-3">
                      {data.map((tech) => (
                        <div key={tech.id} className="flex items-center gap-3">
                          <p className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{tech.name}</p>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-red-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: tech.postponed > 0 ? `${(tech.postponed / maxPostponed) * 100}%` : '0%' }}
                            />
                          </div>
                          <p className="text-xs font-bold text-red-500 w-5 text-right flex-shrink-0">{tech.postponed}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-50" style={{ padding: '16px 20px' }}>
                    <h3 className="text-sm font-semibold text-gray-700">🏆 Leaderboard</h3>
                    <p className="text-xs text-gray-400">Ranked by jobs completed</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.map((tech, i) => {
                      const badge = rankBadge(i)
                      const hasDelays = tech.rescheduled > 0 || tech.postponed > 0
                      return (
                        <div key={tech.id} className={`flex items-center gap-4 ${i === 0 ? 'bg-yellow-50/40' : 'bg-white'}`} style={{ padding: '14px 20px' }}>
                          {/* Rank */}
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold ${badge.bg} ${badge.border} ${badge.text}`}>
                            {badge.emoji || i + 1}
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${i === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                              {tech.name}
                            </p>
                            <p className="text-xs text-gray-300 mt-0.5">{hasDelays ? 'Has delays' : 'No delays'}</p>
                          </div>

                          {/* Jobs */}
                          <div className="text-center flex-shrink-0">
                            <p className="text-lg font-bold text-gray-800">{tech.jobs}</p>
                            <p className="text-xs text-gray-400">jobs</p>
                          </div>

                          {/* Rescheduled */}
                          <div className="text-center flex-shrink-0" style={{ minWidth: '60px' }}>
                            <p className="text-sm font-bold text-orange-400">{tech.rescheduled}</p>
                            <p className="text-xs text-gray-400">reschedule</p>
                          </div>

                          {/* Postponed */}
                          <div className="text-center flex-shrink-0" style={{ minWidth: '60px' }}>
                            <p className="text-sm font-bold text-red-400">{tech.postponed}</p>
                            <p className="text-xs text-gray-400">postponed</p>
                          </div>

                          {/* Revenue */}
                          <div className="text-right flex-shrink-0" style={{ minWidth: '80px' }}>
                            <p className="text-sm font-bold text-emerald-600">RM {tech.revenue.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-gray-400">revenue</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}