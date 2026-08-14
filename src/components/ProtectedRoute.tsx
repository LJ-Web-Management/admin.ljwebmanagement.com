import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/AuthContext'
import type { PageKey } from '../lib/types'

export function ProtectedRoute({ page, children }: { page?: PageKey; children: ReactNode }) {
  const { user, loading, canAccessPage } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (page && !canAccessPage(page)) return <Navigate to="/" replace />

  return <>{children}</>
}
