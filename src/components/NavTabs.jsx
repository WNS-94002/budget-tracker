const TABS = [
  { id: 'home', label: 'หน้าแรก' },
  { id: 'tax', label: 'งานภาษี' },
  { id: 'cashflow', label: 'กระแสเงินสด' },
]

export default function NavTabs({ active, onChange }) {
  return (
    <div className="max-w-2xl mx-auto px-4 flex gap-1 pt-3">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            active === tab.id
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
