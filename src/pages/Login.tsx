import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/AuthContext'
import { USE_MOCK_API } from '../lib/env'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-mist">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h1 className="text-xl font-heading font-semibold text-navy">Admin sign in</h1>
          <p className="text-sm text-body">LJ Web Management</p>
        </div>
        {USE_MOCK_API && (
          <p className="text-xs bg-cyan/10 text-navy-dark rounded px-3 py-2">
            Mock mode: try admin@ljwebmanagement.com / employee@ljwebmanagement.com / demo@ljwebmanagement.com with any password.
          </p>
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-line bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-line bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-navy hover:bg-navy-dark transition-colors text-white py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
