import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatBaht, toBuddhistYear } from './categories.js'
import { loadThaiFonts, registerThaiFonts } from './pdfFonts.js'
import { bahtText } from './bahtText.js'

const BAND_FILL = [224, 231, 247]

let logoBase64Cache = null
async function loadLogoBase64() {
  if (logoBase64Cache) return logoBase64Cache
  const base = import.meta.env.BASE_URL
  const buf = await fetch(`${base}logo.png`).then((r) => r.arrayBuffer())
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  logoBase64Cache = btoa(binary)
  return logoBase64Cache
}

function formatThaiFullDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d}/${m}/${toBuddhistYear(y)}`
}

function drawCompanyHeader(doc, { logo, companyProfile }, pageWidth) {
  const boxTop = 8
  const logoSize = 48
  const logoHalfGap = logoSize / 2 + 4
  const leftX = 16
  const rightX = pageWidth / 2 + logoHalfGap
  const colWidth = pageWidth / 2 - logoHalfGap - leftX

  const branch =
    companyProfile?.branchType === 'branch'
      ? `สาขาเลขที่ ${companyProfile.branchNumber || '-'}`
      : ''

  const thaiLines = [
    { text: companyProfile?.companyName || '-', bold: true },
    ...doc.splitTextToSize(companyProfile?.address || '', colWidth).map((t) => ({ text: t })),
    companyProfile?.phone ? { text: `โทร ${companyProfile.phone}` } : null,
    companyProfile?.email ? { text: `อีเมล: ${companyProfile.email}` } : null,
    branch ? { text: branch } : null,
  ].filter(Boolean)

  const enLines = [
    { text: companyProfile?.companyNameEn || '-', bold: true },
    ...doc.splitTextToSize(companyProfile?.addressEn || '', colWidth).map((t) => ({ text: t })),
    companyProfile?.phone ? { text: `TEL. ${companyProfile.phone}` } : null,
    companyProfile?.email ? { text: `E-mail: ${companyProfile.email}` } : null,
  ].filter(Boolean)

  doc.setFontSize(9)
  let y = boxTop + 6
  for (const line of thaiLines) {
    doc.setFont('Sarabun', line.bold ? 'bold' : 'normal')
    doc.text(line.text, leftX, y)
    y += 5
  }
  const leftBottom = y

  y = boxTop + 6
  for (const line of enLines) {
    doc.setFont('Sarabun', line.bold ? 'bold' : 'normal')
    doc.text(line.text, rightX, y)
    y += 5
  }
  const rightBottom = y

  const logoTopPadding = 0
  const boxBottom = Math.max(leftBottom, rightBottom, boxTop + logoTopPadding + logoSize) + 2

  if (logo) {
    doc.addImage(
      logo,
      'PNG',
      pageWidth / 2 - logoSize / 2,
      boxTop + logoTopPadding,
      logoSize,
      logoSize,
    )
  }

  doc.setDrawColor(0, 0, 0)
  doc.rect(14, boxTop, pageWidth - 28, boxBottom - boxTop)

  return boxBottom
}

function drawBand(doc, text, y, pageWidth, height = 7) {
  doc.setFillColor(...BAND_FILL)
  doc.rect(14, y, pageWidth - 28, height, 'F')
  doc.setDrawColor(0, 0, 0)
  doc.rect(14, y, pageWidth - 28, height)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(11)
  doc.text(text, pageWidth / 2, y + height / 2 + 1.5, { align: 'center' })
  return y + height
}

function drawInfoBox(doc, y, pageWidth, quotation) {
  const height = 24
  const leftX = 16
  const rightColWidth = 56
  const dividerX = pageWidth - 14 - rightColWidth
  const rightX = dividerX + 5
  doc.setDrawColor(0, 0, 0)
  doc.rect(14, y, pageWidth - 28, height)
  doc.line(dividerX, y, dividerX, y + height)

  doc.setFontSize(9)
  const rowY = y + 6
  const rows = [
    ['เรียน/Attn:', quotation.attn],
    ['ชื่อ/Name:', quotation.customerName],
    ['ที่อยู่/Address:', quotation.customerAddress],
    ['โทรศัพท์/Phone:', quotation.customerPhone],
  ]
  rows.forEach(([label, value], i) => {
    doc.setFont('Sarabun', 'bold')
    doc.text(label, leftX, rowY + i * 5)
    doc.setFont('Sarabun', 'normal')
    doc.text(value || '-', leftX + 26, rowY + i * 5)
  })

  doc.setFont('Sarabun', 'bold')
  doc.text('เลขที่/Number:', rightX, rowY)
  doc.setFont('Sarabun', 'normal')
  doc.text(quotation.number || '-', rightX + 24, rowY)

  doc.setFont('Sarabun', 'bold')
  doc.text('วันที่/Date:', rightX, rowY + 5)
  doc.setFont('Sarabun', 'normal')
  doc.text(formatThaiFullDate(quotation.date), rightX + 24, rowY + 5)

  return y + height
}

function drawItemTable(doc, startY, pageWidth, items) {
  autoTable(doc, {
    startY,
    head: [
      [
        'ลำดับ\nNo.',
        'รายละเอียด\nDescription',
        'จำนวน\nQty',
        'หน่วย\nUnit',
        'ราคา/หน่วย\nPrice/Unit',
        'ราคารวม\nAmount',
      ],
    ],
    body: items.map((it, i) => [
      String(i + 1),
      it.description,
      formatBaht(it.qty).replace(/\.00$/, ''),
      it.unit || '-',
      formatBaht(it.pricePerUnit),
      formatBaht(it.qty * it.pricePerUnit),
    ]),
    theme: 'grid',
    styles: { font: 'Sarabun', fontSize: 9, cellPadding: 2, lineWidth: 0.2, lineColor: [0, 0, 0] },
    headStyles: {
      font: 'Sarabun',
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      doc.setFont('Sarabun', 'normal')
    },
  })
  return doc.lastAutoTable.finalY
}

function drawSummary(doc, startY, pageWidth, quotation) {
  const rightWidth = 80
  const rightX = pageWidth - 14 - rightWidth

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(9)
  doc.text('กำหนดยื่นราคา', 16, startY + 8)
  doc.text(quotation.note || '-', 50, startY + 8)

  autoTable(doc, {
    startY,
    body: [
      ['รวมเงิน/Sub Total', formatBaht(quotation.subTotal)],
      ['ส่วนลด/Discount', quotation.discount ? formatBaht(quotation.discount) : ''],
      ['ราคาสุทธิ/Net Total', formatBaht(quotation.netTotal)],
      ['ภาษีมูลค่าเพิ่ม/Vat 7%', formatBaht(quotation.vat)],
      [
        { content: 'รวมสุทธิ/Grand Total', styles: { fontStyle: 'bold' } },
        { content: formatBaht(quotation.grandTotal), styles: { fontStyle: 'bold' } },
      ],
    ],
    theme: 'grid',
    styles: { font: 'Sarabun', fontSize: 9, cellPadding: 2, lineWidth: 0.2, lineColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: rightWidth - 32 },
      1: { cellWidth: 32, halign: 'right' },
    },
    margin: { left: rightX, right: 14 },
    tableWidth: rightWidth,
  })

  return Math.max(startY + 22, doc.lastAutoTable.finalY)
}

function drawSignatureBlock(doc, y, pageWidth) {
  const colWidth = (pageWidth - 28) / 2
  const leftX = 14 + colWidth / 2
  const rightX = 14 + colWidth + colWidth / 2

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(9)
  doc.text('ในนามลูกค้า', leftX, y, { align: 'center' })
  doc.text('อนุมัติให้ดำเนินงานตามใบเสนอราคา', leftX, y + 5, { align: 'center' })
  doc.text('________________________________', leftX, y + 20, { align: 'center' })
  doc.text('อนุมัติวันที่ ........../........../..........', leftX, y + 25, { align: 'center' })

  doc.text('บริษัทฯหวังเป็นอย่างยิ่งว่าจะได้รับความพิจารณาจากท่าน', rightX, y, { align: 'center' })
  doc.text('ขอแสดงความนับถือ', rightX, y + 5, { align: 'center' })
  doc.text('___________________________', rightX, y + 20, { align: 'center' })
}

export async function generateQuotationPdf(quotation, { companyProfile }) {
  const fonts = await loadThaiFonts()
  let logo = null
  try {
    logo = await loadLogoBase64()
  } catch {
    logo = null
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerThaiFonts(doc, fonts)
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = drawCompanyHeader(doc, { logo, companyProfile }, pageWidth)
  y = drawBand(doc, 'ใบเสนอราคา / QUOTATION', y, pageWidth, 8)
  y = drawInfoBox(doc, y, pageWidth, quotation)
  y = drawBand(
    doc,
    'บริษัทฯขอเรียนเสนอราคาสินค้า / งานบริการ ดังรายการต่อไปนี้',
    y,
    pageWidth,
    7,
  )

  y = drawItemTable(doc, y, pageWidth, quotation.items)
  y = drawSummary(doc, y, pageWidth, quotation)

  y += 8
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(10)
  doc.text(`( ${bahtText(quotation.grandTotal)} )`, pageWidth / 2, y, { align: 'center' })

  y += 12
  drawSignatureBlock(doc, y, pageWidth)

  doc.save(`ใบเสนอราคา ${quotation.number || ''}.pdf`)
}
