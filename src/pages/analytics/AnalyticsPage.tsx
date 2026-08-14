import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../../lib/apiClient'
import { ORDER_PHASES } from '../../lib/types'
import { usePageTitle } from '../../lib/usePageTitle'
import type { Order } from '../../lib/types'

const COLORS = ['#193866', '#1eb4e6', '#254a81', '#68ddff', '#0f2544', '#4b5563', '#8fb8e0', '#a8e6f7', '#6b7280']

// Case-insensitive, whitespace-trimmed grouping - mirrors the Postgres
// LOWER(TRIM(service_text)) grouping the real analytics endpoints use.
function normalizeService(text: string) {
  return text.trim().toLowerCase()
}

function mostCommonCasing(orders: Order[], normalized: string) {
  const counts = new Map<string, number>()
  for (const o of orders) {
    if (normalizeService(o.serviceText) === normalized) {
      counts.set(o.serviceText, (counts.get(o.serviceText) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? normalized
}

export function AnalyticsPage() {
  usePageTitle('Analytics')
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    api.listOrders().then(setOrders)
  }, [])

  const revenueByService = useMemo(() => {
    const totals = new Map<string, number>()
    for (const o of orders) {
      const key = normalizeService(o.serviceText)
      const total = o.quotedAmount + o.additionalCosts.reduce((s, c) => s + c.amount, 0)
      totals.set(key, (totals.get(key) ?? 0) + total)
    }
    return [...totals.entries()]
      .map(([norm, revenue]) => ({ name: mostCommonCasing(orders, norm), revenue }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [orders])

  const orderCountByService = useMemo(() => {
    const counts = new Map<string, number>()
    for (const o of orders) {
      const key = normalizeService(o.serviceText)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].map(([norm, count]) => ({ name: mostCommonCasing(orders, norm), count }))
  }, [orders])

  const phaseDistribution = useMemo(() => {
    return ORDER_PHASES.map((phase) => ({
      phase,
      count: orders.filter((o) => o.phase === phase).length,
    }))
  }, [orders])

  const revenueOverTime = useMemo(() => {
    const byMonth = new Map<string, number>()
    for (const o of orders) {
      const month = o.createdAt.slice(0, 7)
      const total = o.quotedAmount + o.additionalCosts.reduce((s, c) => s + c.amount, 0)
      byMonth.set(month, (byMonth.get(month) ?? 0) + total)
    }
    return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, revenue]) => ({ month, revenue }))
  }, [orders])

  const totalRevenue = orders.reduce((s, o) => s + o.quotedAmount + o.additionalCosts.reduce((a, c) => a + c.amount, 0), 0)
  const avgQuote = orders.length ? totalRevenue / orders.length : 0
  const completedOrDone = orders.filter((o) => o.phase === 'Finalized (Done)').length

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-heading font-semibold text-navy">Analytics</h1>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Total revenue" value={`$${totalRevenue.toLocaleString()}`} />
        <Stat label="Orders" value={orders.length.toString()} />
        <Stat label="Avg. order value" value={`$${avgQuote.toFixed(0)}`} />
        <Stat label="Finalized orders" value={completedOrDone.toString()} />
      </div>

      <ChartCard title="Revenue over time">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revenueOverTime}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#193866" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="Revenue by service (normalized)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByService} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="name" width={120} fontSize={12} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#1eb4e6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order count by service (normalized)">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={orderCountByService} dataKey="count" nameKey="name" outerRadius={90} label>
                {orderCountByService.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Phase distribution across active orders">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={phaseDistribution}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="phase" fontSize={10} angle={-20} textAnchor="end" interval={0} height={80} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#254a81" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold mb-2">{title}</h2>
      {children}
    </div>
  )
}
