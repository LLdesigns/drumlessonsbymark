import { supabase } from './supabase'

const BUCKET = 'studio-media'

export async function uploadStudioMedia(
  userId: string,
  file: File,
  subfolder = 'lessons'
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${userId}/${subfolder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  // Private bucket — use signed URL for access
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7)
  if (signError) throw signError
  return signed.signedUrl
}

export async function getSignedMediaUrl(pathOrUrl: string): Promise<string> {
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pathOrUrl, 3600)
  if (error) throw error
  return data.signedUrl
}
