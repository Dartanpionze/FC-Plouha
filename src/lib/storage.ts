import { supabase } from '@/lib/supabase'

export function getStoragePathFromPublicUrl(
  bucket: string,
  publicUrl: string | null | undefined,
) {
  if (!publicUrl) return null

  const marker = `/storage/v1/object/public/${bucket}/`
  const index = publicUrl.indexOf(marker)

  if (index === -1) return null

  const encodedPath = publicUrl.slice(index + marker.length)

  try {
    return decodeURIComponent(encodedPath)
  } catch {
    return encodedPath
  }
}

export async function removeStorageFile(
  bucket: string,
  publicUrl: string | null | undefined,
) {
  const path = getStoragePathFromPublicUrl(bucket, publicUrl)

  if (!path) return

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error(
      `Impossible de supprimer le fichier du bucket ${bucket}:`,
      error,
    )
  }
}

export async function removeStorageFiles(
  bucket: string,
  publicUrls: Array<string | null | undefined>,
) {
  const paths = publicUrls
    .map((url) => getStoragePathFromPublicUrl(bucket, url))
    .filter((path): path is string => Boolean(path))

  if (!paths.length) return

  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    console.error(
      `Impossible de supprimer certains fichiers du bucket ${bucket}:`,
      error,
    )
  }
}
