import { computeCashBook } from '../lib/cashflow.js'
import { formatBaht, THAI_MONTHS, toBuddhistYear } from '../lib/categories.js'

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function CashFlowPage({ transactions, year, month }) {
  const { openingBalance, rows, closingBalance } = computeCashBook(transactions, {
    year,
    month,
  })
  const periodLabel = `${THAI_MONTHS[month - 1]} พ.ศ. ${toBuddhistYear(year)}`

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm text-slate-500">ยอดยกมา (ก่อนวันที่ 1 {periodLabel})</p>
        <p
          className={`text-xl font-semibold ${
            openingBalance >= 0 ? 'text-slate-800' : 'text-rose-600'
          }`}
        >
          {formatBaht(openingBalance)} บาท
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="text-left font-medium px-3 py-2">วันที่</th>
              <th className="text-left font-medium px-3 py-2">รายการ</th>
              <th className="text-right font-medium px-3 py-2">รับ</th>
              <th className="text-right font-medium px-3 py-2">จ่าย</th>
              <th className="text-right font-medium px-3 py-2">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-8">
                  ไม่มีรายการในช่วงเวลานี้
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id || i} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                    {formatShortDate(row.date)}
                  </td>
                  <td className="px-3 py-2 text-slate-800 max-w-[160px] truncate">
                    {row.label}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-600">
                    {row.cashIn != null ? formatBaht(row.cashIn) : ''}
                  </td>
                  <td className="px-3 py-2 text-right text-rose-600">
                    {row.cashOut != null ? formatBaht(row.cashOut) : ''}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      row.balance >= 0 ? 'text-slate-800' : 'text-rose-600'
                    }`}
                  >
                    {formatBaht(row.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm text-slate-500">คงเหลือสิ้นเดือน ({periodLabel})</p>
        <p
          className={`text-xl font-semibold ${
            closingBalance >= 0 ? 'text-slate-800' : 'text-rose-600'
          }`}
        >
          {formatBaht(closingBalance)} บาท
        </p>
      </div>
    </div>
  )
}
