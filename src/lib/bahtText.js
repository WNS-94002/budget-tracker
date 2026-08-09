const DIGITS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

// Converts an integer (0 to any size) into Thai reading, applying the
// เอ็ด (units digit 1, when not standalone) and ยี่ (tens digit 2) rules.
function readGroupOfSix(numStr) {
  let result = ''
  const len = numStr.length
  for (let i = 0; i < len; i++) {
    const digit = Number(numStr[i])
    if (digit === 0) continue
    const posFromRight = len - 1 - i
    if (posFromRight === 0 && digit === 1 && len > 1) {
      result += 'เอ็ด'
    } else if (posFromRight === 1 && digit === 2) {
      result += 'ยี่สิบ'
    } else if (posFromRight === 1 && digit === 1) {
      result += 'สิบ'
    } else {
      result += DIGITS[digit] + POSITIONS[posFromRight]
    }
  }
  return result
}

function readInteger(n) {
  if (n === 0) return 'ศูนย์'
  const str = String(n)
  const groups = []
  let rest = str
  while (rest.length > 0) {
    const start = Math.max(0, rest.length - 6)
    groups.unshift(rest.slice(start))
    rest = rest.slice(0, start)
  }
  return groups
    .map((group, i) => {
      const isLast = i === groups.length - 1
      const words = readGroupOfSix(group.replace(/^0+(?=\d)/, ''))
      if (!words) return ''
      return words + (isLast ? '' : 'ล้าน')
    })
    .join('')
}

export function bahtText(amount) {
  const rounded = Math.round((Number(amount) || 0) * 100) / 100
  const baht = Math.floor(rounded)
  const satang = Math.round((rounded - baht) * 100)

  const bahtWords = readInteger(baht) + 'บาท'
  const satangWords = satang === 0 ? 'ถ้วน' : readInteger(satang) + 'สตางค์'

  return bahtWords + satangWords
}
