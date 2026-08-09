import { downloadPdf } from './pdfMakeSetup.js'
import { buildVatDoc } from './vatDoc.js'
import { THAI_MONTHS, toBuddhistYear } from './categories.js'

export async function generateVatReport(transactions, { year, month, companyProfile }) {
  const doc = buildVatDoc({ transactions, year, month, companyProfile })
  const monthName = THAI_MONTHS[month - 1]
  await downloadPdf(
    doc,
    `รายงานภาษีซื้อ-ขาย ประจำเดือน ${monthName} ${toBuddhistYear(year)}.pdf`,
  )
}
