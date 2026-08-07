// Images are stored as base64 inside the Firestore document itself (no
// Cloud Storage bucket, which would require upgrading to the paid Blaze
// plan). Firestore documents cap out at 1 MiB, so we resize + compress
// down to a safe budget before saving.
const MAX_DIMENSION = 1000
const JPEG_QUALITY = 0.6
const MAX_BASE64_BYTES = 900 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function compressImageToDataUrl(file) {
  const img = await loadImage(file)
  try {
    let { width, height } = img
    if (width > height && width > MAX_DIMENSION) {
      height = Math.round((height * MAX_DIMENSION) / width)
      width = MAX_DIMENSION
    } else if (height > MAX_DIMENSION) {
      width = Math.round((width * MAX_DIMENSION) / height)
      height = MAX_DIMENSION
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)

    let quality = JPEG_QUALITY
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > MAX_BASE64_BYTES && quality > 0.2) {
      quality -= 0.1
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    if (dataUrl.length > MAX_BASE64_BYTES) {
      throw new Error('รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกรูปอื่น')
    }

    return dataUrl
  } finally {
    URL.revokeObjectURL(img.src)
  }
}
