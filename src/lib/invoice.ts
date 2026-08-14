import type { Order } from './types'

const NAVY = '#193866'
const CYAN = '#1eb4e6'
const INK = '#16202e'
const MUTED = '#6b7280'

const COMPANY_NAME = 'LJ Web Management, LLC'
const COMPANY_ADDRESS = '1108 E 9th St, Lockport IL 60441'
const COMPANY_EMAIL = 'info@ljwebmanagement.com'
const COMPANY_PHONE = '+1 (877) 559-3268'
const COMPANY_SITE = 'www.ljwebmanagement.com'
const COMPANY_SITE_URL = 'https://www.ljwebmanagement.com'

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

function computeTaxFeeAmount(taxFee: Order['taxesAndFees'][number], subtotal: number): number {
  return taxFee.type === 'percent' ? subtotal * (taxFee.amount / 100) : taxFee.amount
}

export async function generateInvoicePdf(order: Order) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48

  try {
    const logo = await loadLogoDataUrl()
    doc.addImage(logo, 'PNG', margin, 40, 40, 40)
  } catch {
    // Non-fatal - invoice still generates without the logo.
  }

  doc.setTextColor(NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('LJ Web Management', margin + 50, 58)
  doc.setFontSize(10)
  doc.setTextColor(CYAN)
  doc.setFont('helvetica', 'normal')
  doc.textWithLink(COMPANY_SITE, margin + 50, 72, { url: COMPANY_SITE_URL })

  doc.setTextColor(INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('INVOICE', pageWidth - margin, 58, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED)
  doc.text(`Invoice #: ${order.orderNumber}`, pageWidth - margin, 74, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 88, { align: 'right' })

  doc.setDrawColor(CYAN)
  doc.setLineWidth(2)
  doc.line(margin, 110, pageWidth - margin, 110)

  const colWidth = (pageWidth - margin * 2) / 2
  let y = 140

  doc.setTextColor(MUTED)
  doc.setFontSize(9)
  doc.text('BILL TO', margin, y)
  doc.text('PAYABLE TO', margin + colWidth, y)
  y += 16

  doc.setTextColor(INK)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(order.customerName || 'Customer', margin, y)
  doc.text(COMPANY_NAME, margin + colWidth, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  y += 16

  const billToLines = [order.customerAddress, order.customerEmail, order.customerPhone].filter(Boolean)
  const payableToLines = [COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_PHONE]
  const lineCount = Math.max(billToLines.length, payableToLines.length)

  for (let i = 0; i < lineCount; i++) {
    if (billToLines[i]) doc.text(billToLines[i], margin, y)
    if (payableToLines[i]) doc.text(payableToLines[i], margin + colWidth, y)
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

  const lineItemRows: { label: string; amount: number }[] = [
    { label: order.serviceText || 'Service', amount: order.quotedAmount },
    ...order.additionalCosts.map((c) => ({ label: c.label || 'Additional cost', amount: c.amount })),
  ]

  for (const row of lineItemRows) {
    y += 26
    doc.setDrawColor('#e3e8ef')
    doc.line(margin, y - 10, pageWidth - margin, y - 10)
    doc.text(row.label, margin + 10, y)
    doc.text(`$${row.amount.toLocaleString()}`, pageWidth - margin - 10, y, { align: 'right' })
  }

  const subtotal = lineItemRows.reduce((sum, r) => sum + r.amount, 0)

  const taxFeeRows = order.taxesAndFees.map((t) => ({
    label: t.type === 'percent' ? `${t.label || 'Fee'} (${t.amount}%)` : t.label || 'Fee',
    amount: computeTaxFeeAmount(t, subtotal),
  }))

  for (const row of taxFeeRows) {
    y += 26
    doc.setDrawColor('#e3e8ef')
    doc.line(margin, y - 10, pageWidth - margin, y - 10)
    doc.text(row.label, margin + 10, y)
    doc.text(`$${row.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, pageWidth - margin - 10, y, {
      align: 'right',
    })
  }

  const total = subtotal + taxFeeRows.reduce((sum, r) => sum + r.amount, 0)
  y += 20
  doc.setDrawColor(NAVY)
  doc.setLineWidth(1)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(NAVY)
  doc.text('TOTAL', margin + 10, y)
  doc.text(`$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, pageWidth - margin - 10, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(
    `${new Date().getFullYear()} © ${COMPANY_NAME}. All Rights Reserved.`,
    pageWidth / 2,
    pageHeight - 30,
    { align: 'center' },
  )

  doc.save(`invoice-${order.orderNumber}.pdf`)
}
