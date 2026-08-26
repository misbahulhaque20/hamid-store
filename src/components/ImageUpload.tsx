import { useRef, useState, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadImage } from '@/lib/upload'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string) => void
  bucket?: 'book-covers' | 'book-pages' | 'author-photos'
  className?: string
  label?: string
  aspectRatio?: 'square' | 'portrait' | 'landscape'
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'book-covers',
  className,
  label = 'ছবি আপলোড করুন',
  aspectRatio = 'portrait',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি ফাইল আপলোড করুন')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবি ৫MB এর ছোট হতে হবে')
      return
    }
    setUploading(true)
    try {
      const url = await uploadImage(file, bucket)
      onChange(url)
      toast.success('ছবি আপলোড হয়েছে')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'আপলোড ব্যর্থ')
    } finally {
      setUploading(false)
    }
  }, [bucket, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'landscape' ? 'aspect-video' : 'aspect-[3/4]'

  if (value) {
    return (
      <div className={cn('relative group', aspectClass, className)}>
        <img src={value} alt={label} className="size-full rounded-lg border object-cover" />
        <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-white"
          >
            <Upload className="size-3" /> পরিবর্তন
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 rounded-md bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
          >
            <X className="size-3" /> মুছুন
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        aspectClass,
        'relative cursor-pointer rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground',
        dragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-accent/50',
        uploading && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs">আপলোড হচ্ছে...</span>
        </>
      ) : (
        <>
          <div className="rounded-full bg-primary/10 p-3">
            <ImageIcon className="size-5 text-primary" />
          </div>
          <span className="text-xs font-medium">{label}</span>
          <span className="text-[10px]">ক্লিক করুন বা ছবি টেনে আনুন</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}
