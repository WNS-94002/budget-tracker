export default function PeriodFilter({ onExportMonth, onExportYear, exporting }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 flex flex-wrap items-center gap-2">
      <p className="text-sm text-slate-500 flex-1">รายงานรายรับ-รายจ่าย</p>
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
  )
}
