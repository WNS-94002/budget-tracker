import { downloadPdf, loadImageDataUrl } from './pdfMakeSetup.js'
import { buildQuotationDoc } from './quotationDoc.js'

export async function generateQuotationPdf(quotation, { companyProfile }) {
  let logoDataUrl = null
  try {
    logoDataUrl = await loadImageDataUrl('logo-wide.png')
  } catch {
    logoDataUrl = null
  }

  const doc = buildQuotationDoc({ quotation, companyProfile, logoDataUrl })
  await downloadPdf(doc, `ใบเสนอราคา ${quotation.number || ''}.pdf`)
}
