import { useRef, useState } from 'react'
import { Upload, FileText, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadPdf } from '@/lib/upload'
import { toast } from 'sonner'

interface PdfUploadProps {
  value: string | null
  onChange: (path: string) => void
  className?: string
}

export function PdfUpload({ value, onChange, className }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('শুধুমাত্র PDF ফাইল আপলোড করুন')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('PDF ৫০MB এর ছোট হতে হবে')
      return
    }
    setUploading(true)
    try {
      const path = await uploadPdf(file)
      onChange(path)
      toast.success('PDF আপলোড হয়েছে')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'আপলোড ব্যর্থ')
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <div className={cn('flex items-center gap-3 rounded-lg border bg-card p-3', className)}>
        <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
          <Check className="size-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-medium">PDF আপলোড হয়েছে</div>
          <div className="text-xs text-muted-foreground font-mono truncate">{value}</div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-primary hover:underline"
        >
          পরিবর্তন
        </button>
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-destructive hover:underline"
        >
          মুছুন
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={e => { e.preventDefault(); setDragging(false) }}
      className={cn(
        'flex items-center gap-3 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-all',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50',
        uploading && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {uploading ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : (
        <FileText className="size-5 text-muted-foreground" />
      )}
      <div className="flex-1 text-sm">
        <div className="font-medium">{uploading ? 'আপলোড হচ্ছে...' : 'PDF আপলোড করুন'}</div>
        <div className="text-xs text-muted-foreground">ক্লিক করুন বা টেনে আনুন (সর্বোচ্চ ৫০MB)</div>
      </div>
      <Upload className="size-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}
