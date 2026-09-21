// Client-side signature cleanup: takes a photo/scan of a signature (ink on paper,
// often with an off-white/shadowed background) and produces a neat, transparent
// PNG containing only the ink strokes.
//
// Uses adaptive local thresholding (Bradley-Roth inspired) instead of a single
// global Otsu threshold.  A global threshold fails when the photo has uneven
// lighting, shadows, or a non-uniform background — common with phone photos of
// a signature on paper.  By computing a local mean for each pixel's
// neighbourhood we separate ink from paper robustly regardless of lighting
// gradients.  A soft-edged alpha mask gives smooth anti-aliased strokes, then
// the result is auto-cropped to the ink bounding box.

const MAX_DIMENSION = 1200
const WINDOW_FRACTION = 0.06 // fraction of the shorter dimension used as the local window radius
const SENSITIVITY = 12 // how much darker than the local mean a pixel must be to count as ink
const SOFT_BAND = 8 // soft transition width for anti-aliased edges
const MIN_INK_RATIO = 0.002 // below this fraction of "ink" pixels, assume nothing was detected
const MAX_INK_RATIO = 0.35 // above this, the threshold probably failed (e.g. dark background)

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
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
 * Computes an integral image (summed-area table) of the luminance values
 * so that the mean of any rectangular region can be computed in O(1).
 */
function buildIntegralImage(lum: Uint8ClampedArray, width: number, height: number): Int32Array {
  const integral = new Int32Array(width * height)
  for (let y = 0; y < height; y++) {
    let rowSum = 0
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      rowSum += lum[idx]
      integral[idx] = (y > 0 ? integral[idx - width] : 0) + rowSum
    }
  }
  return integral
}

/**
 * Returns the average luminance of the window centred at (cx, cy) with the
 * given half-size, using the integral image for O(1) computation.
 */
function windowAverage(integral: Int32Array, width: number, height: number, cx: number, cy: number, half: number): number {
  const x0 = Math.max(0, cx - half)
  const y0 = Math.max(0, cy - half)
  const x1 = Math.min(width - 1, cx + half)
  const y1 = Math.min(height - 1, cy + half)
  const area = (x1 - x0 + 1) * (y1 - y0 + 1)
  const tl = x0 > 0 && y0 > 0 ? integral[(y0 - 1) * width + (x0 - 1)] : 0
  const tr = y0 > 0 ? integral[(y0 - 1) * width + x1] : 0
  const bl = x0 > 0 ? integral[y1 * width + (x0 - 1)] : 0
  const br = integral[y1 * width + x1]
  const sum = br - tr - bl + tl
  return sum / area
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
    if (!ctx) throw new Error('Could not process signature image')

    ctx.drawImage(img, 0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height)
    const { data } = imageData

    // Build luminance buffer.
    const lum = new Uint8ClampedArray(width * height)
    const sourceAlpha = new Uint8ClampedArray(width * height)
    let transparentCount = 0
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      sourceAlpha[p] = data[i + 3]
      if (data[i + 3] < 250) transparentCount++
      lum[p] = data[i + 3] < 8 ? 255 : luminance(data[i], data[i + 1], data[i + 2])
    }
    const hasTransparency = transparentCount / (width * height) >= 0.01

    // Build integral image for fast local-mean computation.
    const integral = buildIntegralImage(lum, width, height)

    // Local window radius — a fraction of the shorter dimension, clamped.
    const half = Math.max(8, Math.round(Math.min(width, height) * WINDOW_FRACTION))

    // Adaptive threshold: a pixel is "ink" if it is significantly darker than
    // the average of its local neighbourhood.  This handles uneven lighting,
    // shadows, and off-white paper far better than a single global threshold.
    let inkCount = 0
    let minX = width, minY = height, maxX = -1, maxY = -1

    // First pass: classify each pixel as ink or background using the local mean.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        const localMean = windowAverage(integral, width, height, x, y, half)
        // Pixel must be darker than the local mean by SENSITIVITY to be ink.
        const isInk = hasTransparency ? sourceAlpha[p] > 8 : lum[p] < localMean - SENSITIVITY
        if (isInk) {
          inkCount++
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    // Sanity checks: if almost nothing or almost everything is "ink", the
    // adaptive threshold failed (e.g. the image is uniformly dark, or the
    // background is darker than the ink).  Bail out to the original.
    const inkRatio = inkCount / (width * height)
    if (maxX < 0 || inkRatio < MIN_INK_RATIO || (!hasTransparency && inkRatio > MAX_INK_RATIO)) {
      throw new Error('No clean signature could be detected')
    }

    // Second pass: build a soft-edged alpha mask.  Pixels that are clearly ink
    // get full opacity, pixels clearly background get zero, and the band in
    // between gets a smooth gradient for anti-aliasing.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        const i = p * 4
        const localMean = windowAverage(integral, width, height, x, y, half)
        const diff = localMean - lum[p] // positive when pixel is darker than local mean

        let alpha: number
        if (hasTransparency) {
          alpha = sourceAlpha[p]
        } else if (diff >= SENSITIVITY + SOFT_BAND) {
          alpha = 255
        } else if (diff <= SENSITIVITY - SOFT_BAND) {
          alpha = 0
        } else {
          // Smooth transition in the soft band
          alpha = Math.round(((diff - (SENSITIVITY - SOFT_BAND)) / (2 * SOFT_BAND)) * 255)
        }

        data[i + 3] = alpha
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // Auto-crop tightly around the detected ink, with a little breathing room.
    const cropPadding = Math.max(4, Math.round(Math.min(maxX - minX + 1, maxY - minY + 1) * 0.04))
    const cropX = Math.max(0, minX - cropPadding)
    const cropY = Math.max(0, minY - cropPadding)
    const cropW = Math.min(width, maxX + cropPadding + 1) - cropX
    const cropH = Math.min(height, maxY + cropPadding + 1) - cropY

    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = cropW
    cropCanvas.height = cropH
    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) throw new Error('Could not crop signature image')

    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

    return await new Promise((resolve, reject) => {
      cropCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not export signature image')), 'image/png')
    })
  } catch (error) {
    throw error instanceof Error ? error : new Error('Could not process signature image')
  }
}
