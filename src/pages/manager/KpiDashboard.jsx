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

  const maxJobs = data.length > 0 ? Math.max(...data.map(d => d.jobs)) : 1
  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.revenue)) : 1
  const maxRescheduled = data.length > 0 ? Math.max(...data.map(d => d.rescheduled), 1) : 1
  const maxPostponed = data.length > 0 ? Math.max(...data.map(d => d.postponed), 1) : 1

  const rankStyle = (i) => {
    if (i === 0) return 'bg-yellow-100 text-yellow-600'
    if (i === 1) return 'bg-gray-200 text-gray-500'
    if (i === 2) return 'bg-orange-100 text-orange-500'
    return 'bg-gray-50 text-gray-400'
  }

  const rankEmoji = (i) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return null
  }

  const summaryCards = [
    {
      label: 'Jobs Completed', value: summary.totalJobs,
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-500"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>,
      valueClass: 'text-green-600', bg: 'bg-green-50 border-green-100',
    },
    {
      label: 'Total Revenue', value: `RM ${summary.totalRevenue.toFixed(2)}`,
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0e7fa8]"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
      valueClass: 'text-[#0e7fa8]', bg: 'bg-blue-50 border-blue-100',
    },
    {
      label: 'Active Technicians', value: summary.techCount,
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-purple-500"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
      valueClass: 'text-purple-600', bg: 'bg-purple-50 border-purple-100',
    },
    {
      label: 'Rescheduled', value: summary.totalRescheduled,
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-amber-500"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>,
      valueClass: 'text-amber-600', bg: 'bg-amber-50 border-amber-100',
    },
    {
      label: 'Postponed', value: summary.totalPostponed,
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-400"><path d="M6 2v6l2 2-2 2v6h12v-6l-2-2 2-2V2H6zm10 9.5l2 2V18H6v-4.5l2-2-2-2V4h12v4.5l-2 2z"/></svg>,
      valueClass: 'text-red-500', bg: 'bg-red-50 border-red-100',
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">KPI Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Technician performance overview</p>
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5">
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                  view === v ? 'bg-[#0e7fa8] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
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
            {/* Summary Cards — row 1: 3 cols */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              {summaryCards.slice(0, 3).map(c => (
                <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">{c.label}</p>
                    {c.icon}
                  </div>
                  <p className={`text-2xl font-bold ${c.valueClass}`}>{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{view}</p>
                </div>
              ))}
            </div>

            {/* Summary Cards — row 2: 2 cols */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {summaryCards.slice(3).map(c => (
                <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">{c.label}</p>
                    {c.icon}
                  </div>
                  <p className={`text-2xl font-bold ${c.valueClass}`}>{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{view}</p>
                </div>
              ))}
            </div>

            {data.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl text-center py-16">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm font-medium text-gray-500">No completed jobs for this period</p>
                <p className="text-xs text-gray-400 mt-1">Try switching to Monthly or All Time</p>
              </div>
            ) : (
              <>
                {/* Bar Chart — Jobs Completed */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Jobs Completed</h3>
                  <div className="space-y-3">
                    {data.map((tech) => (
                      <div key={tech.id} className="flex items-center gap-3">
                        <p className="text-xs text-gray-600 w-32 truncate flex-shrink-0">{tech.name}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="bg-[#0e7fa8] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${(tech.jobs / maxJobs) * 100}%` }} />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 w-8 text-right flex-shrink-0">{tech.jobs}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart — Revenue */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Generated (RM)</h3>
                  <div className="space-y-3">
                    {data.map((tech) => (
                      <div key={tech.id} className="flex items-center gap-3">
                        <p className="text-xs text-gray-600 w-32 truncate flex-shrink-0">{tech.name}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${(tech.revenue / maxRevenue) * 100}%` }} />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 w-20 text-right flex-shrink-0">
                          RM {tech.revenue.toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart — Rescheduled */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Rescheduled Jobs</h3>
                  <div className="space-y-3">
                    {data.map((tech) => (
                      <div key={tech.id} className="flex items-center gap-3">
                        <p className="text-xs text-gray-600 w-32 truncate flex-shrink-0">{tech.name}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: tech.rescheduled > 0 ? `${(tech.rescheduled / maxRescheduled) * 100}%` : '0%' }} />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 w-8 text-right flex-shrink-0">{tech.rescheduled}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart — Postponed */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Postponed Jobs</h3>
                  <div className="space-y-3">
                    {data.map((tech) => (
                      <div key={tech.id} className="flex items-center gap-3">
                        <p className="text-xs text-gray-600 w-32 truncate flex-shrink-0">{tech.name}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="bg-red-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: tech.postponed > 0 ? `${(tech.postponed / maxPostponed) * 100}%` : '0%' }} />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 w-8 text-right flex-shrink-0">{tech.postponed}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">🏆 Leaderboard</h3>
                    <p className="text-xs text-gray-400">Ranked by jobs completed</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.map((tech, i) => (
                      <div key={tech.id} className={`px-5 py-3.5 flex items-center gap-4 ${i === 0 ? 'bg-yellow-50/50' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankStyle(i)}`}>
                          {rankEmoji(i) || i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${i === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {tech.name}
                          </p>
                          <div className="flex gap-3 mt-0.5">
                            {tech.rescheduled > 0 && (
                              <p className="text-xs text-amber-500">🔁 {tech.rescheduled} rescheduled</p>
                            )}
                            {tech.postponed > 0 && (
                              <p className="text-xs text-red-400">⏸ {tech.postponed} postponed</p>
                            )}
                            {tech.rescheduled === 0 && tech.postponed === 0 && (
                              <p className="text-xs text-gray-300">No delays</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800">
                            {tech.jobs}<span className="text-xs font-normal text-gray-400 ml-1">jobs</span>
                          </p>
                          <p className="text-xs text-emerald-600 font-medium">RM {tech.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
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