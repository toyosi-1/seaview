// Client-side signature cleanup: takes a photo/scan of a signature (ink on paper,
// often with an off-white/shadowed background) and produces a neat, transparent
// PNG containing only the ink strokes. Uses Otsu thresholding on luminance to
// separate ink from paper, applies a soft-edged alpha mask for smooth anti-aliased
// strokes, then auto-crops to the signature's bounding box.

const MAX_DIMENSION = 1200
const EDGE_BAND = 18 // soft transition width around the threshold, in luminance units
const CROP_PADDING = 16 // px padding kept around the detected ink bounds

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function otsuThreshold(histogram: number[], total: number): number {
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]

  let sumB = 0
  let weightB = 0
  let maxVariance = 0
  let threshold = 128

  for (let t = 0; t < 256; t++) {
    weightB += histogram[t]
    if (weightB === 0) continue
    const weightF = total - weightB
    if (weightF === 0) break

    sumB += t * histogram[t]
    const meanB = sumB / weightB
    const meanF = (sum - sumB) / weightF
    const betweenVariance = weightB * weightF * (meanB - meanF) * (meanB - meanF)

    if (betweenVariance > maxVariance) {
      maxVariance = betweenVariance
      threshold = t
    }
  }

  return threshold
}

async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Cleans up a photographed/scanned signature by removing the paper background,
 * softening jagged edges, and cropping tightly around the ink. Returns a
 * transparent PNG blob. Falls back to the original file if processing fails
 * or no ink is detected.
 */
export async function cleanSignatureImage(file: File | Blob): Promise<Blob> {
  try {
    const img = await loadImage(file)

    // Downscale large photos for performance, preserving aspect ratio.
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return file instanceof Blob ? file : file

    ctx.drawImage(img, 0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height)
    const { data } = imageData

    // Build a luminance histogram (skip already-transparent pixels).
    const histogram = new Array(256).fill(0)
    let opaqueCount = 0
    const lumBuffer = new Uint8ClampedArray(width * height)

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const alpha = data[i + 3]
      if (alpha < 10) {
        lumBuffer[p] = 255
        continue
      }
      const lum = luminance(data[i], data[i + 1], data[i + 2])
      lumBuffer[p] = lum
      histogram[Math.round(lum)]++
      opaqueCount++
    }

    if (opaqueCount === 0) return file instanceof Blob ? file : file

    const threshold = otsuThreshold(histogram, opaqueCount)
    const tLow = Math.max(0, threshold - EDGE_BAND)
    const tHigh = Math.min(255, threshold + EDGE_BAND)
    const range = Math.max(1, tHigh - tLow)

    let minX = width, minY = height, maxX = -1, maxY = -1

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        const i = p * 4
        const lum = lumBuffer[p]

        let alpha: number
        if (lum <= tLow) alpha = 255
        else if (lum >= tHigh) alpha = 0
        else alpha = Math.round(((tHigh - lum) / range) * 255)

        data[i + 3] = alpha

        if (alpha > 20) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    if (maxX < 0) {
      // No ink detected — bail out to the original file rather than returning blank.
      return file instanceof Blob ? file : file
    }

    ctx.putImageData(imageData, 0, 0)

    // Auto-crop tightly around the detected ink, with a little breathing room.
    const cropX = Math.max(0, minX - CROP_PADDING)
    const cropY = Math.max(0, minY - CROP_PADDING)
    const cropW = Math.min(width, maxX + CROP_PADDING) - cropX
    const cropH = Math.min(height, maxY + CROP_PADDING) - cropY

    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = cropW
    cropCanvas.height = cropH
    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return file instanceof Blob ? file : file

    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

    return await new Promise((resolve) => {
      cropCanvas.toBlob((blob) => resolve(blob ?? (file instanceof Blob ? file : file)), 'image/png')
    })
  } catch {
    return file instanceof Blob ? file : file
  }
}
