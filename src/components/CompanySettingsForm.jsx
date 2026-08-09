import { useEffect, useState } from 'react'
import { isValidThaiTaxId } from '../lib/taxId.js'

const emptyProfile = {
  companyName: '',
  companyNameEn: '',
  taxId: '',
  branchType: 'main',
  branchNumber: '',
  address: '',
  addressEn: '',
  phone: '',
  email: '',
}

export default function CompanySettingsForm({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(emptyProfile)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm({ ...emptyProfile, ...(initial || {}) })
    setError(null)
  }, [open, initial])

  if (!open) return null

  const taxIdInvalid = form.taxId.length > 0 && !isValidThaiTaxId(form.taxId)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      console.error(err)
      setError('บันทึกไม่สำเร็จ: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">ตั้งค่าข้อมูลกิจการ</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              aria-label="ปิด"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            ข้อมูลนี้จะแสดงบนหัวรายงาน PDF เพื่อให้พร้อมส่งนักบัญชี/ยื่นภาษี
          </p>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              ชื่อกิจการ (เช่น ห้างหุ้นส่วนจำกัด...)
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyName: e.target.value }))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              ชื่อกิจการภาษาอังกฤษ (ไม่บังคับ, ใช้ในใบเสนอราคา)
            </label>
            <input
              type="text"
              value={form.companyNameEn}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyNameEn: e.target.value }))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="เช่น 19 FIRST TIME LTD.,PART"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={13}
              value={form.taxId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  taxId: e.target.value.replace(/\D/g, '').slice(0, 13),
                }))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            {taxIdInvalid && (
              <p className="text-xs text-amber-600 mt-1">
                รูปแบบเลขผู้เสียภาษีนี้ดูไม่ถูกต้อง (checksum ไม่ผ่าน) กรุณาตรวจสอบอีกครั้ง
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, branchType: 'main' }))}
              className={`py-2 rounded-lg text-sm font-medium border ${
                form.branchType === 'main'
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              สำนักงานใหญ่
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, branchType: 'branch' }))}
              className={`py-2 rounded-lg text-sm font-medium border ${
                form.branchType === 'branch'
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              สาขา
            </button>
          </div>

          {form.branchType === 'branch' && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                สาขาเลขที่
              </label>
              <input
                type="text"
                value={form.branchNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, branchNumber: e.target.value }))
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              ที่อยู่สถานประกอบการ (ไม่บังคับ)
            </label>
            <textarea
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              ที่อยู่ภาษาอังกฤษ (ไม่บังคับ, ใช้ในใบเสนอราคา)
            </label>
            <textarea
              value={form.addressEn}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressEn: e.target.value }))
              }
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                โทรศัพท์ (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                อีเมล (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
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
