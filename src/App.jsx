import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [status, setStatus] = useState('Connecting...')

  useEffect(() => {
    supabase.from('profiles').select('count').then(({ error }) => {
      if (error) {
        setStatus('⚠️ Connected but no tables yet: ' + error.message)
      } else {
        setStatus('✅ Supabase connected!')
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Sejuk Sejuk Ops 🧊</h1>
        <p className="text-gray-600 text-lg">{status}</p>
      </div>
    </div>
  )
}