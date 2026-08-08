import { useEffect, useRef, useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatBaht } from '../lib/categories.js'
import { recognizeReceiptText, parseReceiptText } from '../lib/ocr.js'
import { learnCategory } from '../lib/ocrMemory.js'
import { splitVatFromGross } from '../lib/vat.js'

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  type: 'expense',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  note: '',
  date: today(),
  hasVat: false,
  vatInvoiceType: 'full',
  vatInvoiceNumber: '',
  vatTaxId: '',
  vatCreditBlocked: false,
}

export default function TransactionForm({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrMerchantKey, setOcrMerchantKey] = useState(null)
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
        hasVat: Boolean(initial.hasVat),
        vatInvoiceType: initial.vatInvoiceType || 'full',
        vatInvoiceNumber: initial.vatInvoiceNumber || '',
        vatTaxId: initial.vatTaxId || '',
        vatCreditBlocked: Boolean(initial.vatCreditBlocked),
      })
      setImagePreview(initial.image || null)
    } else {
      setForm(emptyForm)
      setImagePreview(null)
    }
    setImageFile(null)
    setError(null)
    setOcrMerchantKey(null)
  }, [open, initial])

  if (!open) return null

  const categories =
    form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleTypeChange(type) {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    setForm((f) => ({
      ...f,
      type,
      category: list[0],
      vatCreditBlocked: type === 'income' ? false : f.vatCreditBlocked,
    }))
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
    setOcrMerchantKey(null)
  }

  async function handleReadReceipt() {
    const source = imageFile || imagePreview
    if (!source) return
    setOcrLoading(true)
    setOcrProgress(0)
    setError(null)
    try {
      const text = await recognizeReceiptText(source, (m) => {
        if (m.status === 'recognizing text') {
          setOcrProgress(Math.round((m.progress || 0) * 100))
        }
      })
      const guess = parseReceiptText(text)
      setForm((f) => ({
        ...f,
        type: 'expense',
        category: EXPENSE_CATEGORIES.includes(guess.category)
          ? guess.category
          : f.category,
        amount: guess.amount != null ? String(guess.amount) : f.amount,
        note: guess.note || f.note,
      }))
      setOcrMerchantKey(guess.merchantKey || null)
      if (guess.amount == null) {
        setError('อ่านบิลได้แต่หาจำนวนเงินไม่เจอ กรุณากรอกเอง')
      }
    } catch (err) {
      console.error(err)
      setError('อ่านบิลไม่สำเร็จ: ' + (err?.message || ''))
    } finally {
      setOcrLoading(false)
    }
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
      if (ocrMerchantKey && form.type === 'expense') {
        learnCategory(ocrMerchantKey, form.category)
      }
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
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.hasVat}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasVat: e.target.checked }))
                }
              />
              มีใบกำกับภาษี (VAT)
            </label>

            {form.hasVat && (
              <div className="mt-2 space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, vatInvoiceType: 'full' }))
                    }
                    className={`py-1.5 rounded-lg text-xs font-medium border ${
                      form.vatInvoiceType === 'full'
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    ใบกำกับภาษีเต็มรูป
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, vatInvoiceType: 'abbreviated' }))
                    }
                    className={`py-1.5 rounded-lg text-xs font-medium border ${
                      form.vatInvoiceType === 'abbreviated'
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    ใบกำกับภาษีอย่างย่อ
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    เลขที่ใบกำกับภาษี
                  </label>
                  <input
                    type="text"
                    value={form.vatInvoiceNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vatInvoiceNumber: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>

                {form.vatInvoiceType === 'full' && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      เลขประจำตัวผู้เสียภาษีของคู่ค้า (13 หลัก)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={13}
                      value={form.vatTaxId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          vatTaxId: e.target.value.replace(/\D/g, '').slice(0, 13),
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                )}

                {Number(form.amount) > 0 && (
                  <p className="text-xs text-slate-500">
                    แยกยอด (VAT 7%): ก่อนภาษี{' '}
                    {formatBaht(splitVatFromGross(form.amount).base)} + VAT{' '}
                    {formatBaht(splitVatFromGross(form.amount).vat)} = รวม{' '}
                    {formatBaht(form.amount)} บาท
                  </p>
                )}

                {form.type === 'expense' && form.vatInvoiceType === 'full' && (
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.vatCreditBlocked}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          vatCreditBlocked: e.target.checked,
                        }))
                      }
                    />
                    ภาษีซื้อต้องห้าม (นำไปเครดิตภาษีขายไม่ได้ เช่น ค่ารับรอง/รถยนต์นั่งส่วนบุคคล)
                  </label>
                )}
              </div>
            )}
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
              <>
                <img
                  src={imagePreview}
                  alt="ตัวอย่างรูปภาพ"
                  className="mt-2 max-h-40 rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleReadReceipt}
                  disabled={ocrLoading}
                  className="mt-2 w-full py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {ocrLoading
                    ? `กำลังอ่านบิล... ${ocrProgress}%`
                    : 'อ่านบิลอัตโนมัติด้วย OCR (ฟรี)'}
                </button>
                <p className="mt-1 text-xs text-slate-400">
                  ระบบจะเดาจำนวนเงิน/หมวดหมู่ให้ กรุณาตรวจสอบก่อนบันทึก — ถ้าแก้หมวดหมู่แล้วกดบันทึก
                  ระบบจะจำไว้ว่าร้านนี้เป็นหมวดหมู่นี้ ครั้งต่อไปจะเดาให้ถูกทันที
                </p>
              </>
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
