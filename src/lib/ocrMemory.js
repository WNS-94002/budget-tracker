// Personal "learning" for the OCR category guess: whenever the user saves a
// transaction that went through OCR, we remember which category they ended
// up with for that receipt's merchant text. Next time text from the same
// shop shows up, the learned category wins over the generic keyword list.
// Stored per-device in localStorage — nothing sent anywhere.
const STORAGE_KEY = 'budget-tracker-ocr-memory'
const MAX_ENTRIES = 200

function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMemory(memory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {
    // Storage full or unavailable (private browsing) — skip silently.
  }
}

export function getLearnedCategory(text) {
  if (!text) return null
  const lower = text.toLowerCase()
  const memory = loadMemory()
  for (const [keyword, category] of Object.entries(memory)) {
    if (keyword && lower.includes(keyword)) return category
  }
  return null
}

export function learnCategory(keyword, category) {
  const normalized = (keyword || '').trim().toLowerCase().slice(0, 40)
  if (normalized.length < 3 || !category) return
  const memory = loadMemory()
  memory[normalized] = category
  const keys = Object.keys(memory)
  if (keys.length > MAX_ENTRIES) {
    delete memory[keys[0]]
  }
  saveMemory(memory)
}
