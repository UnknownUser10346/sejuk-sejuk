import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const roles = [
  { key: 'admin', label: 'Admin', icon: '👤', desc: 'Manage orders & assign technicians' },
  { key: 'technician', label: 'Technician', icon: '🔧', desc: 'View & complete your jobs' },
  { key: 'manager', label: 'Manager', icon: '📊', desc: 'Review jobs & view performance' },
]

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedRole) {
      setSelectedProfile(null)
      supabase
        .from('profiles')
        .select('*')
        .eq('role', selectedRole)
        .then(({ data }) => setProfiles(data || []))
    }
  }, [selectedRole])

  const handleEnter = () => {
    if (!selectedProfile) return
    login(selectedProfile)
    if (selectedProfile.role === 'admin') navigate('/admin')
    else if (selectedProfile.role === 'technician') navigate('/technician')
    else navigate('/manager')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">❄️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Sejuk Sejuk Ops</h1>
        <p className="text-gray-500 mt-1">Internal Operations System</p>
      </div>

      {/* Role Cards */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-8">
        <p className="font-semibold text-gray-700 mb-1">Select your role</p>
        <p className="text-gray-400 text-sm mb-4">Choose how you want to access the system</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`p-5 rounded-xl border-2 text-center transition-all ${
                selectedRole === role.key
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <div className="text-3xl mb-2">{role.icon}</div>
              <div className="font-semibold text-gray-800">{role.label}</div>
              <div className="text-xs text-gray-500 mt-1">{role.desc}</div>
            </button>
          ))}
        </div>

        {/* Name Dropdown */}
        {selectedRole && (
          <div className="mb-6">
            <label className="block font-semibold text-gray-700 mb-2">
              Select your name
            </label>
            <select
              value={selectedProfile?.id || ''}
              onChange={(e) => {
                const profile = profiles.find(p => p.id === e.target.value)
                setSelectedProfile(profile || null)
              }}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-teal-500 bg-white"
            >
              <option value="">-- Select name --</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.branch}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Enter Button */}
        <button
          onClick={handleEnter}
          disabled={!selectedProfile}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
            selectedProfile
              ? 'bg-teal-600 hover:bg-teal-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {selectedProfile
            ? `Enter as ${selectedProfile.name}`
            : 'Select a role and name'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Sejuk Sejuk AC Services. All rights reserved.
        </p>
      </div>
    </div>
  )
}