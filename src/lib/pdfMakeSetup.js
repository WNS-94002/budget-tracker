// pdfmake (PDFKit + fontkit under the hood) is used instead of jsPDF because
// it applies the font's OpenType GPOS rules. Thai stacks a tone mark above an
// upper vowel (เช่น หนึ่ง = ึ + ่); jsPDF drew both at the same height so they
// collided. fontkit positions them correctly, and the text stays real text
// (selectable/searchable) rather than a rasterised image.

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function fetchAsBase64(url) {
  const buf = await fetch(url).then((r) => r.arrayBuffer())
  return arrayBufferToBase64(buf)
}

let pdfMakePromise = null

export function getPdfMake() {
  if (!pdfMakePromise) {
    pdfMakePromise = (async () => {
      const mod = await import('pdfmake/build/pdfmake')
      const pdfMake = mod.default || mod
      const base = import.meta.env.BASE_URL
      const [regular, bold] = await Promise.all([
        fetchAsBase64(`${base}fonts/Sarabun-Regular.ttf`),
        fetchAsBase64(`${base}fonts/Sarabun-Bold.ttf`),
      ])
      pdfMake.addVirtualFileSystem({
        'Sarabun-Regular.ttf': regular,
        'Sarabun-Bold.ttf': bold,
      })
      pdfMake.setFonts({
        Sarabun: {
          normal: 'Sarabun-Regular.ttf',
          bold: 'Sarabun-Bold.ttf',
          italics: 'Sarabun-Regular.ttf',
          bolditalics: 'Sarabun-Bold.ttf',
        },
      })
      return pdfMake
    })()
  }
  return pdfMakePromise
}

const imageCache = new Map()

export async function loadImageDataUrl(path) {
  if (imageCache.has(path)) return imageCache.get(path)
  const base = import.meta.env.BASE_URL
  const base64 = await fetchAsBase64(`${base}${path}`)
  const dataUrl = `data:image/png;base64,${base64}`
  imageCache.set(path, dataUrl)
  return dataUrl
}

// Shared defaults so every report looks consistent.
export const DEFAULT_STYLE = { font: 'Sarabun', fontSize: 9 }

export async function downloadPdf(docDefinition, fileName) {
  const pdfMake = await getPdfMake()
  pdfMake
    .createPdf({ defaultStyle: DEFAULT_STYLE, ...docDefinition })
    .download(fileName)
}
