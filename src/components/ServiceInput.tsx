import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/apiClient'
import type { ServiceSuggestion } from '../lib/types'

export function ServiceInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      api.suggestServices(value).then(setSuggestions).catch(() => setSuggestions([]))
    }, 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Website Redesign"
        disabled={disabled}
        className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded border border-neutral-200 bg-white shadow max-h-48 overflow-auto">
          {suggestions.map((s) => (
            <li key={s.serviceText}>
              <button
                type="button"
                onMouseDown={() => onChange(s.serviceText)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 flex justify-between"
              >
                <span>{s.serviceText}</span>
                <span className="text-neutral-400">{s.count}×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
