import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth/AuthContext'
import { USE_MOCK_API } from '../lib/env'
import type { PageKey } from '../lib/types'

const NAV_ITEMS: { to: string; label: string; page: PageKey }[] = [
  { to: '/orders', label: 'Orders', page: 'orders' },
  { to: '/analytics', label: 'Analytics', page: 'analytics' },
  { to: '/messaging', label: 'Messaging', page: 'messaging' },
  { to: '/transcripts', label: 'Chatbot Transcripts', page: 'transcripts' },
  { to: '/admin/users', label: 'Users', page: 'admin' },
]

export function Layout() {
  const { user, logout, canAccessPage, isDemo } = useAuth()

  return (
    <div className="flex h-svh">
      <aside className="w-56 shrink-0 bg-navy text-white flex flex-col h-svh sticky top-0">
        <div className="px-4 py-5">
          <p className="font-heading font-semibold text-sm">LJ Web Management</p>
          <p className="text-xs text-white/60">Admin</p>
        </div>
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter((item) => canAccessPage(item.page)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-cyan text-navy-dark font-medium' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-xs shrink-0">
          <p className="truncate">{user?.email}</p>
          <p className="text-white/50 uppercase tracking-wide">{user?.role}</p>
          <button onClick={logout} className="mt-2 text-white/60 hover:text-cyan-light">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-mist overflow-y-auto">
        {isDemo && (
          <div className="bg-amber-100 text-amber-900 text-xs px-4 py-2">
            Demo mode - all data shown is sanitized placeholder data.
          </div>
        )}
        {USE_MOCK_API && !isDemo && (
          <div className="bg-cyan/15 text-navy-dark text-xs px-4 py-2">
            Mock API mode - no live backend connected yet.
          </div>
        )}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
