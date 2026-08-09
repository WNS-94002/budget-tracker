import { THAI_MONTHS, formatBaht, toBuddhistYear } from './categories.js'

const INCOME_COLOR = '#16A34A'
const EXPENSE_COLOR = '#DC2626'
const HEAD_FILL = '#0F172A'

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
  if (mode === 'month') return `${THAI_MONTHS[month - 1]} พ.ศ. ${buddhistYear}`
  return `ปี พ.ศ. ${buddhistYear}`
}

export function buildIncomeExpenseDoc({ transactions, mode, year, month, companyProfile }) {
  const items = filterByPeriod(transactions, { mode, year, month }).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )

  const income = items
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const expense = items
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const balance = income - expense

  const companyLine = [
    companyProfile?.companyName,
    companyProfile?.taxId ? `เลขผู้เสียภาษี ${companyProfile.taxId}` : null,
  ]
    .filter(Boolean)
    .join('   |   ')

  const head = [
    'วันที่',
    'ประเภท',
    'หมวดหมู่',
    'รายละเอียด',
    'จำนวนเงิน (บาท)',
  ].map((text, i) => ({
    text,
    bold: true,
    color: '#FFFFFF',
    fillColor: HEAD_FILL,
    alignment: i === 4 ? 'right' : 'left',
  }))

  const body = items.map((t) => [
    { text: t.date },
    { text: t.type === 'income' ? 'รายรับ' : 'รายจ่าย' },
    { text: t.category || '-' },
    { text: t.note || '-' },
    {
      text: (t.type === 'income' ? '+' : '-') + formatBaht(t.amount),
      alignment: 'right',
      color: t.type === 'income' ? INCOME_COLOR : EXPENSE_COLOR,
    },
  ])

  const content = [
    { text: 'รายงานรายรับ-รายจ่าย', bold: true, fontSize: 15, alignment: 'center' },
    {
      text: periodLabel({ mode, year, month }),
      fontSize: 11,
      alignment: 'center',
      margin: [0, 3, 0, 0],
    },
  ]

  if (companyLine) {
    content.push({ text: companyLine, alignment: 'center', margin: [0, 3, 0, 0] })
  }

  content.push(
    {
      text: `รายรับรวม: ${formatBaht(income)} บาท`,
      color: INCOME_COLOR,
      fontSize: 11,
      margin: [0, 10, 0, 0],
    },
    { text: `รายจ่ายรวม: ${formatBaht(expense)} บาท`, color: EXPENSE_COLOR, fontSize: 11 },
    {
      text: `คงเหลือ: ${formatBaht(balance)} บาท`,
      color: balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR,
      fontSize: 11,
    },
  )

  if (items.length === 0) {
    content.push({ text: 'ไม่มีรายการในช่วงเวลานี้', margin: [0, 12, 0, 0] })
  } else {
    content.push({
      margin: [0, 10, 0, 0],
      table: {
        headerRows: 1,
        widths: ['auto', 'auto', 'auto', '*', 'auto'],
        body: [head, ...body],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#CBD5E1',
        vLineColor: () => '#CBD5E1',
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    })
  }

  content.push({
    text: `สร้างรายงานเมื่อ ${new Date().toLocaleString('th-TH')}`,
    fontSize: 8,
    color: '#646464',
    margin: [0, 12, 0, 0],
  })

  return {
    pageSize: 'A4',
    pageMargins: [40, 30, 40, 30],
    defaultStyle: { font: 'Sarabun', fontSize: 10 },
    content,
  }
}
