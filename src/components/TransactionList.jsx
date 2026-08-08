import { useState } from 'react'
import { formatBaht } from '../lib/categories.js'
import ImageLightbox from './ImageLightbox.jsx'

function groupByDate(items) {
  const groups = new Map()
  for (const item of items) {
    if (!groups.has(item.date)) groups.set(item.date, [])
    groups.get(item.date).push(item)
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

function formatDateHeading(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function TransactionList({ items, onEdit, onDelete }) {
  const [lightboxSrc, setLightboxSrc] = useState(null)

  if (items.length === 0) {
    return (
      <div className="text-center text-slate-400 py-16">
        ยังไม่มีรายการในช่วงเวลานี้
      </div>
    )
  }

  const groups = groupByDate(items)

  return (
    <div className="space-y-5">
      {groups.map(([date, entries]) => (
        <div key={date}>
          <p className="text-sm text-slate-500 mb-2 px-1">
            {formatDateHeading(date)}
          </p>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
            {entries.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3">
                {item.image ? (
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(item.image)}
                    className="flex-shrink-0"
                    aria-label="ดูรูปเต็ม"
                  >
                    <img
                      src={item.image}
                      alt={item.category}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                  </button>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                    ไม่มีรูป
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {item.category}
                  </p>
                  {item.note && (
                    <p className="text-sm text-slate-500 truncate">{item.note}</p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-semibold ${
                      item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatBaht(item.amount)}
                  </p>
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="text-xs text-rose-400 hover:text-rose-600"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
