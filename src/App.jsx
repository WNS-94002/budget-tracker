import { useEffect, useMemo, useState } from 'react'
import NavTabs from './components/NavTabs.jsx'
import PeriodSelector from './components/PeriodSelector.jsx'
import HomePage from './components/HomePage.jsx'
import TaxPage from './components/TaxPage.jsx'
import CashFlowPage from './components/CashFlowPage.jsx'
import QuotationPage from './components/QuotationPage.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import CompanySettingsForm from './components/CompanySettingsForm.jsx'
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from './lib/transactions.js'
import {
  subscribeQuotations,
  addQuotation,
  updateQuotation,
  deleteQuotation,
} from './lib/quotations.js'
import { subscribeCompanyProfile, saveCompanyProfile } from './lib/settings.js'
import { processAttachment } from './lib/imageCompress.js'
import { splitVatFromGross } from './lib/vat.js'

const FIREBASE_CONFIGURED = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

const now = new Date()

function splitVatFromGrossFields(grossAmount) {
  const { base, vat } = splitVatFromGross(grossAmount)
  return { vatBase: base, vatAmount: vat }
}

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [loadError, setLoadError] = useState(null)

  const [activePage, setActivePage] = useState('home')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [exporting, setExporting] = useState(false)

  const [companyProfile, setCompanyProfile] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [quotations, setQuotations] = useState([])

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return
    const unsubscribe = subscribeTransactions(
      setTransactions,
      (err) => setLoadError(err.message),
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return
    const unsubscribe = subscribeCompanyProfile(setCompanyProfile, () => {})
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return
    const unsubscribe = subscribeQuotations(setQuotations, () => {})
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
      const grossAmount = Number(rest.amount)
      const changes = {
        type: rest.type,
        amount: grossAmount,
        category: rest.category,
        note: rest.note,
        date: rest.date,
        hasVat: Boolean(rest.hasVat),
        ...(rest.hasVat
          ? {
              vatInvoiceType: rest.vatInvoiceType || 'full',
              vatInvoiceNumber: rest.vatInvoiceNumber || '',
              vatTaxId: rest.vatTaxId || '',
              vatCounterpartyName: rest.vatCounterpartyName || '',
              vatCreditBlocked: Boolean(rest.vatCreditBlocked),
              ...splitVatFromGrossFields(grossAmount),
            }
          : {}),
      }
      if (imageFile) {
        changes.image = await processAttachment(imageFile)
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
      await generatePdfReport(transactions, { mode, year, month, companyProfile })
    } catch (err) {
      console.error(err)
      alert('สร้าง PDF ไม่สำเร็จ: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportVat() {
    setExporting(true)
    try {
      const { generateVatReport } = await import('./lib/vatReport.js')
      await generateVatReport(transactions, { year, month, companyProfile })
    } catch (err) {
      console.error(err)
      alert('สร้างรายงานภาษีไม่สำเร็จ: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  async function handleSaveCompanyProfile(profile) {
    await saveCompanyProfile(profile)
  }

  async function handleDownloadQuotation(quotation) {
    setExporting(true)
    try {
      const { generateQuotationPdf } = await import('./lib/quotationReport.js')
      await generateQuotationPdf(quotation, { companyProfile })
    } catch (err) {
      console.error(err)
      alert('สร้างใบเสนอราคาไม่สำเร็จ: ' + err.message)
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
      <header className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3 py-5 px-4">
          <img
            src="./logo.png"
            alt="19 First Time"
            className="w-11 h-11 rounded-full shrink-0 bg-white"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-400 uppercase">
              19FirstTime
            </p>
            <h1 className="text-xl font-bold leading-normal truncate">
              {companyProfile?.companyName || 'บันทึกรายรับ-รายจ่าย'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg"
            aria-label="ตั้งค่าข้อมูลกิจการ"
          >
            ⚙
          </button>
        </div>

        <NavTabs active={activePage} onChange={setActivePage} />
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {activePage !== 'quotation' && (
          <PeriodSelector
            year={year}
            month={month}
            years={years}
            onYearChange={setYear}
            onMonthChange={setMonth}
          />
        )}

        {activePage === 'home' && (
          <HomePage
            periodItems={periodItems}
            income={income}
            expense={expense}
            onExportMonth={() => handleExport('month')}
            onExportYear={() => handleExport('year')}
            exporting={exporting}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        )}

        {activePage === 'tax' && (
          <TaxPage
            transactions={transactions}
            year={year}
            month={month}
            companyProfile={companyProfile}
            onExportVat={handleExportVat}
            onOpenSettings={() => setSettingsOpen(true)}
            exporting={exporting}
          />
        )}

        {activePage === 'cashflow' && (
          <CashFlowPage transactions={transactions} year={year} month={month} />
        )}

        {activePage === 'quotation' && (
          <QuotationPage
            quotations={quotations}
            companyProfile={companyProfile}
            onAdd={addQuotation}
            onUpdate={updateQuotation}
            onDelete={deleteQuotation}
            onDownload={handleDownloadQuotation}
            exporting={exporting}
          />
        )}
      </main>

      {activePage !== 'quotation' && (
        <button
          type="button"
          onClick={openAddForm}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 text-white text-3xl shadow-lg hover:bg-emerald-600 flex items-center justify-center"
          aria-label="เพิ่มรายการ"
        >
          +
        </button>
      )}

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editingItem}
      />

      <CompanySettingsForm
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSubmit={handleSaveCompanyProfile}
        initial={companyProfile}
      />
    </div>
  )
}
