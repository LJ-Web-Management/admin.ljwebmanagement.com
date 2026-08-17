import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PastCustomerSearch } from '../../components/PastCustomerSearch'
import { ServiceInput } from '../../components/ServiceInput'
import { TimeSince } from '../../components/TimeSince'
import { api } from '../../lib/apiClient'
import { useAuth } from '../../lib/auth/AuthContext'
import { generateInvoicePdf } from '../../lib/invoice'
import { ORDER_PHASES, STARTING_ORDER_NUMBER } from '../../lib/types'
import { usePageTitle } from '../../lib/usePageTitle'
import type { AdditionalCost, Order, OrderPhase, TaxFee } from '../../lib/types'

const emptyOrder = (orderNumber: number): Order => ({
  id: '',
  orderNumber,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  serviceText: '',
  phase: 'Consultation Booked',
  quotedAmount: 0,
  additionalCosts: [],
  taxesAndFees: [],
  consultationDate: null,
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export function OrderForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { canAccessSection } = useAuth()
  const [order, setOrder] = useState<Order>(emptyOrder(STARTING_ORDER_NUMBER))
  const [loading, setLoading] = useState(true)

  usePageTitle(isNew ? 'New Order' : `Order ${order.orderNumber || ''}`)

  const canCreate = canAccessSection('orders', 'create')
  const canEdit = canAccessSection('orders', 'edit')
  const readOnly = !isNew && !canEdit

  useEffect(() => {
    api.listOrders().then((orders) => {
      if (isNew) {
        const nextNumber = orders.length ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : STARTING_ORDER_NUMBER
        setOrder(emptyOrder(nextNumber))
      } else {
        const found = orders.find((o) => o.id === id)
        if (found) setOrder(found)
      }
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

  const addTaxFee = () => {
    const taxFee: TaxFee = { id: crypto.randomUUID(), label: '', type: 'percent', amount: 0 }
    setOrder((o) => ({ ...o, taxesAndFees: [...o.taxesAndFees, taxFee] }))
  }

  const updateTaxFee = (taxFeeId: string, patch: Partial<TaxFee>) => {
    setOrder((o) => ({
      ...o,
      taxesAndFees: o.taxesAndFees.map((t) => (t.id === taxFeeId ? { ...t, ...patch } : t)),
    }))
  }

  const removeTaxFee = (taxFeeId: string) => {
    setOrder((o) => ({ ...o, taxesAndFees: o.taxesAndFees.filter((t) => t.id !== taxFeeId) }))
  }

  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [saving, setSaving] = useState(false)

  const onSave = async () => {
    setSaving(true)
    try {
      await api.saveOrder({ ...order, updatedAt: new Date().toISOString() })
      navigate('/orders')
    } finally {
      setSaving(false)
    }
  }

  const onGenerateInvoice = async () => {
    setGeneratingInvoice(true)
    try {
      await generateInvoicePdf(order)
    } finally {
      setGeneratingInvoice(false)
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading...</p>
  if (isNew && !canCreate) return <Navigate to="/orders" replace />

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-heading font-semibold text-navy">
        {isNew ? 'New order' : `${order.customerName} - Order #${order.orderNumber}`}
      </h1>

      {readOnly && (
        <p className="text-xs bg-amber-100 text-amber-900 rounded px-3 py-2">
          You have view-only access to this order. Ask an admin for edit permission to make changes.
        </p>
      )}

      {isNew && (
        <PastCustomerSearch
          onSelect={(c) =>
            setOrder({
              ...order,
              customerName: `${c.firstName} ${c.lastName}`.trim(),
              customerAddress: c.address,
              customerEmail: c.email,
              customerPhone: c.phone,
            })
          }
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Order number">
          <input
            type="number"
            value={order.orderNumber}
            onChange={(e) => setOrder({ ...order, orderNumber: Number(e.target.value) })}
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          />
        </Field>
        <Field label="Customer name">
          <input
            value={order.customerName}
            onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          />
        </Field>
        <Field label="Customer email">
          <input
            type="email"
            value={order.customerEmail}
            onChange={(e) => setOrder({ ...order, customerEmail: e.target.value })}
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          />
        </Field>
        <Field label="Customer phone">
          <input
            value={order.customerPhone}
            onChange={(e) => setOrder({ ...order, customerPhone: e.target.value })}
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          />
        </Field>
        <Field label="Customer address">
          <input
            value={order.customerAddress}
            onChange={(e) => setOrder({ ...order, customerAddress: e.target.value })}
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          />
        </Field>
        <Field label="Phase">
          <select
            value={order.phase}
            onChange={(e) => setOrder({ ...order, phase: e.target.value as OrderPhase })}
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          >
            {ORDER_PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Service">
          <ServiceInput value={order.serviceText} onChange={(v) => setOrder({ ...order, serviceText: v })} disabled={readOnly} />
        </Field>
        <Field label="Quoted amount ($)">
          <input
            type="number"
            value={order.quotedAmount}
            onChange={(e) => setOrder({ ...order, quotedAmount: Number(e.target.value) })}
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
          />
        </Field>
        <Field label="Consultation date">
          <input
            type="date"
            value={order.consultationDate?.slice(0, 10) ?? ''}
            onChange={(e) =>
              setOrder({ ...order, consultationDate: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
            disabled={readOnly}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
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
          {!readOnly && (
            <button onClick={addCost} type="button" className="text-sm text-neutral-500 hover:text-neutral-900">
              + Add cost
            </button>
          )}
        </div>
        {order.additionalCosts.map((c) => (
          <div key={c.id} className="flex gap-2">
            <input
              value={c.label}
              onChange={(e) => updateCost(c.id, { label: e.target.value })}
              placeholder="e.g. Third-party subscription"
              disabled={readOnly}
              className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
            />
            <input
              type="number"
              value={c.amount}
              onChange={(e) => updateCost(c.id, { amount: Number(e.target.value) })}
              disabled={readOnly}
              className="w-28 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
            />
            {!readOnly && (
              <button onClick={() => removeCost(c.id)} type="button" className="text-neutral-400 hover:text-red-600 px-2">
                x
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Taxes & fees</h2>
          {!readOnly && (
            <button onClick={addTaxFee} type="button" className="text-sm text-neutral-500 hover:text-neutral-900">
              + Add tax/fee
            </button>
          )}
        </div>
        {order.taxesAndFees.map((t) => (
          <div key={t.id} className="flex gap-2">
            <input
              value={t.label}
              onChange={(e) => updateTaxFee(t.id, { label: e.target.value })}
              placeholder="e.g. Sales tax"
              disabled={readOnly}
              className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
            />
            <select
              value={t.type}
              onChange={(e) => updateTaxFee(t.id, { type: e.target.value as 'flat' | 'percent' })}
              disabled={readOnly}
              className="rounded border border-neutral-300 bg-transparent px-2 py-2 text-sm disabled:opacity-60"
            >
              <option value="percent">%</option>
              <option value="flat">$</option>
            </select>
            <input
              type="number"
              value={t.amount}
              onChange={(e) => updateTaxFee(t.id, { amount: Number(e.target.value) })}
              disabled={readOnly}
              className="w-24 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
            />
            {!readOnly && (
              <button onClick={() => removeTaxFee(t.id)} type="button" className="text-neutral-400 hover:text-red-600 px-2">
                x
              </button>
            )}
          </div>
        ))}
      </div>

      {(isNew || canAccessSection('orders', 'notes')) && (
        <Field label="Notes">
          <textarea
            value={order.notes}
            onChange={(e) => setOrder({ ...order, notes: e.target.value })}
            rows={4}
            className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1">Internal only, not included on invoices.</p>
        </Field>
      )}

      <div className="flex gap-2">
        {!readOnly && (
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded bg-navy hover:bg-navy-dark text-white transition-colors px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save order'}
          </button>
        )}
        {!isNew && (
          <button
            onClick={onGenerateInvoice}
            disabled={generatingInvoice}
            type="button"
            className="rounded border border-navy text-navy hover:bg-navy/5 transition-colors px-4 py-2 text-sm disabled:opacity-50"
          >
            {generatingInvoice ? 'Generating...' : 'Generate invoice'}
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
