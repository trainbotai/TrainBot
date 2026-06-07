import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { LLMReportsResponse } from '../lib/llmTypes'

export default function LLMReportsList() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['llm-reports'],
    queryFn: () =>
      apiFetch<LLMReportsResponse>('/teacher/llm/reports', {}, accessToken ?? undefined),
    refetchInterval: 30_000,
  })

  const markReviewed = useMutation({
    mutationFn: (reportId: string) =>
      apiFetch(
        `/teacher/llm/reports/${reportId}`,
        { method: 'PATCH', body: JSON.stringify({ reviewed: true }) },
        accessToken ?? undefined,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['llm-reports'] }),
  })

  if (isLoading) return <p className="text-text-secondary">Se încarcă rapoartele...</p>
  if (error) {
    return (
      <p className="text-danger">
        {error instanceof ApiError ? error.message : 'Eroare'}
      </p>
    )
  }

  const reports = data?.reports ?? []
  const unreviewed = reports.filter((r) => !r.reviewed)
  const reviewed = reports.filter((r) => r.reviewed)

  if (reports.length === 0) {
    return <p className="text-text-secondary">Niciun raport primit.</p>
  }

  return (
    <div className="space-y-6">
      {unreviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Nerevizuite ({unreviewed.length})
          </h2>
          <div className="space-y-2">
            {unreviewed.map((r) => (
              <div key={r.id} className="bg-white border border-warning rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-text-primary">{r.studentName}</span>
                      <span className="text-text-secondary"> a raportat </span>
                      <Link
                        to={`/llm-sessions/${r.sessionId}`}
                        className="text-primary-purple font-semibold hover:underline"
                      >
                        {r.sessionName}
                      </Link>
                    </p>
                    {r.reason ? (
                      <p className="text-sm text-text-secondary mt-1 italic">"{r.reason}"</p>
                    ) : (
                      <p className="text-xs text-text-secondary mt-1">(fără comentariu)</p>
                    )}
                    <p className="text-xs text-text-secondary mt-2">
                      {new Date(r.createdAt).toLocaleString('ro-RO')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      to={`/llm-sessions/${r.sessionId}`}
                      className="text-xs px-3 py-1.5 bg-primary-purple text-white rounded-lg text-center hover:opacity-90"
                    >
                      Vezi sesiunea
                    </Link>
                    <button
                      onClick={() => markReviewed.mutate(r.id)}
                      disabled={markReviewed.isPending}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-text-secondary hover:bg-gray-50 disabled:opacity-50"
                    >
                      Marchează revizuit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {reviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Revizuite ({reviewed.length})
          </h2>
          <div className="space-y-2">
            {reviewed.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 opacity-70">
                <p className="text-sm">
                  <span className="font-semibold text-text-primary">{r.studentName}</span>
                  <span className="text-text-secondary"> · </span>
                  <Link
                    to={`/llm-sessions/${r.sessionId}`}
                    className="text-primary-purple hover:underline"
                  >
                    {r.sessionName}
                  </Link>
                </p>
                {r.reason && (
                  <p className="text-xs text-text-secondary mt-1 italic">"{r.reason}"</p>
                )}
                <p className="text-xs text-text-secondary mt-1">
                  Revizuit pe {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('ro-RO') : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
