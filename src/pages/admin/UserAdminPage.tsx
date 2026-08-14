import { useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'
import { USE_MOCK_API } from '../../lib/env'
import { PAGE_SECTIONS } from '../../lib/types'
import { usePageTitle } from '../../lib/usePageTitle'
import type { PageKey, Role, User } from '../../lib/types'

export function UserAdminPage() {
  usePageTitle('Users')
  const [users, setUsers] = useState<User[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.listUsers().then(setUsers)
  }, [])

  // Updates local state immediately for responsive typing; the caller
  // decides when to persist via commitUser (on blur/discrete actions),
  // so text fields don't fire a request per keystroke.
  const updateUser = (id: string, patch: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  const commitUser = (user: User, patch: Partial<User> = {}) => {
    const next = { ...user, ...patch }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? next : u)))
    api.saveUser(next).catch(() => {})
  }

  const togglePasswordVisible = (id: string) => {
    setVisiblePasswordIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSection = (user: User, page: PageKey, section: string) => {
    const current = user.permissions[page] ?? []
    const nextSections = current.includes(section) ? current.filter((s) => s !== section) : [...current, section]
    commitUser(user, { permissions: { ...user.permissions, [page]: nextSections } })
  }

  const addUser = () => {
    const newUser: User = {
      id: crypto.randomUUID(),
      email: '',
      role: 'employee',
      permissions: {},
      createdAt: new Date().toISOString(),
      password: '',
      canChangeOwnPassword: true,
      canManageOtherPasswords: false,
    }
    setUsers((prev) => [...prev, newUser])
    setEditingId(newUser.id)
    api.createUser(newUser).catch(() => {})
  }

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    api.deleteUser(id).catch(() => {})
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
                onBlur={() => commitUser(u)}
                placeholder="email@example.com"
                className="flex-1 min-w-48 rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
              />
              <select
                value={u.role}
                onChange={(e) => commitUser(u, { role: e.target.value as Role })}
                className="rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="admin">Admin - full access</option>
                <option value="employee">Employee - granular access</option>
                <option value="demo">Demo - sanitized data</option>
              </select>
              <button
                onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                {editingId === u.id ? 'Hide details' : 'Edit details'}
              </button>
              <button onClick={() => removeUser(u.id)} className="text-sm text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>

            {editingId === u.id && (
              <div className="space-y-4 pt-2 border-t border-neutral-100">
                <div className="flex items-end gap-2 max-w-sm">
                  <label className="flex-1 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Password</span>
                    <input
                      type={visiblePasswordIds.has(u.id) ? 'text' : 'password'}
                      value={u.password}
                      onChange={(e) => updateUser(u.id, { password: e.target.value })}
                      onBlur={() => commitUser(u)}
                      placeholder="Set a password"
                      className="w-full rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => togglePasswordVisible(u.id)}
                    className="text-sm text-neutral-500 hover:text-neutral-900 py-1.5"
                  >
                    {visiblePasswordIds.has(u.id) ? 'Hide' : 'Show'}
                  </button>
                </div>

                {u.role === 'employee' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Password permissions</p>
                    <label className="flex items-center gap-2 text-sm py-0.5">
                      <input
                        type="checkbox"
                        checked={u.canChangeOwnPassword}
                        onChange={(e) => commitUser(u, { canChangeOwnPassword: e.target.checked })}
                      />
                      Can change their own password
                    </label>
                    <label className="flex items-center gap-2 text-sm py-0.5">
                      <input
                        type="checkbox"
                        checked={u.canManageOtherPasswords}
                        onChange={(e) => commitUser(u, { canManageOtherPasswords: e.target.checked })}
                      />
                      Can view/change other users' passwords
                    </label>
                  </div>
                )}

                {u.role === 'employee' && (
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(PAGE_SECTIONS) as PageKey[]).map((page) => (
                      <div key={page}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">{page}</p>
                        {PAGE_SECTIONS[page].map((section) => (
                          <label key={section} className="flex items-center gap-2 text-sm py-0.5">
                            <input
                              type="checkbox"
                              checked={u.permissions[page]?.includes(section) ?? false}
                              onChange={() => toggleSection(u, page, section)}
                            />
                            {section}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {USE_MOCK_API && (
        <p className="text-xs text-neutral-500">
          Changes here are local until the admin API (Cognito user pool + Postgres permissions table) is connected.
        </p>
      )}
    </div>
  )
}
