import { API_BASE_URL, USE_MOCK_API } from './env'
import { mockMessages, mockOrders, mockServiceSuggestions, mockThreads, mockUsers } from './mockData'
import type { Message, MessageThread, Order, ServiceSuggestion, User } from './types'

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

// Mock-only credential gate until Cognito is provisioned — this is not a
// real secret and grants no access to real data, only the mock demo build.
const MOCK_PASSWORD = 'd734937V'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('idToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (USE_MOCK_API) {
      await delay()
      const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!user || password !== MOCK_PASSWORD) throw new Error('Invalid email or password')
      return { user, token: 'mock-token' }
    }
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },

  async listOrders(): Promise<Order[]> {
    if (USE_MOCK_API) {
      await delay()
      return mockOrders
    }
    return request('/orders')
  },

  async suggestServices(q: string): Promise<ServiceSuggestion[]> {
    if (USE_MOCK_API) {
      await delay(120)
      const query = q.trim().toLowerCase()
      if (!query) return mockServiceSuggestions
      return mockServiceSuggestions.filter((s) => s.serviceText.toLowerCase().includes(query))
    }
    return request(`/services/suggest?q=${encodeURIComponent(q)}`)
  },

  async listUsers(): Promise<User[]> {
    if (USE_MOCK_API) {
      await delay()
      return mockUsers
    }
    return request('/admin/users')
  },

  async listThreads(): Promise<MessageThread[]> {
    if (USE_MOCK_API) {
      await delay()
      return mockThreads
    }
    return request('/messaging/threads')
  },

  async listMessages(threadId: string): Promise<Message[]> {
    if (USE_MOCK_API) {
      await delay()
      return mockMessages[threadId] ?? []
    }
    return request(`/messaging/threads/${threadId}/messages`)
  },
}
