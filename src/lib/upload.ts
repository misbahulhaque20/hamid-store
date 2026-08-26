import { supabase } from '@/lib/supabase'

/**
 * Upload an image to Supabase Storage and return the public URL.
 * Used for book covers, page previews, author photos, store logo.
 */
export async function uploadImage(file: File, bucket: 'book-covers' | 'book-pages' | 'author-photos'): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${bucket}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(`আপলোড ব্যর্থ: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

/**
 * Upload a PDF file to the private ebooks bucket.
 * Returns the storage path (not a public URL) — use getSignedEbookUrl() to read.
 */
export async function uploadPdf(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'pdf'
  const fileName = `ebooks/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const { error } = await supabase.storage.from('ebooks').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(`PDF আপলোড ব্যর্থ: ${error.message}`)

  return fileName
}

/**
 * Get a signed URL for reading a private ebook PDF.
 * Valid for 1 hour.
 */
export async function getSignedEbookUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('ebooks').createSignedUrl(path, 3600)
  if (error) throw new Error(`PDF URL তৈরি ব্যর্থ: ${error.message}`)
  return data.signedUrl
}

/**
 * Delete a file from storage by its path.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path])
}
