import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { TeacherStats } from '../lib/types'

function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'acum'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}z`
}

function StatBox({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {hint && <p className="text-xs text-text-secondary mt-0.5">{hint}</p>}
    </div>
  )
}

export default function StatsCard() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: () => apiFetch<TeacherStats>('/teacher/stats', {}, accessToken ?? undefined),
    refetchInterval: 60_000,
  })

  if (!data) return null

  const lastSyncText = data.lastSync
    ? `${data.lastSync.student.displayName ?? data.lastSync.student.username} · ${relativeTime(data.lastSync.updatedAt)}`
    : 'încă nicio activitate'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <StatBox label="Clase" value={data.classCount} />
      <StatBox label="Elevi" value={data.studentCount} />
      <StatBox label="Proiecte ML" value={data.projectCount} />
      <StatBox label="Imagini 24h" value={data.imagesLast24h} hint={`Ultima activitate: ${lastSyncText}`} />
    </div>
  )
}
