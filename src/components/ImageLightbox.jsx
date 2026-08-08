import { isPdfDataUrl } from '../lib/imageCompress.js'

export default function ImageLightbox({ src, onClose }) {
  if (!src) return null
  const isPdf = isPdfDataUrl(src)

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl leading-none"
        aria-label="ปิด"
      >
        ×
      </button>
      {isPdf ? (
        <iframe
          src={src}
          title="ไฟล์ PDF ใบเสร็จ"
          className="w-full h-full max-w-4xl bg-white rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={src}
          alt="รูปใบเสร็จ"
          className="max-w-full max-h-full rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
