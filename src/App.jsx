import { useEffect, useMemo, useState } from 'react'
import SummaryCards from './components/SummaryCards.jsx'
import PeriodFilter from './components/PeriodFilter.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionList from './components/TransactionList.jsx'
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from './lib/transactions.js'
import { compressImageToDataUrl } from './lib/imageCompress.js'

const FIREBASE_CONFIGURED = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

const now = new Date()

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [loadError, setLoadError] = useState(null)

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return
    const unsubscribe = subscribeTransactions(
      setTransactions,
      (err) => setLoadError(err.message),
    )
    return unsubscribe
  }, [])

  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => Number(t.date.slice(0, 4))))
    set.add(now.getFullYear())
    return Array.from(set).sort((a, b) => b - a)
  }, [transactions])

  const periodItems = useMemo(
    () =>
      transactions.filter((t) => {
        const [y, m] = t.date.split('-').map(Number)
        return y === year && m === month
      }),
    [transactions, year, month],
  )

  const income = useMemo(
    () =>
      periodItems
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [periodItems],
  )
  const expense = useMemo(
    () =>
      periodItems
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [periodItems],
  )

  function openAddForm() {
    setEditingItem(null)
    setFormOpen(true)
  }

  function openEditForm(item) {
    setEditingItem(item)
    setFormOpen(true)
  }

  async function handleSubmit(payload) {
    if (editingItem) {
      const { imageFile, ...rest } = payload
      const changes = {
        type: rest.type,
        amount: Number(rest.amount),
        category: rest.category,
        note: rest.note,
        date: rest.date,
      }
      if (imageFile) {
        changes.image = await compressImageToDataUrl(imageFile)
      }
      await updateTransaction(editingItem.id, changes)
    } else {
      await addTransaction(payload)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return
    try {
      await deleteTransaction(item)
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message)
    }
  }

  async function handleExport(mode) {
    setExporting(true)
    try {
      const { generatePdfReport } = await import('./lib/pdfReport.js')
      await generatePdfReport(transactions, { mode, year, month })
    } catch (err) {
      console.error(err)
      alert('สร้าง PDF ไม่สำเร็จ: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  if (!FIREBASE_CONFIGURED) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">ยังไม่ได้ตั้งค่า Firebase</h1>
          <p className="text-slate-600 text-sm">
            กรุณาสร้างไฟล์ <code className="bg-slate-200 px-1 rounded">.env</code>{' '}
            จาก <code className="bg-slate-200 px-1 rounded">.env.example</code>{' '}
            แล้วใส่ค่า Firebase config ของคุณ ดูขั้นตอนใน README.md
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold text-rose-600">เกิดข้อผิดพลาด</h1>
          <p className="text-slate-600 text-sm">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white py-5 px-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-2xl shrink-0">
            ฿
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-400 uppercase">
              19FirstTime
            </p>
            <h1 className="text-xl font-bold leading-tight truncate">
              บันทึกรายรับ-รายจ่าย
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        <SummaryCards income={income} expense={expense} />

        <PeriodFilter
          year={year}
          month={month}
          years={years}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onExportMonth={() => handleExport('month')}
          onExportYear={() => handleExport('year')}
          exporting={exporting}
        />

        <TransactionList
          items={periodItems}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </main>

      <button
        type="button"
        onClick={openAddForm}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 text-white text-3xl shadow-lg hover:bg-emerald-600 flex items-center justify-center"
        aria-label="เพิ่มรายการ"
      >
        +
      </button>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editingItem}
      />
    </div>
  )
}
