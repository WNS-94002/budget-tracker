import { useEffect, useRef, useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories.js'

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  type: 'expense',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  note: '',
  date: today(),
}

export default function TransactionForm({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        type: initial.type,
        amount: String(initial.amount ?? ''),
        category: initial.category,
        note: initial.note || '',
        date: initial.date,
      })
      setImagePreview(initial.image || null)
    } else {
      setForm(emptyForm)
      setImagePreview(null)
    }
    setImageFile(null)
    setError(null)
  }, [open, initial])

  if (!open) return null

  const categories =
    form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleTypeChange(type) {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    setForm((f) => ({ ...f, type, category: list[0] }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      setError('กรุณาระบุจำนวนเงินให้ถูกต้อง')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ ...form, imageFile })
      onClose()
    } catch (err) {
      console.error(err)
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {initial ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              aria-label="ปิด"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg text-sm font-medium border ${
                form.type === 'income'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              รายรับ
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg text-sm font-medium border ${
                form.type === 'expense'
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              รายจ่าย
            </button>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">หมวดหมู่</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">วันที่</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              รายละเอียด (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="เช่น ค่าข้าวกลางวัน"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              แนบรูปภาพ (ไม่บังคับ)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="ตัวอย่างรูปภาพ"
                className="mt-2 max-h-40 rounded-lg border border-slate-200"
              />
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-600"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
