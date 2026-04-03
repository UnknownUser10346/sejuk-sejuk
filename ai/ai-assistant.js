// api/ai-assistant.js
// Vercel Serverless Function — AI Assistant backend
// Handles controlled Supabase queries + Groq AI call (server-side only)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL        = process.env.SUPABASE_URL        || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GROQ_API_KEY        = process.env.GROQ_API_KEY
const GROQ_API_URL        = 'https://api.groq.com/openai/v1/chat/completions'

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, userId, history = [] } = req.body

  if (!question || !userId) {
    return res.status(400).json({ error: 'Missing question or userId' })
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured. Please set GROQ_API_KEY.' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' })
  }

  // ── Supabase client (server-side only, service role) ─────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // ── Controlled Query 1: Get the user's branch ─────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, branch, role')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.branch) {
      return res.status(400).json({ error: 'Could not determine your branch. Please contact your administrator.' })
    }

    const branch = profile.branch

    // ── Controlled Query 2: Orders summary (last 90 days, branch-scoped) ──
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        order_no, customer_name, status, service_type,
        final_amount, scheduled_date, completed_at,
        rescheduled_count, postponed_count, branch,
        technician:profiles!assigned_technician_id(name)
      `)
      .eq('branch', branch)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (ordersError) throw new Error('Failed to retrieve orders data.')

    // ── Controlled Query 3: Technicians in branch ─────────────────────────
    const { data: techs, error: techsError } = await supabase
      .from('profiles')
      .select('name')
      .eq('branch', branch)
      .eq('role', 'technician')

    if (techsError) throw new Error('Failed to retrieve technicians data.')

    // ── Build structured summary (controlled, no raw PII) ─────────────────
    const statusCounts = {}
    const techStats = {}
    let totalRevenue = 0
    const serviceTypes = {}

    ;(orders || []).forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
      const tname = o.technician?.name || 'Unassigned'
      if (!techStats[tname]) techStats[tname] = { jobs: 0, revenue: 0, rescheduled: 0, postponed: 0 }
      techStats[tname].jobs       += 1
      techStats[tname].revenue    += parseFloat(o.final_amount  || 0)
      techStats[tname].rescheduled += parseInt(o.rescheduled_count || 0)
      techStats[tname].postponed   += parseInt(o.postponed_count   || 0)
      totalRevenue += parseFloat(o.final_amount || 0)
      if (o.service_type) serviceTypes[o.service_type] = (serviceTypes[o.service_type] || 0) + 1
    })

    const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)

    const weeklyOrders  = (orders || []).filter(o => o.completed_at && new Date(o.completed_at) >= weekAgo)
    const monthlyOrders = (orders || []).filter(o => o.completed_at && new Date(o.completed_at) >= monthAgo)
    const weeklyRevenue  = weeklyOrders.reduce((s, o)  => s + parseFloat(o.final_amount || 0), 0)
    const monthlyRevenue = monthlyOrders.reduce((s, o) => s + parseFloat(o.final_amount || 0), 0)

    const summary = {
      totalOrders:         orders?.length || 0,
      totalRevenue:        `RM ${totalRevenue.toFixed(2)}`,
      statusBreakdown:     statusCounts,
      weeklyCompleted:     weeklyOrders.length,
      weeklyRevenue:       `RM ${weeklyRevenue.toFixed(2)}`,
      monthlyCompleted:    monthlyOrders.length,
      monthlyRevenue:      `RM ${monthlyRevenue.toFixed(2)}`,
      serviceTypeBreakdown: serviceTypes,
      technicianCount:     techs?.length || 0,
      technicianStats:     Object.fromEntries(
        Object.entries(techStats).map(([k, v]) => [k, { ...v, revenue: `RM ${v.revenue.toFixed(2)}` }])
      ),
    }

    // Structured orders list (no sensitive PII — phone numbers excluded)
    const structuredOrders = (orders || []).map(o => ({
      order_no:          o.order_no,
      customer_name:     o.customer_name,
      status:            o.status,
      service_type:      o.service_type,
      technician:        o.technician?.name || 'Unassigned',
      amount:            `RM ${parseFloat(o.final_amount || 0).toFixed(2)}`,
      scheduled_date:    o.scheduled_date,
      completed_at:      o.completed_at,
      rescheduled_count: o.rescheduled_count || 0,
      postponed_count:   o.postponed_count   || 0,
    }))

    // ── Build AI prompt ───────────────────────────────────────────────────
    const systemPrompt = `You are an AI assistant for a field service management system called Sejuk Sejuk Service.
You answer questions based ONLY on the structured branch data provided below.
You do NOT have access to the full database — only pre-processed summaries and recent orders for branch: ${branch}.

STATUS DEFINITIONS:
- "new"         = job created, not yet assigned
- "assigned"    = assigned to a technician, not started
- "in_progress" = technician is currently working on the job
- "postponed"   = job was postponed by the technician
- "job_done"    = technician marked job done — PENDING REVIEW by manager
- "reviewed"    = manager approved the completed job
- "closed"      = job fully closed

When the user asks about "pending review" jobs, they mean status "job_done".

BRANCH SUMMARY (last 90 days):
${JSON.stringify(summary, null, 2)}

RECENT ORDERS:
${JSON.stringify(structuredOrders, null, 2)}

Rules:
- Answer based strictly on the data above only.
- All currency must use "RM X,XXX.XX" format — never use "$".
- If asked something unrelated to branch data, orders, technicians, or service management, reply: "That question is not related to this system. I can only assist with branch orders, technicians, and job data."
- Be concise and professional.`

    // ── Call Groq API ─────────────────────────────────────────────────────
    const conversationHistory = (history || [])
      .filter(m => !m.isError)
      .map(m => ({
        role:    m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }))

    // Add current question
    conversationHistory.push({ role: 'user', content: question })

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages:    [{ role: 'system', content: systemPrompt }, ...conversationHistory],
        temperature: 0.4,
        max_tokens:  1024,
      }),
    })

    if (!groqResponse.ok) {
      const err = await groqResponse.json()
      throw new Error(err.error?.message || 'AI service error')
    }

    const result = await groqResponse.json()
    const answer = result.choices?.[0]?.message?.content || 'No response received.'

    return res.status(200).json({ answer })

  } catch (err) {
    console.error('[ai-assistant]', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
