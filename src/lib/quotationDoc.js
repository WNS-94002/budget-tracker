import { formatBaht, toBuddhistYear } from './categories.js'
import { bahtText } from './bahtText.js'

// Pure document-definition builder (no browser APIs) so the layout can be
// rendered and eyeballed from Node as well as the browser.

const BAND_FILL = '#E0E7F7'
const BORDER = '#000000'
const LINE = 0.7

const LOGO_WIDTH = 136 // pt (~48mm), matches the previous jsPDF layout

// Outer border only — the header block has no internal dividers.
const outerOnly = (skipTop = false) => ({
  hLineWidth: (i, node) => {
    if (i === 0) return skipTop ? 0 : LINE
    return i === node.table.body.length ? LINE : 0
  },
  vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length ? LINE : 0),
  hLineColor: () => BORDER,
  vLineColor: () => BORDER,
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3,
})

// Outer border plus the single divider in front of the เลขที่/วันที่ column.
const infoBoxLayout = {
  hLineWidth: (i, node) => (i === 0 ? 0 : i === node.table.body.length ? LINE : 0),
  vLineWidth: () => LINE,
  hLineColor: () => BORDER,
  vLineColor: () => BORDER,
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 4,
  paddingBottom: () => 4,
}

const gridLayout = (skipTop = false) => ({
  hLineWidth: (i) => (i === 0 && skipTop ? 0 : LINE),
  vLineWidth: () => LINE,
  hLineColor: () => BORDER,
  vLineColor: () => BORDER,
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3,
})

function formatThaiFullDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d}/${m}/${toBuddhistYear(y)}`
}

function labelValueRows(rows) {
  return {
    table: {
      widths: [72, '*'],
      body: rows.map(([label, value]) => [
        { text: label, bold: true },
        { text: value || '-' },
      ]),
    },
    layout: 'noBorders',
  }
}

function band(text, skipTop = true) {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text,
            bold: true,
            fontSize: 12,
            alignment: 'center',
            fillColor: BAND_FILL,
            margin: [0, 1, 0, 1],
          },
        ],
      ],
    },
    layout: gridLayout(skipTop),
  }
}

function companyHeader(companyProfile, logoDataUrl) {
  const branch =
    companyProfile?.branchType === 'branch'
      ? `สาขาเลขที่ ${companyProfile.branchNumber || '-'}`
      : ''

  const thaiStack = [
    { text: companyProfile?.companyName || '-', bold: true },
    { text: companyProfile?.address || '' },
    companyProfile?.phone ? { text: `โทร ${companyProfile.phone}` } : null,
    companyProfile?.email ? { text: `อีเมล: ${companyProfile.email}` } : null,
    branch ? { text: branch } : null,
  ].filter(Boolean)

  const enStack = [
    { text: companyProfile?.companyNameEn || '-', bold: true },
    { text: companyProfile?.addressEn || '' },
    companyProfile?.phone ? { text: `TEL. ${companyProfile.phone}` } : null,
    companyProfile?.email ? { text: `E-mail: ${companyProfile.email}` } : null,
  ].filter(Boolean)

  const logoCell = logoDataUrl
    ? { image: logoDataUrl, width: LOGO_WIDTH, alignment: 'center', margin: [0, -3, 0, 0] }
    : { text: '' }

  return {
    table: {
      widths: ['*', LOGO_WIDTH, '*'],
      body: [
        [
          { stack: thaiStack, lineHeight: 1.25 },
          logoCell,
          { stack: enStack, lineHeight: 1.25 },
        ],
      ],
    },
    layout: outerOnly(),
  }
}

function itemsTable(items) {
  const head = [
    { text: 'ลำดับ\nNo.', bold: true, alignment: 'center' },
    { text: 'รายละเอียด\nDescription', bold: true, alignment: 'center' },
    { text: 'จำนวน\nQty', bold: true, alignment: 'center' },
    { text: 'หน่วย\nUnit', bold: true, alignment: 'center' },
    { text: 'ราคา/หน่วย\nPrice/Unit', bold: true, alignment: 'center' },
    { text: 'ราคารวม\nAmount', bold: true, alignment: 'center' },
  ]

  const body = items.map((it, i) => [
    { text: String(i + 1), alignment: 'center' },
    { text: it.description },
    { text: formatBaht(it.qty).replace(/\.00$/, ''), alignment: 'center' },
    { text: it.unit || '-', alignment: 'center' },
    { text: formatBaht(it.pricePerUnit), alignment: 'right' },
    { text: formatBaht(it.qty * it.pricePerUnit), alignment: 'right' },
  ])

  return {
    table: {
      headerRows: 1,
      widths: [30, '*', 42, 42, 72, 72],
      body: [head, ...body],
    },
    layout: gridLayout(true),
  }
}

function summarySection(quotation) {
  const summaryRow = (label, value, bold = false) => [
    { text: label, bold },
    { text: value, alignment: 'right', bold },
  ]

  return {
    columns: [
      {
        width: '*',
        margin: [2, 6, 0, 0],
        columns: [
          { width: 70, text: 'กำหนดยื่นราคา' },
          { width: '*', text: quotation.note || '-' },
        ],
      },
      {
        width: 227,
        table: {
          widths: ['*', 82],
          body: [
            summaryRow('รวมเงิน/Sub Total', formatBaht(quotation.subTotal)),
            summaryRow(
              'ส่วนลด/Discount',
              quotation.discount ? formatBaht(quotation.discount) : '',
            ),
            summaryRow('ราคาสุทธิ/Net Total', formatBaht(quotation.netTotal)),
            summaryRow('ภาษีมูลค่าเพิ่ม/Vat 7%', formatBaht(quotation.vat)),
            summaryRow('รวมสุทธิ/Grand Total', formatBaht(quotation.grandTotal), true),
          ],
        },
        layout: gridLayout(true),
      },
    ],
  }
}

function signatureBlock() {
  const col = (lines) => ({
    width: '*',
    stack: lines.map((text) => ({ text, alignment: 'center' })),
  })

  return {
    margin: [0, 18, 0, 0],
    columns: [
      col([
        'ในนามลูกค้า',
        'อนุมัติให้ดำเนินงานตามใบเสนอราคา',
        { text: '', margin: [0, 14] },
        '________________________________',
        'อนุมัติวันที่ ........../........../..........',
      ]),
      col([
        'บริษัทฯหวังเป็นอย่างยิ่งว่าจะได้รับความพิจารณาจากท่าน',
        'ขอแสดงความนับถือ',
        { text: '', margin: [0, 14] },
        '___________________________',
      ]),
    ],
  }
}

export function buildQuotationDoc({ quotation, companyProfile, logoDataUrl }) {
  return {
    pageSize: 'A4',
    pageMargins: [40, 28, 40, 28],
    content: [
      companyHeader(companyProfile, logoDataUrl),
      band('ใบเสนอราคา / QUOTATION'),
      {
        table: {
          widths: ['*', 159],
          body: [
            [
              labelValueRows([
                ['เรียน/Attn:', quotation.attn],
                ['ชื่อ/Name:', quotation.customerName],
                ['ที่อยู่/Address:', quotation.customerAddress],
                ['โทรศัพท์/Phone:', quotation.customerPhone],
              ]),
              labelValueRows([
                ['เลขที่/Number:', quotation.number],
                ['วันที่/Date:', formatThaiFullDate(quotation.date)],
              ]),
            ],
          ],
        },
        layout: infoBoxLayout,
      },
      band('บริษัทฯขอเรียนเสนอราคาสินค้า / งานบริการ ดังรายการต่อไปนี้'),
      itemsTable(quotation.items),
      summarySection(quotation),
      {
        text: `( ${bahtText(quotation.grandTotal)} )`,
        alignment: 'center',
        margin: [0, 14, 0, 0],
        fontSize: 10,
      },
      signatureBlock(),
    ],
  }
}
