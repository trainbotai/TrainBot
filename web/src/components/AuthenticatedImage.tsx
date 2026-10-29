import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../auth/authStore'
import { apiFetchBlob } from '../lib/api'

/**
 * Renders <img> for a backend-served image that requires Bearer auth.
 * Fetches as blob, creates object URL, cleans up on unmount.
 */
export default function AuthenticatedImage({
  imageId,
  alt,
  className,
}: {
  imageId: string
  alt: string
  className?: string
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  const { data: blob, isLoading, error } = useQuery({
    queryKey: ['image-blob', imageId],
    queryFn: () =>
      // token-ul curent din store (nu din closure) ca să prindă și refresh-ul
      apiFetchBlob(`/ml/images/${imageId}`, useAuthStore.getState().accessToken ?? undefined),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!accessToken,
  })

  useEffect(() => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  if (isLoading) {
    return <div className={`${className ?? ''} bg-surface-light animate-pulse`} aria-label="loading" />
  }
  if (error || !objectUrl) {
    return (
      <div
        className={`${className ?? ''} bg-gray-100 flex items-center justify-center text-text-secondary text-xs`}
        aria-label="image error"
      >
        ?
      </div>
    )
  }
  return <img src={objectUrl} alt={alt} className={className} loading="lazy" />
}
