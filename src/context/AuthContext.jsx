import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Each role gets its own storage key — allows multiple portals open simultaneously
const storageKey = (role) => `sejuk_user_${role}`

// On init, figure out which user to restore based on current URL path
function getInitialUser() {
  try {
    const path = window.location.pathname
    let role = null
    if (path.startsWith('/admin'))      role = 'admin'
    else if (path.startsWith('/technician')) role = 'technician'
    else if (path.startsWith('/manager'))    role = 'manager'

    if (role) {
      const stored = localStorage.getItem(storageKey(role))
      return stored ? JSON.parse(stored) : null
    }
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)

  const login = (profile) => {
    setUser(profile)
    localStorage.setItem(storageKey(profile.role), JSON.stringify(profile))
  }

  const logout = () => {
    if (user?.role) localStorage.removeItem(storageKey(user.role))
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}