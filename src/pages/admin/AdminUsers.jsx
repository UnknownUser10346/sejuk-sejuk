import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const ROLES = ['technician', 'manager']

const roleColor = {
  admin:      'bg-purple-100 text-purple-700',
  manager:    'bg-blue-100 text-blue-700',
  technician: 'bg-green-100 text-green-700',
}

export default function AdminUsers() {
  const [users, setUsers]         = useState([])
  const [branches, setBranches]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  const [form, setForm] = useState({
    name: '', phone: '', role: 'technician', branch: '',
  })

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, name, role, branch, phone, created_at')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
    if (fetchErr) console.error('fetchUsers error:', fetchErr)
    setUsers(data || [])
    setLoading(false)
  }

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('name').order('name')
    setBranches(data || [])
  }

  useEffect(() => { fetchUsers(); fetchBranches() }, [])

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter)

  const resetForm = () => {
    setForm({ name: '', phone: '', role: 'technician', branch: '' })
    setError('')
    setSuccess('')
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.name || !form.role || !form.branch) {
      setError('Name, role, and branch are required.')
      return
    }
    setSaving(true)

    const { error: insertErr } = await supabase.from('profiles').insert({
      name:   form.name,
      phone:  form.phone || null,
      role:   form.role,
      branch: form.branch,
    })

    if (insertErr) {
      setError(insertErr.message)
      setSaving(false)
      return
    }

    setSuccess(`User "${form.name}" added successfully!`)
    setSaving(false)
    fetchUsers()
    resetForm()
    setTimeout(() => { setShowModal(false); setSuccess('') }, 1500)
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Users</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage technicians and managers</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-[#0e7fa8] text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#0c6d92] transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
          Add User
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {['all', 'technician', 'manager'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium capitalize transition-all ${
              filter === tab ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Name</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Phone</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Role</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Branch</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0e7fa8]/10 flex items-center justify-center text-[#0e7fa8] text-xs font-semibold flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-gray-800 font-medium text-xs">{u.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.branch || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100" style={{ padding: '20px 32px' }}>
              <h2 className="text-base font-semibold text-gray-800">Add New User</h2>
              <button onClick={() => { setShowModal(false); resetForm() }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdd} className="space-y-4" style={{ padding: '24px 32px' }}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-100 text-green-600 text-sm px-4 py-2.5 rounded-lg">{success}</div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ali Hassan"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0e7fa8]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 0123456789"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0e7fa8]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Role <span className="text-red-400">*</span></label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0e7fa8] bg-white"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Branch <span className="text-red-400">*</span></label>
                <select
                  value={form.branch}
                  onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0e7fa8] bg-white"
                >
                  <option value="">Select branch</option>
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#0e7fa8] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#0c6d92] transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}