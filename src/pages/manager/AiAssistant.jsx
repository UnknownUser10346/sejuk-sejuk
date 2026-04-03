import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SUGGESTED = [
  'How many jobs were completed this week?',
  'Which technician completed the most jobs?',
  'What is the total revenue this month?',
  'How many jobs are pending review?',
  'Which technician has the most rescheduled jobs?',
  'What are the most common service types?',
]

function BotIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#0e7fa8] flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
        <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
      </svg>
    </div>
  )
}

function UserIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 bg-[#0e7fa8] rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

// Simple inline markdown renderer — no extra packages needed
function MarkdownText({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <p key={i} className="font-semibold text-gray-900 mt-2">{line.slice(4)}</p>
        if (line.startsWith('## '))  return <p key={i} className="font-bold text-gray-900 mt-2">{line.slice(3)}</p>
        if (line.startsWith('# '))   return <p key={i} className="font-bold text-gray-900 text-base mt-2">{line.slice(2)}</p>

        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="mt-0.5 text-[#0e7fa8]">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          )
        }

        const numMatch = line.match(/^(\d+)\.\s(.+)/)
        if (numMatch) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-[#0e7fa8] font-medium">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          )
        }

        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text) {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0, match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function AIAssistant() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI Assistant. Ask me anything about your branch's jobs, technicians, or revenue — in plain language.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [noKey] = useState(!GROQ_API_KEY)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ─── Fetch branch data from Supabase ─────────────────────────────────────────
  const fetchBranchData = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch')
      .eq('id', user.id)
      .single()

    const branch = profile?.branch
    if (!branch) return { error: 'Branch not found for your profile.' }

    const since = new Date()
    since.setDate(since.getDate() - 90)

    const { data: orders } = await supabase
      .from('orders')
      .select(`
        order_no, customer_name, status, service_type, final_amount, payment_method,
        scheduled_date, completed_at, rescheduled_count, postponed_count, branch,
        technician:profiles!assigned_technician_id(name)
      `)
      .eq('branch', branch)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    const { data: techs } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('branch', branch)
      .eq('role', 'technician')

    const statusCounts = {}
    const techStats = {}
    let totalRevenue = 0
    const serviceTypes = {}

    ;(orders || []).forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
      const tname = o.technician?.name || 'Unassigned'
      if (!techStats[tname]) techStats[tname] = { jobs: 0, revenue: 0, rescheduled: 0, postponed: 0 }
      techStats[tname].jobs += 1
      techStats[tname].revenue += parseFloat(o.final_amount || 0)
      techStats[tname].rescheduled += parseInt(o.rescheduled_count || 0)
      techStats[tname].postponed += parseInt(o.postponed_count || 0)
      totalRevenue += parseFloat(o.final_amount || 0)
      if (o.service_type) serviceTypes[o.service_type] = (serviceTypes[o.service_type] || 0) + 1
    })

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyOrders = (orders || []).filter(o => o.completed_at && new Date(o.completed_at) >= weekAgo)
    const weeklyRevenue = weeklyOrders.reduce((s, o) => s + parseFloat(o.final_amount || 0), 0)

    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    const monthlyOrders = (orders || []).filter(o => o.completed_at && new Date(o.completed_at) >= monthAgo)
    const monthlyRevenue = monthlyOrders.reduce((s, o) => s + parseFloat(o.final_amount || 0), 0)

    return {
      branch,
      summary: {
        totalOrders: orders?.length || 0,
        totalRevenue: totalRevenue.toFixed(2),
        statusBreakdown: statusCounts,
        weeklyCompleted: weeklyOrders.length,
        weeklyRevenue: weeklyRevenue.toFixed(2),
        monthlyCompleted: monthlyOrders.length,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        serviceTypeBreakdown: serviceTypes,
        technicianStats: techStats,
        technicianCount: techs?.length || 0,
      },
      orders: (orders || []).map(o => ({
        order_no: o.order_no,
        status: o.status,
        service_type: o.service_type,
        technician: o.technician?.name || 'Unassigned',
        amount: parseFloat(o.final_amount || 0).toFixed(2),
        scheduled_date: o.scheduled_date,
        completed_at: o.completed_at,
        payment_method: o.payment_method,
        rescheduled_count: o.rescheduled_count || 0,
        postponed_count: o.postponed_count || 0,
      })),
    }
  }

  // ─── Send message to Groq ────────────────────────────────────────────────────
  const sendMessage = async (question) => {
    if (!question.trim()) return

    const updatedMessages = [...messages, { role: 'user', text: question }]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const branchData = await fetchBranchData()

      const systemPrompt = `You are an AI assistant for a field service management system.
You have access to real-time branch data for branch: ${branchData.branch}.

STATUS DEFINITIONS (very important — use these when answering):
- "pending" = job has been assigned but not yet started
- "in_progress" = technician is currently working on the job
- "job_done" = technician has marked the job as done, and it is PENDING REVIEW by the manager
- "reviewed" = manager has reviewed and approved the completed job
- "cancelled" = job was cancelled

So when the user asks about "pending review" jobs, they mean orders with status "job_done".

SUMMARY:
${JSON.stringify(branchData.summary, null, 2)}

ORDERS (last 90 days):
${JSON.stringify(branchData.orders, null, 2)}

Answer questions based strictly on the data above. Be concise and helpful.
If asked about specific orders, list their order_no and customer_name. Format numbers and currency clearly.

If the user asks something that is NOT related to the branch data, orders, technicians, or field service management, simply reply: "That question is not related to this system. I can only assist with branch orders, technicians, and job data."`

      const history = updatedMessages
        .filter(m => !m.isError)
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text,
        }))

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
          ],
          temperature: 0.4,
          max_tokens: 1024,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'Groq API error')
      }

      const result = await response.json()
      const answer = result.choices?.[0]?.message?.content || 'No response received.'
      setMessages(prev => [...prev, { role: 'assistant', text: answer }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `⚠️ Error: ${err.message}. Please try again.`,
        isError: true,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* Header */}
      <div className="border-b border-gray-100 flex-shrink-0" style={{ padding: '16px 24px' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0e7fa8] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-800">AI Assistant</h1>
            <p className="text-xs text-gray-400">Ask anything about your branch in plain language</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span className="text-xs text-gray-400">Llama 3.3 · Groq</span>
          </div>
        </div>
      </div>

      {/* No API key banner */}
      {noKey && (
        <div className="bg-amber-50 border-b border-amber-100 flex-shrink-0" style={{ padding: '10px 24px' }}>
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ Groq API key not set. Add <code className="bg-amber-100 px-1 rounded">VITE_GROQ_API_KEY=gsk_...</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file and restart the dev server.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading || noKey}
                    className="text-xs bg-white border border-gray-200 text-gray-600 rounded-xl hover:border-[#0e7fa8] hover:text-[#0e7fa8] transition-colors disabled:opacity-40"
                    style={{ padding: '6px 12px' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' ? <BotIcon /> : <UserIcon />}
                <div
                  className={`rounded-2xl text-sm leading-relaxed max-w-lg ${
                    msg.role === 'user'
                      ? 'bg-[#0e7fa8] text-white whitespace-pre-wrap'
                      : msg.isError
                        ? 'bg-red-50 text-red-700 border border-red-100 whitespace-pre-wrap'
                        : 'bg-gray-50 text-gray-800 border border-gray-100'
                  }`}
                  style={{ padding: '10px 14px' }}
                >
                  {msg.role === 'assistant' && !msg.isError
                    ? <MarkdownText text={msg.text} />
                    : msg.text
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <BotIcon />
                <div className="bg-gray-50 border border-gray-100 rounded-2xl" style={{ padding: '10px 14px' }}>
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 flex-shrink-0 bg-white" style={{ padding: '12px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={noKey ? 'Set your Groq API key in .env to start…' : 'Ask about jobs, revenue, technicians…'}
              disabled={loading || noKey}
              className="flex-1 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-[#0e7fa8] focus:ring-2 focus:ring-[#0e7fa8]/10 disabled:opacity-50 disabled:bg-gray-50"
              style={{ padding: '10px 14px' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || noKey}
              className="w-10 h-10 rounded-xl bg-[#0e7fa8] flex items-center justify-center hover:bg-[#0c6d92] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin fill-white" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" opacity=".3"/>
                  <path d="M20 12h2A10 10 0 0 0 12 2v2a8 8 0 0 1 8 8z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-300 mt-2 text-center">
            AI responses are based on your branch data — always verify critical decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
