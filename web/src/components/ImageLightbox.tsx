import { useEffect } from 'react'
import AuthenticatedImage from './AuthenticatedImage'

interface ImageLightboxProps {
  open: boolean
  onClose: () => void
  imageId: string | null
  caption?: string
  /** Optional set for prev/next navigation */
  imageIds?: string[]
  onNavigate?: (id: string) => void
}

export default function ImageLightbox({
  open,
  onClose,
  imageId,
  caption,
  imageIds,
  onNavigate,
}: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (!imageIds || !imageId || !onNavigate) return
      const idx = imageIds.indexOf(imageId)
      if (idx < 0) return
      if (e.key === 'ArrowLeft' && idx > 0) onNavigate(imageIds[idx - 1]!)
      if (e.key === 'ArrowRight' && idx < imageIds.length - 1) onNavigate(imageIds[idx + 1]!)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, imageIds, imageId, onNavigate, onClose])

  if (!open || !imageId) return null

  const idx = imageIds?.indexOf(imageId) ?? -1
  const total = imageIds?.length ?? 0
  const canPrev = idx > 0
  const canNext = idx >= 0 && idx < total - 1

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
      onClick={onClose}
    >
      {canPrev && onNavigate && imageIds && (
        <button
          className="absolute left-4 text-white text-3xl px-3 py-2 hover:bg-white/10 rounded-full"
          onClick={(e) => { e.stopPropagation(); onNavigate(imageIds[idx - 1]!) }}
          aria-label="Imaginea anterioară"
        >
          ‹
        </button>
      )}

      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <AuthenticatedImage
          imageId={imageId}
          alt={caption ?? 'Imagine ML'}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
        />
        {caption && (
          <p className="text-white/80 mt-3 text-sm">
            {caption}
            {total > 0 && ` · ${idx + 1} / ${total}`}
          </p>
        )}
      </div>

      {canNext && onNavigate && imageIds && (
        <button
          className="absolute right-4 text-white text-3xl px-3 py-2 hover:bg-white/10 rounded-full"
          onClick={(e) => { e.stopPropagation(); onNavigate(imageIds[idx + 1]!) }}
          aria-label="Imaginea următoare"
        >
          ›
        </button>
      )}

      <button
        className="absolute top-4 right-4 text-white text-2xl px-3 py-1 hover:bg-white/10 rounded-full"
        onClick={onClose}
        aria-label="Închide"
      >
        ×
      </button>
    </div>
  )
}
