import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ServiceInput } from '../../components/ServiceInput'
import { TimeSince } from '../../components/TimeSince'
import { api } from '../../lib/apiClient'
import { generateInvoicePdf } from '../../lib/invoice'
import { ORDER_PHASES } from '../../lib/types'
import type { AdditionalCost, Order, OrderPhase } from '../../lib/types'

const emptyOrder = (): Order => ({
  id: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  serviceText: '',
  phase: 'Consultation Booked',
  quotedAmount: 0,
  additionalCosts: [],
  consultationDate: null,
  notes: '',
  documents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export function OrderForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order>(emptyOrder())
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (isNew) return
    api.listOrders().then((orders) => {
      const found = orders.find((o) => o.id === id)
      if (found) setOrder(found)
      setLoading(false)
    })
  }, [id, isNew])

  const addCost = () => {
    const cost: AdditionalCost = { id: crypto.randomUUID(), label: '', amount: 0 }
    setOrder((o) => ({ ...o, additionalCosts: [...o.additionalCosts, cost] }))
  }

  const updateCost = (costId: string, patch: Partial<AdditionalCost>) => {
    setOrder((o) => ({
      ...o,
      additionalCosts: o.additionalCosts.map((c) => (c.id === costId ? { ...c, ...patch } : c)),
    }))
  }

  const removeCost = (costId: string) => {
    setOrder((o) => ({ ...o, additionalCosts: o.additionalCosts.filter((c) => c.id !== costId) }))
  }

  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  const onSave = () => {
    // TODO: wire to POST/PUT /orders once the backend API is live.
    navigate('/orders')
  }

  const onGenerateInvoice = async () => {
    setGeneratingInvoice(true)
    try {
      await generateInvoicePdf(order)
    } finally {
      setGeneratingInvoice(false)
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-heading font-semibold text-navy">{isNew ? 'New order' : order.customerName}</h1>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer name">
          <input
            value={order.customerName}
            onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Customer email">
          <input
            type="email"
            value={order.customerEmail}
            onChange={(e) => setOrder({ ...order, customerEmail: e.target.value })}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Customer phone">
          <input
            value={order.customerPhone}
            onChange={(e) => setOrder({ ...order, customerPhone: e.target.value })}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Phase">
          <select
            value={order.phase}
            onChange={(e) => setOrder({ ...order, phase: e.target.value as OrderPhase })}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          >
            {ORDER_PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Service">
          <ServiceInput value={order.serviceText} onChange={(v) => setOrder({ ...order, serviceText: v })} />
        </Field>
        <Field label="Quoted amount ($)">
          <input
            type="number"
            value={order.quotedAmount}
            onChange={(e) => setOrder({ ...order, quotedAmount: Number(e.target.value) })}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Consultation date">
          <input
            type="date"
            value={order.consultationDate?.slice(0, 10) ?? ''}
            onChange={(e) =>
              setOrder({ ...order, consultationDate: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          />
          {order.consultationDate && (
            <p className="text-xs text-neutral-500 mt-1">
              <TimeSince date={order.consultationDate} /> since consultation
            </p>
          )}
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Additional costs</h2>
          <button onClick={addCost} type="button" className="text-sm text-neutral-500 hover:text-neutral-900">
            + Add cost
          </button>
        </div>
        {order.additionalCosts.map((c) => (
          <div key={c.id} className="flex gap-2">
            <input
              value={c.label}
              onChange={(e) => updateCost(c.id, { label: e.target.value })}
              placeholder="e.g. Third-party subscription"
              className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={c.amount}
              onChange={(e) => updateCost(c.id, { amount: Number(e.target.value) })}
              className="w-28 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
            />
            <button onClick={() => removeCost(c.id)} type="button" className="text-neutral-400 hover:text-red-600 px-2">
              ×
            </button>
          </div>
        ))}
      </div>

      <Field label="Notes">
        <textarea
          value={order.notes}
          onChange={(e) => setOrder({ ...order, notes: e.target.value })}
          rows={4}
          className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Documents</h2>
        <p className="text-xs text-neutral-500">
          PDF uploads will store to a private S3 bucket via signed URL once the backend is deployed.
        </p>
        <input type="file" accept="application/pdf" disabled className="text-sm" />
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} className="rounded bg-navy hover:bg-navy-dark text-white transition-colors px-4 py-2 text-sm">
          Save order
        </button>
        {!isNew && (
          <button
            onClick={onGenerateInvoice}
            disabled={generatingInvoice}
            type="button"
            className="rounded border border-navy text-navy hover:bg-navy/5 transition-colors px-4 py-2 text-sm disabled:opacity-50"
          >
            {generatingInvoice ? 'Generating…' : 'Generate invoice'}
          </button>
        )}
        <button onClick={() => navigate('/orders')} type="button" className="px-4 py-2 text-sm text-neutral-500">
          Cancel
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
