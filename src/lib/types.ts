export type Role = 'admin' | 'employee' | 'demo'

// Every top-level page and its sub-sections, checkbox-selectable per employee user.
export const PAGE_SECTIONS = {
  orders: ['view', 'create', 'edit', 'notes', 'documents'],
  analytics: ['revenue', 'phases', 'velocity', 'services'],
  messaging: ['direct', 'groups'],
  transcripts: ['view', 'upload'],
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
  // Mock-only until Cognito is live (real accounts won't expose passwords
  // to the frontend at all, only an "AdminSetUserPassword"-style action).
  password: string
  canChangeOwnPassword: boolean
  canManageOtherPasswords: boolean
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

export const STARTING_ORDER_NUMBER = 78653

export interface AdditionalCost {
  id: string
  label: string
  amount: number
}

export type TaxFeeType = 'flat' | 'percent'

export interface TaxFee {
  id: string
  label: string
  type: TaxFeeType
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
  orderNumber: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  serviceText: string
  phase: OrderPhase
  quotedAmount: number
  additionalCosts: AdditionalCost[]
  taxesAndFees: TaxFee[]
  consultationDate: string | null
  notes: string
  documents: OrderDocument[]
  createdAt: string
  updatedAt: string
}

export interface PastCustomer {
  id: string
  firstName: string
  lastName: string
  address: string
  email: string
  phone: string
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

export interface ChatTranscript {
  id: string
  customerName: string
  customerEmail: string
  receivedAt: string
  fileName: string
  url: string
  summary: string
  source: 'tawk.to' | 'manual upload'
}
