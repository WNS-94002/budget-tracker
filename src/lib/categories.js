export const EXPENSE_CATEGORIES = [
  'อาหาร',
  'เดินทาง',
  'ที่พัก/ค่าเช่า',
  'ช้อปปิ้ง',
  'บิล/สาธารณูปโภค',
  'สุขภาพ',
  'บันเทิง',
  'การศึกษา',
  'อื่นๆ',
]

export const INCOME_CATEGORIES = [
  'เงินเดือน',
  'โบนัส',
  'ธุรกิจ',
  'ของขวัญ',
  'ดอกเบี้ย/เงินปันผล',
  'อื่นๆ',
]

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

export function formatBaht(amount) {
  return Number(amount || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function toBuddhistYear(gregorianYear) {
  return gregorianYear + 543
}
