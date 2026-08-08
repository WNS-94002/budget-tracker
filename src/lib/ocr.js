import { EXPENSE_CATEGORIES } from './categories.js'

// Free, in-browser OCR (no server, no API key). Tesseract.js downloads its
// worker/wasm/language data from a CDN on first use and caches it.
// The progress logger can only be set when the worker is created, so we
// keep a mutable reference and let each call swap in its own callback.
let currentProgressCallback = null
let workerPromise = null
function getWorker() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) =>
      createWorker('eng+tha', undefined, {
        logger: (m) => currentProgressCallback?.(m),
      }),
    )
  }
  return workerPromise
}

export async function recognizeReceiptText(imageSource, onProgress) {
  const worker = await getWorker()
  currentProgressCallback = onProgress || null
  try {
    const { data } = await worker.recognize(imageSource)
    return data.text
  } finally {
    currentProgressCallback = null
  }
}

const TOTAL_KEYWORDS = [
  'รวมทั้งสิ้น',
  'ยอดรวมสุทธิ',
  'ยอดสุทธิ',
  'ยอดรวม',
  'รวมเงิน',
  'รวม',
  'total amount',
  'grand total',
  'net total',
  'total',
  'amount due',
  'จำนวนเงิน',
]

const CATEGORY_KEYWORDS = [
  [
    'อาหาร',
    ['ร้านอาหาร', 'restaurant', 'food', 'cafe', 'กาแฟ', 'coffee', '7-eleven', 'เซเว่น', 'ก๋วยเตี๋ยว', 'ส้มตำ', 'ครัว', 'foodpanda', 'grabfood'],
  ],
  [
    'เดินทาง',
    ['ปตท', 'ปั๊มน้ำมัน', 'น้ำมัน', 'เชลล์', 'shell', 'bts', 'mrt', 'แท็กซี่', 'taxi', 'grab', 'fuel', 'gas station', 'ทางด่วน', 'toll'],
  ],
  ['ที่พัก/ค่าเช่า', ['โรงแรม', 'hotel', 'ค่าเช่า', 'resort', 'apartment', 'agoda', 'booking.com']],
  [
    'ช้อปปิ้ง',
    ['เซ็นทรัล', 'central', 'lotus', 'โลตัส', 'บิ๊กซี', 'big c', 'bigc', 'mall', 'shopping', 'เทสโก้', 'shopee', 'lazada'],
  ],
  [
    'บิล/สาธารณูปโภค',
    ['ค่าไฟ', 'ค่าน้ำ', 'ไฟฟ้า', 'ประปา', 'อินเทอร์เน็ต', 'true', 'ais', 'dtac', 'โทรศัพท์', 'invoice', 'bill'],
  ],
  [
    'สุขภาพ',
    ['โรงพยาบาล', 'รพ.', 'คลินิก', 'เภสัช', 'ร้านยา', 'pharmacy', 'hospital', 'clinic', 'ประกันภัย', 'ประกันสุขภาพ'],
  ],
  ['บันเทิง', ['หนัง', 'เน็ตฟลิกซ์', 'netflix', 'โรงภาพยนตร์', 'คาราโอเกะ', 'คอนเสิร์ต', 'cinema']],
  ['การศึกษา', ['โรงเรียน', 'มหาวิทยาลัย', 'ค่าเทอม', 'tuition', 'หนังสือ', 'bookstore']],
]

function guessCategory(text) {
  const lower = text.toLowerCase()
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return category
    }
  }
  return null
}

function extractAmount(text) {
  const numberPattern = /\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g
  const lines = text.split('\n')

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    if (TOTAL_KEYWORDS.some((kw) => lowerLine.includes(kw.toLowerCase()))) {
      const matches = line.match(numberPattern)
      if (matches && matches.length > 0) {
        const value = parseFloat(matches[matches.length - 1].replace(/,/g, ''))
        if (!Number.isNaN(value) && value > 0) return value
      }
    }
  }

  const allMatches = text.match(numberPattern) || []
  const values = allMatches
    .map((m) => parseFloat(m.replace(/,/g, '')))
    .filter((v) => !Number.isNaN(v) && v > 0 && v < 10000000)

  if (values.length === 0) return null
  return Math.max(...values)
}

function guessNote(text) {
  const firstLine = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length >= 3 && /[a-zA-Zก-๙]/.test(l))
  return firstLine ? firstLine.slice(0, 60) : ''
}

export function parseReceiptText(text) {
  return {
    amount: extractAmount(text),
    category: guessCategory(text) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1],
    note: guessNote(text),
  }
}
