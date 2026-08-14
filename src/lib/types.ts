export type Role = 'admin' | 'employee' | 'demo'

// Every top-level page and its sub-sections, checkbox-selectable per employee user.
export const PAGE_SECTIONS = {
  orders: ['view', 'create', 'edit', 'notes', 'documents'],
  analytics: ['revenue', 'phases', 'velocity', 'services'],
  messaging: ['direct', 'groups'],
  admin: ['users', 'permissions'],
} as const

export type PageKey = keyof typeof PAGE_SECTIONS
export type SectionKey<P extends PageKey = PageKey> = (typeof PAGE_SECTIONS)[P][number]

// permissions[page] = array of granted section keys for that page (employee role only)
export type Permissions = Partial<Record<PageKey, string[]>>

export interface User {
  id: string
  email: string
  role: Role
  permissions: Permissions
  createdAt: string
}

export const ORDER_PHASES = [
  'Consultation Booked',
  'Waiting Build',
  'In Progress',
  'Completed',
  'Sent',
  'Feedback Changes Awaiting',
  'Feedback Changes In Progress',
  'Feedback Changes Completed',
  'Finalized (Done)',
] as const

export type OrderPhase = (typeof ORDER_PHASES)[number]

export interface AdditionalCost {
  id: string
  label: string
  amount: number
}

export interface OrderDocument {
  id: string
  fileName: string
  uploadedAt: string
  url: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceText: string
  phase: OrderPhase
  quotedAmount: number
  additionalCosts: AdditionalCost[]
  consultationDate: string | null
  notes: string
  documents: OrderDocument[]
  createdAt: string
  updatedAt: string
}

export interface ServiceSuggestion {
  serviceText: string
  count: number
}

export interface MessageThread {
  id: string
  isGroup: boolean
  name: string | null
  participantEmails: string[]
  lastMessagePreview: string
  lastMessageAt: string
}

export interface Message {
  id: string
  threadId: string
  senderEmail: string
  body: string
  sentAt: string
}
