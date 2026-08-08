import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { THAI_MONTHS, formatBaht, toBuddhistYear } from './categories.js'
import { loadThaiFonts, registerThaiFonts } from './pdfFonts.js'

function filterByPeriod(transactions, { mode, year, month }) {
  return transactions.filter((t) => {
    const [y, m] = t.date.split('-').map(Number)
    if (y !== year) return false
    if (mode === 'month' && m !== month) return false
    return true
  })
}

function periodLabel({ mode, year, month }) {
  const buddhistYear = toBuddhistYear(year)
  if (mode === 'month') {
    return `${THAI_MONTHS[month - 1]} พ.ศ. ${buddhistYear}`
  }
  return `ปี พ.ศ. ${buddhistYear}`
}

export async function generatePdfReport(transactions, { mode, year, month, companyProfile }) {
  const fonts = await loadThaiFonts()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerThaiFonts(doc, fonts)

  const items = filterByPeriod(transactions, { mode, year, month }).sort(
    (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0),
  )

  const income = items
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const expense = items
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const balance = income - expense

  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(16)
  doc.text('รายงานรายรับ-รายจ่าย', pageWidth / 2, 15, { align: 'center' })

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(12)
  doc.text(periodLabel({ mode, year, month }), pageWidth / 2, 22, {
    align: 'center',
  })

  let headerBottom = 22
  if (companyProfile?.companyName || companyProfile?.taxId) {
    doc.setFontSize(9)
    const line = [companyProfile.companyName, companyProfile.taxId ? `เลขผู้เสียภาษี ${companyProfile.taxId}` : null]
      .filter(Boolean)
      .join('   |   ')
    doc.text(line, pageWidth / 2, headerBottom + 6, { align: 'center' })
    headerBottom += 6
  }

  doc.setFontSize(11)
  const summaryY = headerBottom + 8
  doc.setTextColor(22, 163, 74)
  doc.text(`รายรับรวม: ${formatBaht(income)} บาท`, 14, summaryY)
  doc.setTextColor(220, 38, 38)
  doc.text(`รายจ่ายรวม: ${formatBaht(expense)} บาท`, 14, summaryY + 6)
  doc.setTextColor(balance >= 0 ? 22 : 220, balance >= 0 ? 163 : 38, balance >= 0 ? 74 : 38)
  doc.text(`คงเหลือ: ${formatBaht(balance)} บาท`, 14, summaryY + 12)
  doc.setTextColor(0, 0, 0)

  const body = items.map((t) => [
    t.date,
    t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    t.category || '-',
    t.note || '-',
    (t.type === 'income' ? '+' : '-') + formatBaht(t.amount),
  ])

  autoTable(doc, {
    startY: summaryY + 18,
    head: [['วันที่', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (บาท)']],
    body,
    styles: { font: 'Sarabun', fontSize: 10, cellPadding: 2.2 },
    headStyles: { font: 'Sarabun', fontStyle: 'bold', fillColor: [15, 23, 42] },
    columnStyles: {
      4: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const rowItem = items[data.row.index]
        data.cell.styles.textColor =
          rowItem?.type === 'income' ? [22, 163, 74] : [220, 38, 38]
      }
    },
    didDrawPage: () => {
      doc.setFont('Sarabun', 'normal')
    },
  })

  if (items.length === 0) {
    doc.setFontSize(11)
    doc.text('ไม่มีรายการในช่วงเวลานี้', 14, summaryY + 24)
  }

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : summaryY + 18
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `สร้างรายงานเมื่อ ${new Date().toLocaleString('th-TH')}`,
    14,
    Math.min(finalY + 10, doc.internal.pageSize.getHeight() - 10),
  )

  const filenameSuffix =
    mode === 'month'
      ? `${year}-${String(month).padStart(2, '0')}`
      : `${year}`
  doc.save(`รายงาน-${filenameSuffix}.pdf`)
}
