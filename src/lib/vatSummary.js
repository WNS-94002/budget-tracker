export function filterVatItems(transactions, { year, month }) {
  return transactions
    .filter((t) => {
      if (!t.hasVat) return false
      const [y, m] = t.date.split('-').map(Number)
      return y === year && m === month
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export function computeVatSummary(transactions, { year, month }) {
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

  return {
    salesItems,
    purchaseItems,
    abbreviatedExpenseItems,
    outputVatTotal,
    inputVatTotal,
    inputVatCreditable,
    netVat,
  }
}
