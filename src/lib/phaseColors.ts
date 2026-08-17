import type { OrderPhase } from './types'

// Single source of truth for phase colors, so the same phase always reads
// as the same color everywhere it shows up (order badges, charts, etc.).
// Tailwind classes for UI badges, hex for anywhere colors are needed as
// actual values (chart fills, inline styles) rather than class names.

export const PHASE_BADGE_CLASSES: Record<OrderPhase, string> = {
  'Consultation Booked': 'bg-neutral-200 text-neutral-800',
  'Waiting Build': 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Sent: 'bg-teal-100 text-teal-800',
  'Feedback Changes Awaiting': 'bg-orange-100 text-orange-800',
  'Feedback Changes In Progress': 'bg-purple-100 text-purple-800',
  'Feedback Changes Completed': 'bg-indigo-100 text-indigo-800',
  'Finalized (Done)': 'bg-emerald-200 text-emerald-900',
}

export const PHASE_HEX: Record<OrderPhase, string> = {
  'Consultation Booked': '#737373',
  'Waiting Build': '#f59e0b',
  'In Progress': '#3b82f6',
  Completed: '#22c55e',
  Sent: '#14b8a6',
  'Feedback Changes Awaiting': '#f97316',
  'Feedback Changes In Progress': '#a855f7',
  'Feedback Changes Completed': '#6366f1',
  'Finalized (Done)': '#059669',
}
