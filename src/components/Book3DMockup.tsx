import { BookOpen } from 'lucide-react'

interface Book3DMockupProps {
  coverUrl: string | null
  title: string
  className?: string
}

export function Book3DMockup({ coverUrl, title, className }: Book3DMockupProps) {
  return (
    <div className={`group relative [perspective:1000px] ${className ?? ''}`}>
      <div className="relative transition-transform duration-500 group-hover:[transform:rotateY(-15deg)] [transform-style:preserve-3d]">
        {/* Book front cover */}
        <div className="relative aspect-[2/3] w-48 md:w-56 rounded-r-lg rounded-l-sm overflow-hidden shadow-2xl [transform-style:preserve-3d]">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="size-full object-cover" />
          ) : (
            <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-6">
              <BookOpen className="size-12 text-primary/40 mb-3" />
              <span className="text-sm text-muted-foreground text-center font-medium">{title}</span>
            </div>
          )}
        </div>
        {/* Book spine - right edge */}
        <div
          className="absolute inset-y-0 -right-2 w-2 bg-gradient-to-l from-primary/80 to-primary/40 [transform:rotateY(90deg)] [transform-origin:left_center] rounded-r-sm"
          aria-hidden="true"
        />
        {/* Book pages - left edge */}
        <div
          className="absolute inset-y-0.5 -left-1.5 w-1.5 bg-gradient-to-r from-muted-foreground/30 to-background [transform:rotateY(-90deg)] [transform-origin:right_center] rounded-l-sm"
          aria-hidden="true"
        />
      </div>
      {/* Shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-3 w-3/4 rounded-full bg-black/20 blur-md" aria-hidden="true" />
    </div>
  )
}
