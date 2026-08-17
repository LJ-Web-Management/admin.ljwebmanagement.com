import { API_BASE_URL, USE_MOCK_API } from './env'
import { mockMessages, mockOrders, mockServiceSuggestions, mockThreads, mockUsers } from './mockData'
import { addPastCustomers as addLocalPastCustomers, searchPastCustomers as searchLocalPastCustomers } from './pastCustomers'
import type { Message, MessageThread, Order, PastCustomer, ServiceSuggestion, User } from './types'

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

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
      if (!user || password !== user.password) throw new Error('Invalid email or password')
      return { user, token: 'mock-token' }
    }
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },

  async listOrders(): Promise<Order[]> {
    if (USE_MOCK_API) {
      await delay()
      // Copy, not the live reference - mockOrders is mutated in place by
      // saveOrder, and handing out the same array reference on every call
      // means a caller that re-fetches after a mutation and calls
      // setState(sameRef) gets silently skipped by React's Object.is bail-out.
      return [...mockOrders]
    }
    return request('/orders')
  },

  async saveOrder(order: Order): Promise<Order> {
    if (USE_MOCK_API) {
      await delay()
      const index = mockOrders.findIndex((o) => o.id === order.id)
      if (index === -1) {
        const created = { ...order, id: order.id || crypto.randomUUID() }
        mockOrders.push(created)
        return created
      }
      mockOrders[index] = order
      return order
    }
    return order.id
      ? request(`/orders/${order.id}`, { method: 'PUT', body: JSON.stringify(order) })
      : request('/orders', { method: 'POST', body: JSON.stringify(order) })
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
      return [...mockUsers]
    }
    return request('/admin/users')
  },

  async saveUser(user: User): Promise<User> {
    if (USE_MOCK_API) {
      await delay()
      const index = mockUsers.findIndex((u) => u.id === user.id)
      if (index === -1) {
        mockUsers.push(user)
      } else {
        mockUsers[index] = user
      }
      return user
    }
    return request(`/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) })
  },

  async createUser(user: User): Promise<User> {
    if (USE_MOCK_API) {
      await delay()
      mockUsers.push(user)
      return user
    }
    return request('/admin/users', { method: 'POST', body: JSON.stringify(user) })
  },

  async deleteUser(id: string): Promise<void> {
    if (USE_MOCK_API) {
      await delay()
      const index = mockUsers.findIndex((u) => u.id === id)
      if (index !== -1) mockUsers.splice(index, 1)
      return
    }
    await request(`/admin/users/${id}`, { method: 'DELETE' })
  },

  async listThreads(): Promise<MessageThread[]> {
    if (USE_MOCK_API) {
      await delay()
      return [...mockThreads]
    }
    return request('/messaging/threads')
  },

  async createThread(input: { isGroup: boolean; name: string | null; participantEmails: string[] }): Promise<MessageThread> {
    if (USE_MOCK_API) {
      await delay()
      const thread: MessageThread = {
        id: crypto.randomUUID(),
        isGroup: input.isGroup,
        name: input.name,
        participantEmails: input.participantEmails,
        lastMessagePreview: '',
        lastMessageAt: new Date().toISOString(),
      }
      mockThreads.push(thread)
      return thread
    }
    return request('/messaging/threads', { method: 'POST', body: JSON.stringify(input) })
  },

  async listMessages(threadId: string): Promise<Message[]> {
    if (USE_MOCK_API) {
      await delay()
      return mockMessages[threadId] ?? []
    }
    return request(`/messaging/threads/${threadId}/messages`)
  },

  async searchPastCustomers(q: string): Promise<PastCustomer[]> {
    if (USE_MOCK_API) {
      await delay(120)
      return searchLocalPastCustomers(q)
    }
    return request(`/customers/search?q=${encodeURIComponent(q)}`)
  },

  async importPastCustomers(customers: Omit<PastCustomer, 'id'>[]): Promise<PastCustomer[]> {
    if (USE_MOCK_API) {
      await delay()
      return addLocalPastCustomers(customers)
    }
    return request('/customers/import', { method: 'POST', body: JSON.stringify({ customers }) })
  },
}
