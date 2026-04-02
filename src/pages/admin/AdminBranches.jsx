import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminBranches() {
  const [branches, setBranches]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [branchName, setBranchName] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [deleteId, setDeleteId]     = useState(null)
  const [deleting, setDeleting]     = useState(false)

  const fetchBranches = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('branches')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
    setBranches(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchBranches() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    const trimmed = branchName.trim()
    if (!trimmed) { setError('Branch name is required.'); return }

    // Check duplicate
    const exists = branches.some(b => b.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) { setError('A branch with this name already exists.'); return }

    setSaving(true)
    const { error: err } = await supabase.from('branches').insert({ name: trimmed })
    if (err) {
      setError(err.message)
    } else {
      setBranchName('')
      setShowModal(false)
      fetchBranches()
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    await supabase.from('branches').delete().eq('id', id)
    setDeleteId(null)
    setDeleting(false)
    fetchBranches()
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Branches</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage service branches</p>
        </div>
        <button
          onClick={() => { setBranchName(''); setError(''); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-[#0e7fa8] text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#0c6d92] transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
          Add Branch
        </button>
      </div>

      {/* Branch grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-gray-200 mb-3">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <p className="text-sm">No branches yet.</p>
          <p className="text-xs mt-1">Click "Add Branch" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0e7fa8]/10 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0e7fa8]">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{branch.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Added {new Date(branch.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(branch.id)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                  title="Delete branch"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between border-b border-gray-100" style={{ padding: '20px 32px' }}>
              <h2 className="text-sm font-semibold text-gray-800">Add New Branch</h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3" style={{ padding: '20px 32px' }}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Branch Name</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  placeholder="e.g. Petaling Jaya"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#0e7fa8]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#0e7fa8] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#0c6d92] transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Delete Branch?</p>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                className="flex-1 bg-red-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}