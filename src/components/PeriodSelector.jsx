import { THAI_MONTHS, toBuddhistYear } from '../lib/categories.js'

export default function PeriodSelector({ year, month, years, onYearChange, onMonthChange }) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-3">
      <select
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
      >
        {THAI_MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>

      <select
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            พ.ศ. {toBuddhistYear(y)}
          </option>
        ))}
      </select>
    </div>
  )
}
