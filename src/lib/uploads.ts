const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_SIZE_LABEL = '5 Mo'

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
