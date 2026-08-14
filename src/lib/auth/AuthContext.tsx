import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../apiClient'
import type { PageKey, User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  canAccessPage: (page: PageKey) => boolean
  canAccessSection: (page: PageKey, section: string) => boolean
  isDemo: boolean
}

const AuthContext = createContext<AuthState | null>(null)

const STORAGE_KEY = 'ljwm_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setUser(JSON.parse(raw))
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { user, token } = await api.login(email, password)
    localStorage.setItem('idToken', token)
    // Never persist the password field to localStorage, even in mock mode.
    const { password: _password, ...storedUser } = user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedUser))
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('idToken')
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const canAccessPage = (page: PageKey) => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'demo') return true
    return Boolean(user.permissions[page]?.length)
  }

  const canAccessSection = (page: PageKey, section: string) => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'demo') return true
    return Boolean(user.permissions[page]?.includes(section))
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, canAccessPage, canAccessSection, isDemo: user?.role === 'demo' }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
