import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import AuthenticatedImage from '../components/AuthenticatedImage'
import ImageLightbox from '../components/ImageLightbox'

interface StudentDetailResponse {
  student: {
    id: string
    username: string
    displayName: string | null
    createdAt: string
    lastSeenAt: string | null
    class: { id: string; code: string; name: string }
  }
  stats: {
    projectCount: number
    trainedModelCount: number
    labelCount: number
    totalImages: number
  }
  projects: Array<{
    id: string
    name: string
    modelTrained: boolean
    modelVersion: number
    trainedAt: string | null
    updatedAt: string
    labels: Array<{
      id: string
      name: string
      imageCount: number
      images: Array<{ id: string; createdAt: string }>
    }>
  }>
}

function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'acum'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}z`
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [lightbox, setLightbox] = useState<{ id: string; ids: string[]; caption: string } | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () =>
      apiFetch<StudentDetailResponse>(
        `/teacher/students/${studentId}/detail`,
        {},
        accessToken ?? undefined,
      ),
    enabled: !!studentId,
    refetchInterval: 30_000,
  })

  if (isLoading) return <p className="text-text-secondary">Se încarcă...</p>
  if (error) return <p className="text-danger">{error instanceof ApiError ? error.message : 'Eroare'}</p>
  if (!data) return null

  const { student, stats, projects } = data

  return (
    <div>
      <Link to={`/classes/${student.class.id}`} className="text-primary-purple text-sm hover:underline">
        ← Înapoi la {student.class.name}
      </Link>

      <div className="mt-2 mb-6">
        <h1 className="text-3xl font-bold text-text-primary">
          {student.displayName ?? student.username}
        </h1>
        <p className="text-text-secondary">
          @{student.username} · {student.class.name} ({student.class.code})
          {student.lastSeenAt && ` · ultima activitate: ${relativeTime(student.lastSeenAt)}`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Proiecte" value={stats.projectCount} />
        <StatBox label="Modele antrenate" value={stats.trainedModelCount} />
        <StatBox label="Etichete" value={stats.labelCount} />
        <StatBox label="Imagini" value={stats.totalImages} />
      </div>

      <h2 className="font-bold text-text-primary mb-3">Proiecte ({projects.length})</h2>

      {projects.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <p className="text-text-secondary">
            {student.displayName ?? student.username} nu a sincronizat încă niciun proiect.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-text-primary">{p.name}</h3>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                {p.modelTrained && (
                  <span className="bg-success/10 text-success px-2 py-0.5 rounded">
                    model v{p.modelVersion}
                  </span>
                )}
                <span>{relativeTime(p.updatedAt)}</span>
              </div>
            </div>
            {p.labels.length === 0 && (
              <p className="text-text-secondary text-sm">Niciun label încă.</p>
            )}
            <div className="space-y-3">
              {p.labels.map((l) => (
                <div key={l.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-surface-light text-primary-purple text-xs px-2 py-0.5 rounded font-medium">
                      {l.name}
                    </span>
                    <span className="text-xs text-text-secondary">{l.imageCount} imagini</span>
                  </div>
                  {l.images.length > 0 && (
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
                      {l.images.map((img) => (
                        <button
                          key={img.id}
                          onClick={() =>
                            setLightbox({
                              id: img.id,
                              ids: l.images.map((i) => i.id),
                              caption: `${student.displayName ?? student.username} · ${p.name} · ${l.name}`,
                            })
                          }
                          className="block aspect-square overflow-hidden rounded hover:ring-2 hover:ring-primary-purple transition"
                        >
                          <AuthenticatedImage
                            imageId={img.id}
                            alt={l.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ImageLightbox
        open={lightbox !== null}
        onClose={() => setLightbox(null)}
        imageId={lightbox?.id ?? null}
        imageIds={lightbox?.ids}
        caption={lightbox?.caption}
        onNavigate={(id) => lightbox && setLightbox({ ...lightbox, id })}
      />
    </div>
  )
}
