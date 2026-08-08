import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { THAI_MONTHS, formatBaht, toBuddhistYear } from './categories.js'
import { loadThaiFonts, registerThaiFonts } from './pdfFonts.js'

function filterVatItems(transactions, { year, month }) {
  return transactions
    .filter((t) => {
      if (!t.hasVat) return false
      const [y, m] = t.date.split('-').map(Number)
      return y === year && m === month
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

function branchLabel(companyProfile) {
  if (!companyProfile) return ''
  if (companyProfile.branchType === 'branch') {
    return `สาขาเลขที่ ${companyProfile.branchNumber || '-'}`
  }
  return 'สำนักงานใหญ่'
}

function drawCompanyHeader(doc, companyProfile, pageWidth, startY) {
  if (!companyProfile?.companyName && !companyProfile?.taxId) return startY
  let y = startY
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(11)
  if (companyProfile.companyName) {
    doc.text(companyProfile.companyName, pageWidth / 2, y, { align: 'center' })
    y += 5
  }
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(9)
  const line2 = [
    companyProfile.taxId ? `เลขประจำตัวผู้เสียภาษีอากร ${companyProfile.taxId}` : null,
    branchLabel(companyProfile),
  ]
    .filter(Boolean)
    .join('   |   ')
  if (line2) {
    doc.text(line2, pageWidth / 2, y, { align: 'center' })
    y += 5
  }
  if (companyProfile.address) {
    const split = doc.splitTextToSize(companyProfile.address, pageWidth - 40)
    doc.text(split, pageWidth / 2, y, { align: 'center' })
    y += split.length * 4
  }
  return y + 3
}

function vatTable(doc, startY, items, { includeNote }) {
  const head = includeNote
    ? [['ลำดับ', 'วันที่', 'เลขที่ใบกำกับภาษี', 'ชื่อคู่ค้า', 'เลขผู้เสียภาษีคู่ค้า', 'มูลค่าก่อนภาษี', 'VAT', 'หมายเหตุ']]
    : [['ลำดับ', 'วันที่', 'เลขที่ใบกำกับภาษี', 'ชื่อคู่ค้า', 'เลขผู้เสียภาษีคู่ค้า', 'มูลค่าก่อนภาษี', 'VAT']]

  const body = items.map((t, i) => {
    const row = [
      String(i + 1),
      t.date,
      t.vatInvoiceNumber || '-',
      t.vatCounterpartyName || '-',
      t.vatTaxId || '-',
      formatBaht(t.vatBase ?? 0),
      formatBaht(t.vatAmount ?? 0),
    ]
    if (includeNote) row.push(t.vatCreditBlocked ? 'ภาษีซื้อต้องห้าม' : '')
    return row
  })

  autoTable(doc, {
    startY,
    head,
    body,
    styles: { font: 'Sarabun', fontSize: 9, cellPadding: 2 },
    headStyles: { font: 'Sarabun', fontStyle: 'bold', fillColor: [15, 23, 42] },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    didDrawPage: () => {
      doc.setFont('Sarabun', 'normal')
    },
  })

  return doc.lastAutoTable.finalY
}

export async function generateVatReport(transactions, { year, month, companyProfile }) {
  const fonts = await loadThaiFonts()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  registerThaiFonts(doc, fonts)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const periodLabel = `${THAI_MONTHS[month - 1]} พ.ศ. ${toBuddhistYear(year)}`

  const items = filterVatItems(transactions, { year, month })
  const salesItems = items.filter((t) => t.type === 'income')
  const purchaseItems = items.filter(
    (t) => t.type === 'expense' && t.vatInvoiceType === 'full',
  )
  const abbreviatedExpenseItems = items.filter(
    (t) => t.type === 'expense' && t.vatInvoiceType !== 'full',
  )

  const outputVatTotal = salesItems.reduce((s, t) => s + Number(t.vatAmount || 0), 0)
  const inputVatTotal = purchaseItems.reduce((s, t) => s + Number(t.vatAmount || 0), 0)
  const inputVatCreditable = purchaseItems
    .filter((t) => !t.vatCreditBlocked)
    .reduce((s, t) => s + Number(t.vatAmount || 0), 0)
  const netVat = outputVatTotal - inputVatCreditable

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(16)
  doc.text('รายงานภาษีซื้อ-ภาษีขาย', pageWidth / 2, 15, { align: 'center' })
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(12)
  doc.text(periodLabel, pageWidth / 2, 22, { align: 'center' })

  let y = drawCompanyHeader(doc, companyProfile, pageWidth, 29)
  y = Math.max(y, 32)

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(12)
  doc.text('รายงานภาษีขาย (Output VAT)', 14, y)
  y += 4

  if (salesItems.length > 0) {
    y = vatTable(doc, y, salesItems, { includeNote: false }) + 10
  } else {
    doc.setFont('Sarabun', 'normal')
    doc.setFontSize(10)
    doc.text('ไม่มีรายการภาษีขายในเดือนนี้', 14, y + 4)
    y += 14
  }

  if (y > pageHeight - 60) {
    doc.addPage()
    doc.setFont('Sarabun', 'normal')
    y = 20
  }

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(12)
  doc.text('รายงานภาษีซื้อ (Input VAT)', 14, y)
  y += 4

  if (purchaseItems.length > 0) {
    y = vatTable(doc, y, purchaseItems, { includeNote: true }) + 8
  } else {
    doc.setFont('Sarabun', 'normal')
    doc.setFontSize(10)
    doc.text('ไม่มีรายการภาษีซื้อ (ใบกำกับภาษีเต็มรูป) ในเดือนนี้', 14, y + 4)
    y += 14
  }

  if (abbreviatedExpenseItems.length > 0) {
    const sum = abbreviatedExpenseItems.reduce((s, t) => s + Number(t.vatAmount || 0), 0)
    doc.setFont('Sarabun', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 53, 15)
    const note = `หมายเหตุ: มีรายจ่ายที่มี VAT แต่เป็นใบกำกับภาษีอย่างย่อ ${abbreviatedExpenseItems.length} รายการ (รวม VAT ${formatBaht(sum)} บาท) — เครดิตภาษีซื้อไม่ได้ตามกฎหมาย จึงไม่รวมในรายงานภาษีซื้อด้านบน`
    const split = doc.splitTextToSize(note, pageWidth - 28)
    doc.text(split, 14, y)
    doc.setTextColor(0, 0, 0)
    y += split.length * 4 + 6
  }

  if (y > pageHeight - 40) {
    doc.addPage()
    doc.setFont('Sarabun', 'normal')
    y = 20
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, pageWidth - 14, y)
  y += 8

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(12)
  doc.text('สรุป', 14, y)
  y += 7

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(11)
  doc.text(`ภาษีขายรวม: ${formatBaht(outputVatTotal)} บาท`, 14, y)
  y += 6
  doc.text(`ภาษีซื้อรวม (ใบกำกับภาษีเต็มรูปทั้งหมด): ${formatBaht(inputVatTotal)} บาท`, 14, y)
  y += 6
  doc.text(`ภาษีซื้อที่เครดิตได้: ${formatBaht(inputVatCreditable)} บาท`, 14, y)
  y += 8

  doc.setFont('Sarabun', 'bold')
  doc.setTextColor(netVat >= 0 ? 220 : 22, netVat >= 0 ? 38 : 163, netVat >= 0 ? 38 : 74)
  doc.text(
    netVat >= 0
      ? `ภาษีที่ต้องชำระ: ${formatBaht(netVat)} บาท`
      : `ภาษีที่ขอคืนได้: ${formatBaht(Math.abs(netVat))} บาท`,
    14,
    y,
  )
  doc.setTextColor(0, 0, 0)
  y += 10

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(
    'รายงานนี้จัดทำจากข้อมูลที่ผู้ใช้บันทึกเองในแอป ใช้เป็นข้อมูลประกอบการยื่น ภ.พ.30 เบื้องต้นเท่านั้น ควรตรวจสอบกับใบกำกับภาษีจริงก่อนยื่นแบบ',
    14,
    Math.min(y, pageHeight - 10),
  )

  doc.save(`ภาษีซื้อ-ขาย-${year}-${String(month).padStart(2, '0')}.pdf`)
}
