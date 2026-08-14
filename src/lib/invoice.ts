import type { Order } from './types'

const NAVY = '#193866'
const CYAN = '#1eb4e6'
const INK = '#16202e'
const MUTED = '#6b7280'

async function loadLogoDataUrl(): Promise<string> {
  const res = await fetch(`${import.meta.env.BASE_URL}lj-logo.png`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function generateInvoicePdf(order: Order) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 48

  try {
    const logo = await loadLogoDataUrl()
    doc.addImage(logo, 'PNG', margin, 40, 40, 40)
  } catch {
    // Non-fatal — invoice still generates without the logo.
  }

  doc.setTextColor(NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('LJ Web Management', margin + 50, 58)
  doc.setFontSize(10)
  doc.setTextColor(MUTED)
  doc.setFont('helvetica', 'normal')
  doc.text('admin.ljwebmanagement.com', margin + 50, 72)

  doc.setTextColor(INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('INVOICE', pageWidth - margin, 58, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED)
  doc.text(`Invoice #: ${order.id}`, pageWidth - margin, 74, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 88, { align: 'right' })

  doc.setDrawColor(CYAN)
  doc.setLineWidth(2)
  doc.line(margin, 110, pageWidth - margin, 110)

  let y = 140
  doc.setTextColor(MUTED)
  doc.setFontSize(9)
  doc.text('BILL TO', margin, y)
  y += 16
  doc.setTextColor(INK)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(order.customerName || 'Customer', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  y += 16
  if (order.customerEmail) {
    doc.text(order.customerEmail, margin, y)
    y += 14
  }
  if (order.customerPhone) {
    doc.text(order.customerPhone, margin, y)
    y += 14
  }

  y += 20
  doc.setFillColor(NAVY)
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F')
  doc.setTextColor('#ffffff')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPTION', margin + 10, y + 16)
  doc.text('AMOUNT', pageWidth - margin - 10, y + 16, { align: 'right' })
  y += 24

  doc.setTextColor(INK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const rows: { label: string; amount: number }[] = [
    { label: order.serviceText || 'Service', amount: order.quotedAmount },
    ...order.additionalCosts.map((c) => ({ label: c.label || 'Additional cost', amount: c.amount })),
  ]

  for (const row of rows) {
    y += 26
    doc.setDrawColor('#e3e8ef')
    doc.line(margin, y - 10, pageWidth - margin, y - 10)
    doc.text(row.label, margin + 10, y)
    doc.text(`$${row.amount.toLocaleString()}`, pageWidth - margin - 10, y, { align: 'right' })
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  y += 20
  doc.setDrawColor(NAVY)
  doc.setLineWidth(1)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(NAVY)
  doc.text('TOTAL', margin + 10, y)
  doc.text(`$${total.toLocaleString()}`, pageWidth - margin - 10, y, { align: 'right' })

  if (order.notes) {
    y += 50
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(MUTED)
    doc.text('NOTES', margin, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(INK)
    const wrapped = doc.splitTextToSize(order.notes, pageWidth - margin * 2)
    doc.text(wrapped, margin, y)
  }

  doc.save(`invoice-${order.id}.pdf`)
}
