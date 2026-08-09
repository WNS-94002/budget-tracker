// A running cash book (สมุดเงินสด): opening balance carried forward from
// every transaction before the selected month, then each transaction in
// the month listed chronologically with a running balance.
export function computeCashBook(transactions, { year, month }) {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEndExclusive =
    month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const openingBalance = transactions
    .filter((t) => t.date < monthStart)
    .reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount || 0) : -Number(t.amount || 0)), 0)

  const monthItems = transactions
    .filter((t) => t.date >= monthStart && t.date < monthEndExclusive)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
      const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
      return aTs - bTs
    })

  let running = openingBalance
  const rows = monthItems.map((t) => {
    const amount = Number(t.amount || 0)
    running += t.type === 'income' ? amount : -amount
    return {
      id: t.id,
      date: t.date,
      label: t.note || t.category,
      category: t.category,
      type: t.type,
      cashIn: t.type === 'income' ? amount : null,
      cashOut: t.type === 'expense' ? amount : null,
      balance: running,
    }
  })

  return {
    openingBalance,
    rows,
    closingBalance: running,
  }
}
