import type { ChatTranscript, MessageThread, Message, Order, PastCustomer, ServiceSuggestion, User } from './types'
import { ORDER_PHASES, STARTING_ORDER_NUMBER } from './types'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

export const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'marketing@ljwebmanagement.com',
    role: 'admin',
    permissions: {},
    createdAt: daysAgo(200),
    password: 'd734937V',
    canChangeOwnPassword: true,
    canManageOtherPasswords: true,
  },
]

const services = ['Website Redesign', 'Inventory Sync', 'SEO Audit', 'Logo Design', 'Hosting Migration', 'inventory sync', ' Inventory Sync ']

export const mockOrders: Order[] = Array.from({ length: 24 }).map((_, i) => {
  const phase = ORDER_PHASES[i % ORDER_PHASES.length]
  const service = services[i % services.length]
  return {
    id: `ord_${i + 1}`,
    orderNumber: STARTING_ORDER_NUMBER + i,
    customerName: `Customer ${i + 1}`,
    customerEmail: `customer${i + 1}@example.com`,
    customerPhone: '555-010' + String(i % 10),
    customerAddress: `${100 + i} Main St, Lockport, IL 60441`,
    serviceText: service,
    phase,
    quotedAmount: 500 + i * 75,
    additionalCosts: [],
    taxesAndFees: [],
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

export const mockPastCustomers: PastCustomer[] = [
  { id: 'pc1', firstName: 'Alex', lastName: 'Morgan', address: '212 Oak St, Lockport, IL 60441', email: 'alex.morgan@example.com', phone: '555-2201' },
  { id: 'pc2', firstName: 'Jamie', lastName: 'Chen', address: '48 Birch Ave, Joliet, IL 60432', email: 'jamie.chen@example.com', phone: '555-2202' },
  { id: 'pc3', firstName: 'Taylor', lastName: 'Reyes', address: '900 Maple Dr, Plainfield, IL 60544', email: 'taylor.reyes@example.com', phone: '555-2203' },
]

export const mockTranscripts: ChatTranscript[] = [
  {
    id: 'tr1',
    customerName: 'Morgan Blake',
    customerEmail: 'morgan.blake@example.com',
    receivedAt: daysAgo(1.4),
    fileName: 'transcript-morgan-blake.txt',
    url: '',
    summary: 'Asked about pricing for a website redesign and hosting migration timeline.',
    source: 'tawk.to',
  },
  {
    id: 'tr2',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@example.com',
    receivedAt: daysAgo(3.1),
    fileName: 'transcript-priya-nair.txt',
    url: '',
    summary: 'Reported an issue with an existing inventory sync order, requested status update.',
    source: 'tawk.to',
  },
]

export const mockThreads: MessageThread[] = [
  {
    id: 't2',
    isGroup: true,
    name: 'Order Ops',
    participantEmails: ['marketing@ljwebmanagement.com'],
    lastMessagePreview: 'New order came in.',
    lastMessageAt: daysAgo(1),
  },
]

export const mockMessages: Record<string, Message[]> = {
  t2: [
    { id: 'm3', threadId: 't2', senderEmail: 'marketing@ljwebmanagement.com', body: 'New order came in.', sentAt: daysAgo(1) },
  ],
}
