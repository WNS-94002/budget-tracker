import { computeVatSummary } from '../lib/vatSummary.js'
import { formatBaht } from '../lib/categories.js'

function VatItemRow({ item, counterpartyLabel }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">
          {item.vatCounterpartyName || counterpartyLabel}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {item.date} · เลขที่ {item.vatInvoiceNumber || '-'}
          {item.vatCreditBlocked && (
            <span className="ml-1 text-amber-600">· ภาษีซื้อต้องห้าม</span>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm text-slate-700">{formatBaht(item.vatBase ?? 0)}</p>
        <p className="text-xs text-indigo-600">VAT {formatBaht(item.vatAmount ?? 0)}</p>
      </div>
    </div>
  )
}

export default function TaxPage({
  transactions,
  year,
  month,
  companyProfile,
  onExportVat,
  onOpenSettings,
  exporting,
}) {
  const { salesItems, purchaseItems, outputVatTotal, inputVatCreditable, netVat } =
    computeVatSummary(transactions, { year, month })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-white shadow-sm p-4 border-l-4 border-emerald-500">
          <p className="text-sm text-slate-500">ภาษีขาย</p>
          <p className="text-xl font-semibold text-emerald-600">
            {formatBaht(outputVatTotal)} บาท
          </p>
        </div>
        <div className="rounded-xl bg-white shadow-sm p-4 border-l-4 border-rose-500">
          <p className="text-sm text-slate-500">ภาษีซื้อที่เครดิตได้</p>
          <p className="text-xl font-semibold text-rose-600">
            {formatBaht(inputVatCreditable)} บาท
          </p>
        </div>
        <div
          className={`rounded-xl bg-white shadow-sm p-4 border-l-4 ${
            netVat >= 0 ? 'border-amber-500' : 'border-sky-500'
          }`}
        >
          <p className="text-sm text-slate-500">
            {netVat >= 0 ? 'ภาษีที่ต้องชำระ' : 'ภาษีที่ขอคืนได้'}
          </p>
          <p
            className={`text-xl font-semibold ${
              netVat >= 0 ? 'text-amber-600' : 'text-sky-600'
            }`}
          >
            {formatBaht(Math.abs(netVat))} บาท
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onExportVat}
        disabled={exporting}
        className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50"
      >
        {exporting
          ? 'กำลังสร้าง PDF...'
          : 'ดาวน์โหลดรายงานภาษีซื้อ-ขาย (ไฟล์เดียว 2 แผ่น)'}
      </button>

      <div>
        <p className="text-sm text-slate-500 mb-2 px-1">
          รายการภาษีขาย ({salesItems.length})
        </p>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {salesItems.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">ไม่มีรายการ</p>
          ) : (
            salesItems.map((item) => (
              <VatItemRow key={item.id} item={item} counterpartyLabel="ไม่ระบุผู้ซื้อ" />
            ))
          )}
        </div>
      </div>

      <div>
        <p className="text-sm text-slate-500 mb-2 px-1">
          รายการภาษีซื้อ ({purchaseItems.length})
        </p>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {purchaseItems.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">ไม่มีรายการ</p>
          ) : (
            purchaseItems.map((item) => (
              <VatItemRow key={item.id} item={item} counterpartyLabel="ไม่ระบุผู้ขาย" />
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-sm text-slate-500 mb-1">ข้อมูลกิจการ</p>
        <p className="font-medium text-slate-800">
          {companyProfile?.companyName || 'ยังไม่ได้ตั้งค่า'}
        </p>
        {companyProfile?.taxId && (
          <p className="text-sm text-slate-500">เลขผู้เสียภาษี {companyProfile.taxId}</p>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-2 text-sm text-indigo-600 hover:underline"
        >
          แก้ไขข้อมูลกิจการ
        </button>
      </div>
    </div>
  )
}
