import { useMemo, useState } from 'react'
import { formatBaht, toBuddhistYear } from '../lib/categories.js'
import QuotationForm from './QuotationForm.jsx'

function suggestNextNumber(quotations) {
  const yy = String(toBuddhistYear(new Date().getFullYear())).slice(-2)
  const prefix = `QU${yy}`
  const usedNumbers = quotations
    .map((q) => q.number || '')
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1
  return `${prefix}${String(next).padStart(5, '0')}`
}

export default function QuotationPage({
  quotations,
  companyProfile,
  onAdd,
  onUpdate,
  onDelete,
  onDownload,
  exporting,
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const suggestedNumber = useMemo(() => suggestNextNumber(quotations), [quotations])

  function openAddForm() {
    setEditingItem(null)
    setFormOpen(true)
  }

  function openEditForm(item) {
    setEditingItem(item)
    setFormOpen(true)
  }

  async function handleSubmit(data) {
    if (editingItem) {
      await onUpdate(editingItem.id, data)
    } else {
      await onAdd(data)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`ต้องการลบใบเสนอราคา ${item.number} ใช่หรือไม่?`)) return
    try {
      await onDelete(item.id)
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message)
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={openAddForm}
        className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600"
      >
        + สร้างใบเสนอราคาใหม่
      </button>

      {quotations.length === 0 ? (
        <div className="text-center text-slate-400 py-16">ยังไม่มีใบเสนอราคา</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {quotations.map((q) => (
            <div key={q.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">
                  {q.number} · {q.customerName || 'ไม่ระบุชื่อ'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {q.date} · {formatBaht(q.grandTotal)} บาท
                </p>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <button
                  type="button"
                  onClick={() => onDownload(q)}
                  disabled={exporting}
                  className="text-xs text-indigo-600 hover:underline disabled:opacity-50 block"
                >
                  ดาวน์โหลด PDF
                </button>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => openEditForm(q)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q)}
                    className="text-xs text-rose-400 hover:text-rose-600"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuotationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editingItem}
        suggestedNumber={suggestedNumber}
      />

      {!companyProfile?.companyName && (
        <p className="text-xs text-amber-600 text-center">
          ยังไม่ได้ตั้งค่าข้อมูลกิจการ — ไปที่ไอคอน ⚙ เพื่อตั้งค่าก่อนดาวน์โหลด PDF
        </p>
      )}
    </div>
  )
}
