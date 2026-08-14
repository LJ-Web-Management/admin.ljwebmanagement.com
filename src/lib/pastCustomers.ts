import { mockPastCustomers } from './mockData'
import type { PastCustomer } from './types'

const STORAGE_KEY = 'ljwm_past_customers'

// localStorage stand-in until the backend exists - once live this becomes a
// real customers table, name/address/contact only (no order or financial history).
function readStore(): PastCustomer[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPastCustomers))
    return mockPastCustomers
  }
  try {
    return JSON.parse(raw) as PastCustomer[]
  } catch {
    return mockPastCustomers
  }
}

function writeStore(customers: PastCustomer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

export function searchPastCustomers(q: string): PastCustomer[] {
  const query = q.trim().toLowerCase()
  const all = readStore()
  if (!query) return all
  return all.filter(
    (c) => c.firstName.toLowerCase().includes(query) || c.lastName.toLowerCase().includes(query),
  )
}

export function addPastCustomers(customers: Omit<PastCustomer, 'id'>[]): PastCustomer[] {
  const all = readStore()
  const withIds = customers.map((c) => ({ ...c, id: crypto.randomUUID() }))
  const next = [...all, ...withIds]
  writeStore(next)
  return next
}

// Minimal CSV parser for a fixed column order: firstName,lastName,address,email,phone
// Handles simple double-quoted fields; not a general-purpose CSV parser.
export function parseCustomersCsv(text: string): Omit<PastCustomer, 'id'>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const rows = lines[0]?.toLowerCase().startsWith('firstname') ? lines.slice(1) : lines

  return rows.map((line) => {
    const cells = line.split(',').map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'))

    const [firstName = '', lastName = '', address = '', email = '', phone = ''] = cells
    return { firstName, lastName, address, email, phone }
  })
}
