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
  const { user, canAccessPage, logout } = useAuth()
  const firstAvailable = FALLBACK_ORDER.find((p) => canAccessPage(p))

  if (firstAvailable) return <Navigate to={PATHS[firstAvailable]} replace />

  // A logged-in user with no page access yet (e.g. a brand-new employee
  // before an admin grants any permissions). Redirecting to /login here
  // would bounce right back to "/" since the user is authenticated,
  // an infinite loop, so show a message instead.
  return (
    <div className="min-h-svh flex items-center justify-center bg-mist">
      <div className="max-w-sm text-center space-y-3 p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-lg font-heading font-semibold text-navy">No access yet</h1>
        <p className="text-sm text-body">
          Your account ({user?.email}) doesn't have any pages enabled yet. Ask an admin to grant access from User
          management.
        </p>
        <button
          onClick={logout}
          className="rounded bg-navy hover:bg-navy-dark transition-colors text-white px-4 py-2 text-sm font-medium"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
