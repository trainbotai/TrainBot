import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { ClassMLProject } from '../lib/types'

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diffMs / 60000)
  if (m < 1) return 'acum'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}z`
}

export default function ClassMLProjects({ classId }: { classId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data, isLoading, error } = useQuery({
    queryKey: ['class-ml', classId],
    queryFn: () =>
      apiFetch<{ data: ClassMLProject[] }>(
        `/teacher/classes/${classId}/ml-projects`,
        {},
        accessToken ?? undefined,
      ),
    refetchInterval: 30_000,
  })

  if (isLoading) return <p className="text-text-secondary text-sm">Se încarcă proiectele ML...</p>
  if (error)
    return (
      <p className="text-danger text-sm">
        {error instanceof ApiError ? error.message : 'Eroare ML'}
      </p>
    )
  if (!data || data.data.length === 0) {
    return (
      <p className="text-text-secondary text-sm">
        Niciun proiect sincronizat de elevi încă. Aplicația iOS va sincroniza automat când elevii lucrează.
      </p>
    )
  }

  // Group by student
  const byStudent = new Map<string, ClassMLProject[]>()
  for (const p of data.data) {
    const list = byStudent.get(p.student.id) ?? []
    list.push(p)
    byStudent.set(p.student.id, list)
  }

  return (
    <div className="space-y-4">
      {[...byStudent.entries()].map(([studentId, projects]) => {
        const s = projects[0]!.student
        const totalImages = projects.reduce(
          (acc, p) => acc + p.labels.reduce((a, l) => a + l.imageCount, 0),
          0,
        )
        return (
          <div key={studentId} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-text-primary">
                  {s.displayName ?? s.username}
                </h3>
                <p className="text-xs text-text-secondary font-mono">@{s.username}</p>
              </div>
              <p className="text-xs text-text-secondary">
                {projects.length} {projects.length === 1 ? 'proiect' : 'proiecte'} ·{' '}
                {totalImages} imagini
              </p>
            </div>
            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="border-l-2 border-primary-purple/30 pl-3 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{p.name}</span>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      {p.modelTrained && (
                        <span className="bg-success/10 text-success px-2 py-0.5 rounded">
                          model v{p.modelVersion}
                        </span>
                      )}
                      <span>{relativeTime(p.updatedAt)}</span>
                    </div>
                  </div>
                  {p.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {p.labels.map((l) => (
                        <span
                          key={l.name}
                          className="bg-surface-light text-text-secondary text-xs px-2 py-0.5 rounded"
                        >
                          {l.name} ({l.imageCount})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
