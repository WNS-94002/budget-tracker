let fontsCache = null

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export async function loadThaiFonts() {
  if (fontsCache) return fontsCache
  const base = import.meta.env.BASE_URL
  const [regularBuf, boldBuf] = await Promise.all([
    fetch(`${base}fonts/Sarabun-Regular.ttf`).then((r) => r.arrayBuffer()),
    fetch(`${base}fonts/Sarabun-Bold.ttf`).then((r) => r.arrayBuffer()),
  ])
  fontsCache = {
    regular: arrayBufferToBase64(regularBuf),
    bold: arrayBufferToBase64(boldBuf),
  }
  return fontsCache
}

export function registerThaiFonts(doc, fonts) {
  doc.addFileToVFS('Sarabun-Regular.ttf', fonts.regular)
  doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal')
  doc.addFileToVFS('Sarabun-Bold.ttf', fonts.bold)
  doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold')
  doc.setFont('Sarabun', 'normal')
}
