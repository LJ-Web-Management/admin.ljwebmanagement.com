import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { PAGE_SECTIONS } from '../../lib/types'
import type { PageKey, Role, User } from '../../lib/types'

export function UserAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    api.listUsers().then(setUsers)
  }, [])

  const updateUser = (id: string, patch: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  const toggleSection = (userId: string, page: PageKey, section: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u
        const current = u.permissions[page] ?? []
        const next = current.includes(section) ? current.filter((s) => s !== section) : [...current, section]
        return { ...u, permissions: { ...u.permissions, [page]: next } }
      }),
    )
  }

  const addUser = () => {
    const newUser: User = {
      id: crypto.randomUUID(),
      email: '',
      role: 'employee',
      permissions: {},
      createdAt: new Date().toISOString(),
    }
    setUsers((prev) => [...prev, newUser])
    setEditingId(newUser.id)
  }

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-navy">User management</h1>
        <button onClick={addUser} className="rounded bg-navy hover:bg-navy-dark text-white transition-colors px-3 py-1.5 text-sm">
          Add user
        </button>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded border border-neutral-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={u.email}
                onChange={(e) => updateUser(u.id, { email: e.target.value })}
                placeholder="email@example.com"
                className="flex-1 min-w-48 rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
              />
              <select
                value={u.role}
                onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                className="rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="admin">Admin — full access</option>
                <option value="employee">Employee — granular access</option>
                <option value="demo">Demo — sanitized data</option>
              </select>
              <button
                onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                {u.role === 'employee' ? (editingId === u.id ? 'Hide permissions' : 'Edit permissions') : ''}
              </button>
              <button onClick={() => removeUser(u.id)} className="text-sm text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>

            {u.role === 'employee' && editingId === u.id && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                {(Object.keys(PAGE_SECTIONS) as PageKey[]).map((page) => (
                  <div key={page}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">{page}</p>
                    {PAGE_SECTIONS[page].map((section) => (
                      <label key={section} className="flex items-center gap-2 text-sm py-0.5">
                        <input
                          type="checkbox"
                          checked={u.permissions[page]?.includes(section) ?? false}
                          onChange={() => toggleSection(u.id, page, section)}
                        />
                        {section}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        Changes here are local until the admin API (Cognito user pool + Postgres permissions table) is connected.
      </p>
    </div>
  )
}
