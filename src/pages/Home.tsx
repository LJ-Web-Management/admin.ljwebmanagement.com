import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/AuthContext'
import type { PageKey } from '../lib/types'

const FALLBACK_ORDER: PageKey[] = ['analytics', 'orders', 'messaging', 'transcripts', 'admin']
const PATHS: Record<PageKey, string> = {
  orders: '/orders',
  analytics: '/analytics',
  messaging: '/messaging',
  transcripts: '/transcripts',
  admin: '/admin/users',
}

export function Home() {
  const { canAccessPage } = useAuth()
  const firstAvailable = FALLBACK_ORDER.find((p) => canAccessPage(p))
  return <Navigate to={firstAvailable ? PATHS[firstAvailable] : '/login'} replace />
}
