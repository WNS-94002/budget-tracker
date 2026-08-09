import { downloadPdf } from './pdfMakeSetup.js'
import { buildIncomeExpenseDoc } from './incomeExpenseDoc.js'

export async function generatePdfReport(transactions, { mode, year, month, companyProfile }) {
  const doc = buildIncomeExpenseDoc({ transactions, mode, year, month, companyProfile })
  const suffix = mode === 'month' ? `${year}-${String(month).padStart(2, '0')}` : `${year}`
  await downloadPdf(doc, `รายงาน-${suffix}.pdf`)
}
