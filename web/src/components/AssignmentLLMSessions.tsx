import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { LLMAssignmentSessionsResponse } from '../lib/llmTypes'

export default function AssignmentLLMSessions({ assignmentId }: { assignmentId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data, isLoading, error } = useQuery({
    queryKey: ['llm-assignment-sessions', assignmentId],
    queryFn: () =>
      apiFetch<LLMAssignmentSessionsResponse>(
        `/teacher/llm/assignments/${assignmentId}/sessions`,
        {},
        accessToken ?? undefined,
      ),
  })

  if (isLoading) {
    return <p className="text-text-secondary text-xs mt-3">Se încarcă sesiunile elevilor...</p>
  }
  if (error) {
    return (
      <p className="text-danger text-xs mt-3">
        {error instanceof ApiError ? error.message : 'Eroare la încărcare'}
      </p>
    )
  }

  const sessions = data?.sessions ?? []

  if (sessions.length === 0) {
    return (
      <p className="text-text-secondary text-xs mt-3">
        Niciun elev nu a creat încă un bot pentru această temă.
      </p>
    )
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
        Sesiuni elevi ({sessions.length})
      </h4>
      <div className="space-y-1.5">
        {sessions.map((s) => (
          <Link
            key={s.id}
            to={`/llm-sessions/${s.id}`}
            className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
              <p className="text-xs text-text-secondary">
                v{s.currentVersionNumber} · {s.queriesCount} mesaje
                {s.flaggedCount > 0 && (
                  <span className="ml-2 text-warning font-semibold">
                    {s.flaggedCount} flagged
                  </span>
                )}
              </p>
            </div>
            <span className="text-text-secondary text-xs">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
