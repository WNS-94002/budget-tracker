import { formatBaht } from '../lib/categories.js'

export default function SummaryCards({ income, expense }) {
  const balance = income - expense
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl bg-white shadow-sm p-4 border-l-4 border-emerald-500">
        <p className="text-sm text-slate-500">รายรับ</p>
        <p className="text-xl font-semibold text-emerald-600">
          {formatBaht(income)} บาท
        </p>
      </div>
      <div className="rounded-xl bg-white shadow-sm p-4 border-l-4 border-rose-500">
        <p className="text-sm text-slate-500">รายจ่าย</p>
        <p className="text-xl font-semibold text-rose-600">
          {formatBaht(expense)} บาท
        </p>
      </div>
      <div
        className={`rounded-xl bg-white shadow-sm p-4 border-l-4 ${
          balance >= 0 ? 'border-sky-500' : 'border-amber-500'
        }`}
      >
        <p className="text-sm text-slate-500">คงเหลือ</p>
        <p
          className={`text-xl font-semibold ${
            balance >= 0 ? 'text-sky-600' : 'text-amber-600'
          }`}
        >
          {formatBaht(balance)} บาท
        </p>
      </div>
    </div>
  )
}
