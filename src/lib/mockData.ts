import type { MessageThread, Message, Order, ServiceSuggestion, User } from './types'
import { ORDER_PHASES } from './types'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

export const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'admin@ljwebmanagement.com',
    role: 'admin',
    permissions: {},
    createdAt: daysAgo(200),
  },
  {
    id: 'u2',
    email: 'employee@ljwebmanagement.com',
    role: 'employee',
    permissions: {
      orders: ['view', 'create', 'edit', 'notes'],
      analytics: ['revenue'],
    },
    createdAt: daysAgo(90),
  },
  {
    id: 'u3',
    email: 'demo@ljwebmanagement.com',
    role: 'demo',
    permissions: {},
    createdAt: daysAgo(30),
  },
]

const services = ['Website Redesign', 'Inventory Sync', 'SEO Audit', 'Logo Design', 'Hosting Migration', 'inventory sync', ' Inventory Sync ']

export const mockOrders: Order[] = Array.from({ length: 24 }).map((_, i) => {
  const phase = ORDER_PHASES[i % ORDER_PHASES.length]
  const service = services[i % services.length]
  return {
    id: `ord_${i + 1}`,
    customerName: `Customer ${i + 1}`,
    customerEmail: `customer${i + 1}@example.com`,
    customerPhone: '555-010' + String(i % 10),
    serviceText: service,
    phase,
    quotedAmount: 500 + i * 75,
    additionalCosts:
      i % 3 === 0
        ? [{ id: `ac_${i}`, label: 'Third-party subscription', amount: 49 }]
        : [],
    consultationDate: i % 5 === 0 ? null : daysAgo(2 + i),
    notes: 'Sample placeholder notes for demo/mock data.',
    documents: [],
    createdAt: daysAgo(30 + i),
    updatedAt: daysAgo(i),
  }
})

export const mockServiceSuggestions: ServiceSuggestion[] = [
  { serviceText: 'Inventory Sync', count: 9 },
  { serviceText: 'Website Redesign', count: 6 },
  { serviceText: 'SEO Audit', count: 4 },
  { serviceText: 'Logo Design', count: 3 },
  { serviceText: 'Hosting Migration', count: 2 },
]

export const mockThreads: MessageThread[] = [
  {
    id: 't1',
    isGroup: false,
    name: null,
    participantEmails: ['admin@ljwebmanagement.com', 'employee@ljwebmanagement.com'],
    lastMessagePreview: 'Sounds good, thanks!',
    lastMessageAt: daysAgo(0.1),
  },
  {
    id: 't2',
    isGroup: true,
    name: 'Order Ops',
    participantEmails: ['admin@ljwebmanagement.com', 'employee@ljwebmanagement.com', 'demo@ljwebmanagement.com'],
    lastMessagePreview: 'New order came in.',
    lastMessageAt: daysAgo(1),
  },
]

export const mockMessages: Record<string, Message[]> = {
  t1: [
    { id: 'm1', threadId: 't1', senderEmail: 'admin@ljwebmanagement.com', body: 'Hey, got a minute?', sentAt: daysAgo(0.2) },
    { id: 'm2', threadId: 't1', senderEmail: 'employee@ljwebmanagement.com', body: 'Sounds good, thanks!', sentAt: daysAgo(0.1) },
  ],
  t2: [
    { id: 'm3', threadId: 't2', senderEmail: 'admin@ljwebmanagement.com', body: 'New order came in.', sentAt: daysAgo(1) },
  ],
}
