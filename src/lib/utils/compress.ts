import imageCompression from 'browser-image-compression'

const IMAGE_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
}

const SIGNATURE_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 400,
  useWebWorker: true,
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    return await imageCompression(file, IMAGE_OPTIONS)
  } catch {
    return file
  }
}

export async function compressSignature(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    return await imageCompression(file, SIGNATURE_OPTIONS)
  } catch {
    return file
  }
}

export async function compressFiles(files: FileList | File[]): Promise<File[]> {
  return Promise.all(
    Array.from(files).map(f => compressImage(f))
  )
}
