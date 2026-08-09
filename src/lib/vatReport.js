import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { THAI_MONTHS, formatBaht, toBuddhistYear } from './categories.js'
import { loadThaiFonts, registerThaiFonts } from './pdfFonts.js'
import { computeVatSummary } from './vatSummary.js'

const THAI_MONTHS_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const TARGET_ROW_COUNT = 25 // pads the grid down to fill roughly one A4 page, like the reference template

function formatThaiShortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const shortYear = String(toBuddhistYear(y)).slice(-2)
  return `${d} ${THAI_MONTHS_ABBR[m - 1]} ${shortYear}`
}

function branchLine(companyProfile) {
  if (companyProfile?.branchType === 'branch') {
    return `(x) สาขาเลขที่ ${companyProfile.branchNumber || '-'}`
  }
  return '(x) สำนักงานใหญ่'
}

function drawHeaderBlock(doc, { title, periodLabel, companyProfile }) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(16)
  doc.text(title, pageWidth / 2, 15, { align: 'center' })

  const labelX = 14
  const valueX = 55
  let y = 24
  doc.setFontSize(10)

  doc.setFont('Sarabun', 'normal')
  doc.text('เดือน/ปีภาษี', labelX, y)
  doc.text(periodLabel, valueX, y)
  y += 6

  doc.text('ผู้ประกอบการ', labelX, y)
  doc.text(companyProfile?.companyName || '-', valueX, y)
  y += 6

  doc.text('ชื่อสถานประกอบการ', labelX, y)
  doc.text(companyProfile?.companyName || '-', valueX, y)
  y += 6

  doc.text('ที่อยู่', labelX, y)
  const addressWidth = pageWidth - valueX - 55
  const addressLines = doc.splitTextToSize(companyProfile?.address || '-', addressWidth)
  doc.text(addressLines, valueX, y)
  doc.text(branchLine(companyProfile), pageWidth - 14, y, { align: 'right' })
  y += addressLines.length * 5
  y += 1

  doc.text('เลขประจำตัวผู้เสียภาษีอากร', labelX, y)
  doc.text(companyProfile?.taxId || '-', valueX, y)
  y += 8

  return y
}

function drawVatTable(doc, startY, items, counterpartyHeader) {
  const head = [
    [
      { content: 'ลำดับ', rowSpan: 2 },
      { content: 'ใบกำกับภาษี', colSpan: 2 },
      { content: counterpartyHeader, rowSpan: 2 },
      { content: 'มูลค่าสินค้าหรือบริการ', rowSpan: 2 },
      { content: 'ภาษีมูลค่าเพิ่ม', rowSpan: 2 },
    ],
    [{ content: 'วัน/เดือน/ปี' }, { content: 'เลขที่' }],
  ]

  const dataRows = items.map((t, i) => [
    String(i + 1),
    formatThaiShortDate(t.date),
    t.vatInvoiceNumber || '-',
    t.vatCounterpartyName || '-',
    formatBaht(t.vatBase ?? 0),
    formatBaht(t.vatAmount ?? 0),
  ])

  const blankRowsNeeded = Math.max(TARGET_ROW_COUNT - dataRows.length, 0)
  const blankRows = Array.from({ length: blankRowsNeeded }, () => ['', '', '', '', '', ''])

  const totalBase = items.reduce((s, t) => s + Number(t.vatBase || 0), 0)
  const totalVat = items.reduce((s, t) => s + Number(t.vatAmount || 0), 0)
  const totalRow = [
    { content: 'รวม', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatBaht(totalBase), styles: { fontStyle: 'bold' } },
    { content: formatBaht(totalVat), styles: { fontStyle: 'bold' } },
  ]

  autoTable(doc, {
    startY,
    head,
    body: [...dataRows, ...blankRows, totalRow],
    theme: 'grid',
    styles: { font: 'Sarabun', fontSize: 9, cellPadding: 1.5, minCellHeight: 6.5, valign: 'middle' },
    headStyles: {
      font: 'Sarabun',
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: 'center',
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
    },
    bodyStyles: { lineWidth: 0.2, lineColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 11, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 36, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
    },
    didDrawPage: () => {
      doc.setFont('Sarabun', 'normal')
    },
  })

  return { totalBase, totalVat }
}

function drawReportPage(doc, { title, items, counterpartyHeader, periodLabel, companyProfile }) {
  const startY = drawHeaderBlock(doc, { title, periodLabel, companyProfile })
  drawVatTable(doc, startY, items, counterpartyHeader)
}

export async function generateVatReport(transactions, { year, month, companyProfile }) {
  const periodLabel = `${THAI_MONTHS[month - 1]} ${toBuddhistYear(year)}`
  const monthName = THAI_MONTHS[month - 1]

  const { salesItems, purchaseItems } = computeVatSummary(transactions, { year, month })

  const fonts = await loadThaiFonts()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerThaiFonts(doc, fonts)

  drawReportPage(doc, {
    title: 'รายการภาษีขาย',
    items: salesItems,
    counterpartyHeader: 'ชื่อผู้ซื้อสินค้า/ผู้รับบริการ',
    periodLabel,
    companyProfile,
  })

  doc.addPage()
  drawReportPage(doc, {
    title: 'รายการภาษีซื้อ',
    items: purchaseItems,
    counterpartyHeader: 'ชื่อผู้ขายสินค้า/ผู้ให้บริการ',
    periodLabel,
    companyProfile,
  })

  doc.save(`รายงานภาษีซื้อ-ขาย ประจำเดือน ${monthName} ${toBuddhistYear(year)}.pdf`)
}
