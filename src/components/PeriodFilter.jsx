import { THAI_MONTHS, toBuddhistYear } from '../lib/categories.js'

export default function PeriodFilter({
  year,
  month,
  years,
  onYearChange,
  onMonthChange,
  onExportMonth,
  onExportYear,
  onExportVat,
  exporting,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex-1" />

        <button
          type="button"
          onClick={onExportMonth}
          disabled={exporting}
          className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {exporting ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (รายเดือน)'}
        </button>
        <button
          type="button"
          onClick={onExportYear}
          disabled={exporting}
          className="px-3 py-2 text-sm rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:opacity-50"
        >
          {exporting ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (รายปี)'}
        </button>
      </div>

      <button
        type="button"
        onClick={onExportVat}
        disabled={exporting}
        className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
      >
        {exporting ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลดรายงานภาษีซื้อ-ขาย (รายเดือน)'}
      </button>
    </div>
  )
}
