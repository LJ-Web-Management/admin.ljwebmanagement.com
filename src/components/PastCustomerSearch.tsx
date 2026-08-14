import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/apiClient'
import { parseCustomersCsv } from '../lib/pastCustomers'
import type { PastCustomer } from '../lib/types'

export function PastCustomerSearch({ onSelect }: { onSelect: (customer: PastCustomer) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PastCustomer[]>([])
  const [open, setOpen] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      api.searchPastCustomers(query).then(setResults)
    }, 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseCustomersCsv(text)
    await api.importPastCustomers(parsed)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setImportMessage(`Imported ${parsed.length} past customer${parsed.length === 1 ? '' : 's'}.`)
    setTimeout(() => setImportMessage(''), 4000)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Search past customers</span>
        <label className="text-xs text-navy hover:text-navy-dark cursor-pointer">
          Import CSV
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onImport} className="hidden" />
        </label>
      </div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search by first or last name..."
          className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
        />
        {open && results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-neutral-200 bg-white shadow max-h-48 overflow-auto">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseDown={() => {
                    onSelect(c)
                    setQuery('')
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100"
                >
                  <p className="font-medium">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">{c.address}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-neutral-500">CSV format: firstName,lastName,address,email,phone (one per line).</p>
      {importMessage && <p className="text-xs text-navy">{importMessage}</p>}
    </div>
  )
}
