import { THAI_MONTHS, formatBaht, toBuddhistYear } from './categories.js'
import { computeVatSummary } from './vatSummary.js'

const BORDER = '#000000'
const LINE = 0.7

const THAI_MONTHS_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

// Pads the grid out so the printed form keeps its full-page ruled look,
// matching the accountant's existing monthly template.
const TARGET_ROW_COUNT = 25

const gridLayout = {
  hLineWidth: () => LINE,
  vLineWidth: () => LINE,
  hLineColor: () => BORDER,
  vLineColor: () => BORDER,
  paddingLeft: () => 3,
  paddingRight: () => 3,
  paddingTop: () => 2.5,
  paddingBottom: () => 2.5,
}

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

function headerBlock({ title, periodLabel, companyProfile }) {
  const row = (label, value, extra) => ({
    columns: [
      { width: 110, text: label },
      { width: '*', text: value || '-' },
      ...(extra ? [{ width: 'auto', text: extra }] : []),
    ],
    margin: [0, 0, 0, 3],
  })

  return [
    { text: title, bold: true, fontSize: 15, alignment: 'center', margin: [0, 0, 0, 4] },
    row('เดือน/ปีภาษี', periodLabel),
    row('ผู้ประกอบการ', companyProfile?.companyName),
    row('ชื่อสถานประกอบการ', companyProfile?.companyName),
    row('ที่อยู่', companyProfile?.address, branchLine(companyProfile)),
    row('เลขประจำตัวผู้เสียภาษีอากร', companyProfile?.taxId),
  ]
}

function vatTable(items, counterpartyHeader) {
  const head1 = [
    { text: 'ลำดับ', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
    { text: 'ใบกำกับภาษี', colSpan: 2, bold: true, alignment: 'center' },
    {},
    { text: counterpartyHeader, rowSpan: 2, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
    { text: 'มูลค่าสินค้าหรือบริการ', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
    { text: 'ภาษีมูลค่าเพิ่ม', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
  ]
  const head2 = [
    {},
    { text: 'วัน/เดือน/ปี', bold: true, alignment: 'center' },
    { text: 'เลขที่', bold: true, alignment: 'center' },
    {},
    {},
    {},
  ]

  const dataRows = items.map((t, i) => [
    { text: String(i + 1), alignment: 'center' },
    { text: formatThaiShortDate(t.date), alignment: 'center' },
    { text: t.vatInvoiceNumber || '-', alignment: 'center' },
    { text: t.vatCounterpartyName || '-' },
    { text: formatBaht(t.vatBase ?? 0), alignment: 'right' },
    { text: formatBaht(t.vatAmount ?? 0), alignment: 'right' },
  ])

  const blanks = Array.from(
    { length: Math.max(TARGET_ROW_COUNT - dataRows.length, 0) },
    () => ['', '', '', '', '', ''],
  )

  const totalBase = items.reduce((s, t) => s + Number(t.vatBase || 0), 0)
  const totalVat = items.reduce((s, t) => s + Number(t.vatAmount || 0), 0)
  const totalRow = [
    { text: 'รวม', colSpan: 4, alignment: 'right', bold: true },
    {},
    {},
    {},
    { text: formatBaht(totalBase), alignment: 'right', bold: true },
    { text: formatBaht(totalVat), alignment: 'right', bold: true },
  ]

  return {
    table: {
      headerRows: 2,
      widths: [28, 52, 60, '*', 92, 62],
      body: [head1, head2, ...dataRows, ...blanks, totalRow],
    },
    layout: gridLayout,
  }
}

function reportPage({ title, items, counterpartyHeader, periodLabel, companyProfile }) {
  return [
    ...headerBlock({ title, periodLabel, companyProfile }),
    { text: '', margin: [0, 2] },
    vatTable(items, counterpartyHeader),
  ]
}

export function buildVatDoc({ transactions, year, month, companyProfile }) {
  const { salesItems, purchaseItems } = computeVatSummary(transactions, { year, month })
  const periodLabel = `${THAI_MONTHS[month - 1]} ${toBuddhistYear(year)}`

  const salesPage = reportPage({
    title: 'รายการภาษีขาย',
    items: salesItems,
    counterpartyHeader: 'ชื่อผู้ซื้อสินค้า/ผู้รับบริการ',
    periodLabel,
    companyProfile,
  })

  const purchasePage = reportPage({
    title: 'รายการภาษีซื้อ',
    items: purchaseItems,
    counterpartyHeader: 'ชื่อผู้ขายสินค้า/ผู้ให้บริการ',
    periodLabel,
    companyProfile,
  })

  // Page break between the sales sheet and the purchase sheet.
  purchasePage[0] = { ...purchasePage[0], pageBreak: 'before' }

  return {
    pageSize: 'A4',
    pageMargins: [36, 28, 36, 28],
    content: [...salesPage, ...purchasePage],
  }
}
