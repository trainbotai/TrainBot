import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { LLMSessionDetailWithQueries } from '../lib/llmTypes'
import VersionSelector from '../components/VersionSelector'
import ChatTranscript from '../components/ChatTranscript'

export default function LLMSessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [selectedVersion, setSelectedVersion] = useState<number | 'all'>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['llm-session', id, selectedVersion],
    queryFn: () => {
      const versionParam = selectedVersion === 'all' ? '' : `?version=${selectedVersion}`
      return apiFetch<LLMSessionDetailWithQueries>(
        `/teacher/llm/sessions/${id}${versionParam}`,
        {},
        accessToken ?? undefined,
      )
    },
    enabled: !!id,
  })

  if (isLoading) {
    return <p className="text-text-secondary">Se încarcă sesiunea...</p>
  }
  if (error) {
    return (
      <div>
        <p className="text-danger mb-2">
          {error instanceof ApiError ? error.message : 'Eroare la încărcare'}
        </p>
        <Link to="/" className="text-primary-purple hover:underline">
          ← Înapoi la dashboard
        </Link>
      </div>
    )
  }
  if (!data) return null

  const examples =
    selectedVersion === 'all'
      ? data.versions[data.versions.length - 1]?.examples ?? []
      : data.versions.find((v) => v.versionNumber === selectedVersion)?.examples ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-text-secondary hover:underline">
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mt-2">{data.name}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {data.versionsCount} versiuni · {data.queriesCount} mesaje
          {data.flaggedCount > 0 && (
            <span className="ml-2 text-warning font-semibold">
              {data.flaggedCount} flagged
            </span>
          )}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Versiunea
        </h2>
        <VersionSelector
          versions={data.versions}
          selected={selectedVersion}
          onSelect={setSelectedVersion}
        />
      </section>

      {examples.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Exemple folosite în {selectedVersion === 'all' ? 'versiunea curentă' : `V${selectedVersion}`}
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            {examples.map((ex, i) => (
              <div key={i} className="text-sm">
                <p className="text-text-secondary">
                  <span className="font-semibold">Întrebare:</span> {ex.user}
                </p>
                <p className="text-text-primary mt-1">
                  <span className="font-semibold text-text-secondary">Răspuns:</span> {ex.ai}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Conversații
        </h2>
        <ChatTranscript queries={data.queries} />
      </section>
    </div>
  )
}
