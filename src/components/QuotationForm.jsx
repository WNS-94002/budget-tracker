import { useEffect, useState } from 'react'
import { formatBaht } from '../lib/categories.js'

const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = () => ({ description: '', qty: '1', unit: 'Set', pricePerUnit: '' })

function emptyForm(suggestedNumber) {
  return {
    number: suggestedNumber || '',
    date: today(),
    attn: '',
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    items: [emptyItem()],
    discount: '0',
    note: '30 วัน',
  }
}

export default function QuotationForm({ open, onClose, onSubmit, initial, suggestedNumber }) {
  const [form, setForm] = useState(() => emptyForm(suggestedNumber))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        number: initial.number || '',
        date: initial.date || today(),
        attn: initial.attn || '',
        customerName: initial.customerName || '',
        customerAddress: initial.customerAddress || '',
        customerPhone: initial.customerPhone || '',
        items:
          initial.items?.length > 0
            ? initial.items.map((it) => ({
                description: it.description || '',
                qty: String(it.qty ?? ''),
                unit: it.unit || '',
                pricePerUnit: String(it.pricePerUnit ?? ''),
              }))
            : [emptyItem()],
        discount: String(initial.discount ?? '0'),
        note: initial.note || '30 วัน',
      })
    } else {
      setForm(emptyForm(suggestedNumber))
    }
    setError(null)
  }, [open, initial, suggestedNumber])

  if (!open) return null

  function updateItem(index, changes) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...changes } : it)),
    }))
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))
  }

  function removeItem(index) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  const subTotal = form.items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.pricePerUnit) || 0),
    0,
  )
  const discount = Number(form.discount) || 0
  const netTotal = subTotal - discount
  const vat = netTotal * 0.07
  const grandTotal = netTotal + vat

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanItems = form.items.filter((it) => it.description.trim())
    if (cleanItems.length === 0) {
      setError('กรุณาใส่รายการอย่างน้อย 1 รายการ')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        ...form,
        items: cleanItems.map((it) => ({
          description: it.description,
          qty: Number(it.qty) || 0,
          unit: it.unit,
          pricePerUnit: Number(it.pricePerUnit) || 0,
        })),
        discount,
        subTotal,
        netTotal,
        vat,
        grandTotal,
      })
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
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {initial ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่'}
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
            <div>
              <label className="block text-sm text-slate-600 mb-1">เลขที่/Number</label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">วันที่/Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">เรียน/Attn</label>
            <input
              type="text"
              value={form.attn}
              onChange={(e) => setForm((f) => ({ ...f, attn: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="เช่น คุณ เจน"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">ชื่อ/Name</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="ชื่อบริษัท/ลูกค้า"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">ที่อยู่/Address</label>
            <textarea
              value={form.customerAddress}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerAddress: e.target.value }))
              }
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">โทรศัพท์/Phone</label>
            <input
              type="text"
              value={form.customerPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerPhone: e.target.value }))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-600">รายการ</p>
            {form.items.map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder="รายละเอียด/Description"
                    rows={2}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-rose-400 hover:text-rose-600 text-sm shrink-0"
                    >
                      ลบ
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={item.qty}
                    onChange={(e) => updateItem(i, { qty: e.target.value })}
                    placeholder="จำนวน"
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(i, { unit: e.target.value })}
                    placeholder="หน่วย"
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={item.pricePerUnit}
                    onChange={(e) => updateItem(i, { pricePerUnit: e.target.value })}
                    placeholder="ราคา/หน่วย"
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-400 text-right">
                  รวม {formatBaht((Number(item.qty) || 0) * (Number(item.pricePerUnit) || 0))} บาท
                </p>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50"
            >
              + เพิ่มรายการ
            </button>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">ส่วนลด/Discount (บาท)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              หมายเหตุ (กำหนดยื่นราคา)
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="เช่น 30 วัน"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>รวมเงิน/Sub Total</span>
              <span>{formatBaht(subTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ส่วนลด/Discount</span>
              <span>{formatBaht(discount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ราคาสุทธิ/Net Total</span>
              <span>{formatBaht(netTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ภาษีมูลค่าเพิ่ม/Vat 7%</span>
              <span>{formatBaht(vat)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
              <span>รวมสุทธิ/Grand Total</span>
              <span>{formatBaht(grandTotal)} บาท</span>
            </div>
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
