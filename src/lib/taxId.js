// Validates the checksum of a 13-digit Thai taxpayer/national ID number.
// Used for both the company's own tax ID and transaction counterparties'
// tax IDs, to catch typos before the data goes to an accountant.
export function isValidThaiTaxId(id) {
  const digits = (id || '').replace(/\D/g, '')
  if (digits.length !== 13) return false

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i)
  }
  const checkDigit = (11 - (sum % 11)) % 10
  return checkDigit === Number(digits[12])
}
