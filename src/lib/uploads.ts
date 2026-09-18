const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_SIZE_LABEL = '5 Mo'
const MAX_IMAGE_DIMENSION = 1920
const WEBP_QUALITY = 0.82

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function validateImageFile(file: File) {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return 'Format non autorisé. Utilisez une image JPG, PNG ou WebP.'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Image trop volumineuse. Taille maximale : ${MAX_IMAGE_SIZE_LABEL}.`
  }

  return null
}

export function createImageFileName(file: File) {
  const extension = extensionByMimeType[file.type]

  if (!extension) {
    throw new Error("Type d'image non pris en charge.")
  }

  const id =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 12)}`

  return `${id}.${extension}`
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/webp',
  quality?: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

/**
 * Redimensionne les grandes images avant leur envoi vers le stockage.
 * Les PNG restent en PNG afin de conserver leur transparence (logos compris).
 * En cas d'incompatibilité du navigateur, le fichier d'origine est conservé.
 */
export async function optimizeImageFile(file: File): Promise<File> {
  const validationError = validateImageFile(file)

  if (validationError) {
    throw new Error(validationError)
  }

  if (
    typeof document === 'undefined' ||
    typeof createImageBitmap !== 'function'
  ) {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const largestDimension = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestDimension)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const wasResized = width !== bitmap.width || height !== bitmap.height
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      bitmap.close()
      return file
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const outputType =
      file.type === 'image/png' ? 'image/png' : 'image/webp'
    const blob = await canvasToBlob(
      canvas,
      outputType,
      outputType === 'image/webp' ? WEBP_QUALITY : undefined,
    )

    if (!blob || (!wasResized && blob.size >= file.size)) {
      return file
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    const extension = outputType === 'image/png' ? 'png' : 'webp'

    return new File([blob], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    })
  } catch (error) {
    console.warn("L'image n'a pas pu être optimisée.", error)
    return file
  }
}
