export const VAT_RATE = 0.07

// `grossAmount` is the total price including VAT (what the transaction's
// `amount` field already stores) — splits it back into the pre-VAT base
// and the VAT amount, the way a Thai tax invoice breaks it down.
export function splitVatFromGross(grossAmount) {
  const gross = Number(grossAmount) || 0
  const base = Math.round((gross / (1 + VAT_RATE)) * 100) / 100
  const vat = Math.round((gross - base) * 100) / 100
  return { base, vat }
}
