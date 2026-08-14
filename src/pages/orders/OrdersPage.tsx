import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TimeSince } from '../../components/TimeSince'
import { api } from '../../lib/apiClient'
import { ORDER_PHASES } from '../../lib/types'
import { usePageTitle } from '../../lib/usePageTitle'
import type { Order, OrderPhase } from '../../lib/types'

const PHASE_COLORS: Record<OrderPhase, string> = {
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

export function OrdersPage() {
  usePageTitle('Orders')
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceFilter, setServiceFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<OrderPhase | ''>('')
  const [days, setDays] = useState<number | ''>('')

  useEffect(() => {
    api.listOrders().then((data) => {
      setOrders(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (phaseFilter && o.phase !== phaseFilter) return false
      if (serviceFilter && !o.serviceText.toLowerCase().includes(serviceFilter.toLowerCase())) return false
      if (days && Date.now() - new Date(o.createdAt).getTime() > Number(days) * 86_400_000) return false
      return true
    })
  }, [orders, serviceFilter, phaseFilter, days])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-navy">Orders</h1>
        <Link to="/orders/new" className="rounded bg-navy hover:bg-navy-dark text-white transition-colors px-3 py-1.5 text-sm">
          New order
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          placeholder="Filter by service..."
          className="rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
        />
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value as OrderPhase | '')}
          className="rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">All phases</option>
          {ORDER_PHASES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={days}
          onChange={(e) => setDays(e.target.value ? Number(e.target.value) : '')}
          className="rounded border border-neutral-300 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">Any time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-3 py-2">Order #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Phase</th>
                <th className="px-3 py-2">Quoted</th>
                <th className="px-3 py-2">Since consultation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="border-t border-neutral-100 cursor-pointer hover:bg-cyan/5"
                >
                  <td className="px-3 py-2 text-neutral-500">{o.orderNumber}</td>
                  <td className="px-3 py-2">
                    <Link to={`/orders/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">
                      {o.customerName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{o.serviceText}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${PHASE_COLORS[o.phase]}`}>{o.phase}</span>
                  </td>
                  <td className="px-3 py-2">${o.quotedAmount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-neutral-500">
                    {o.consultationDate ? <TimeSince date={o.consultationDate} /> : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-sm text-neutral-500 p-4">No orders match these filters.</p>}
        </div>
      )}
    </div>
  )
}
