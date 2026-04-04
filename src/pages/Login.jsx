import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const roles = [
  {
    key: 'admin',
    label: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-teal-600">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    ),
    desc: 'Manage orders & assign technicians'
  },
  {
    key: 'technician',
    label: 'Technician',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-teal-600">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.2L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
    ),
    desc: 'View & complete your jobs'
  },
  {
    key: 'manager',
    label: 'Manager',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-teal-600">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
      </svg>
    ),
    desc: 'Review jobs & view performance'
  },
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-2xl">❄️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Sejuk Sejuk Ops</h1>
        <p className="text-gray-500 text-sm mt-1">Internal Operations System</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-5">
        <p className="font-semibold text-gray-700 mb-0.5">Select your role</p>
        <p className="text-gray-400 text-xs mb-4">Choose how you want to access the system</p>

        {/* Role Cards — stacked on mobile, row on sm+ */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 w-full sm:flex-1 px-4 py-3 sm:py-4 rounded-xl border-2 text-left sm:text-center transition-all ${
                selectedRole === role.key
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-teal-50 rounded-xl flex-shrink-0">
                {role.icon}
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{role.label}</div>
                <div className="text-xs text-gray-500 leading-tight">{role.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Name Dropdown */}
        {selectedRole && (
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 text-sm mb-2">
              Select your name
            </label>
            <select
              value={selectedProfile?.id || ''}
              onChange={(e) => {
                const profile = profiles.find(p => p.id === e.target.value)
                setSelectedProfile(profile || null)
              }}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:border-teal-500 bg-white"
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
          className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-all ${
            selectedProfile
              ? 'bg-teal-600 hover:bg-teal-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {selectedProfile
            ? `Enter as ${selectedProfile.name}`
            : 'Select a role and name'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-5">
          © 2026 Sejuk Sejuk AC Services. All rights reserved.
        </p>
      </div>
    </div>
  )
}
