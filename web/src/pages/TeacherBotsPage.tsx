import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { BotSummary, ClassSummary } from '../lib/types'
import BotModal from '../components/BotModal'

export default function TeacherBotsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<BotSummary | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['bots'],
    queryFn: () =>
      apiFetch<{ bots: BotSummary[] }>('/teacher/llm/bots', {}, accessToken ?? undefined),
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () =>
      apiFetch<{ data: ClassSummary[] }>('/teacher/classes', {}, accessToken ?? undefined),
  })

  const classMap = new Map<string, string>(
    (classesData?.data ?? []).map((c) => [c.id, c.name]),
  )

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/teacher/llm/bots/${id}`, { method: 'DELETE' }, accessToken ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }),
  })

  function openCreate() {
    setEditingBot(null)
    setModalOpen(true)
  }

  function openEdit(bot: BotSummary) {
    setEditingBot(bot)
    setModalOpen(true)
  }

  function handleDelete(bot: BotSummary) {
    if (confirm(`Ștergi botul "${bot.name}"? Acțiunea nu poate fi anulată.`)) {
      deleteMutation.mutate(bot.id)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-text-primary">Boți demo</h1>
        <button
          onClick={openCreate}
          className="bg-primary-purple text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary-purple transition"
        >
          + Bot nou
        </button>
      </div>

      {/* Helper text */}
      <p className="text-text-secondary text-sm mb-8 max-w-2xl">
        Boții demo sunt asistenți AI pe care îi configurezi cu o personalitate și exemple de conversație.
        Elevii tăi pot conversa cu ei direct din aplicație, pentru practică ghidată și sigură.
        Poți limita un bot la o singură clasă sau îl poți pune la dispoziția tuturor elevilor.
      </p>

      {isLoading && <p className="text-text-secondary">Se încarcă...</p>}
      {error && (
        <p className="text-danger">{error instanceof ApiError ? error.message : 'Eroare la încărcare'}</p>
      )}

      {/* Empty state */}
      {data && data.bots.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-primary-purple/30">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Niciun bot încă</h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Creează primul tău bot demo. Definește-i o personalitate și câteva exemple de cum ar trebui să răspundă,
            iar elevii vor putea conversa cu el din aplicație.
          </p>
          <button
            onClick={openCreate}
            className="bg-primary-purple text-white font-semibold px-6 py-3 rounded-lg hover:bg-secondary-purple transition"
          >
            Creează primul bot
          </button>
        </div>
      )}

      {/* Bot cards grid */}
      {data && data.bots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col gap-3"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-text-primary leading-tight">{bot.name}</h3>
                {bot.classId ? (
                  <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-primary-purple">
                    {classMap.get(bot.classId) ?? 'Clasă'}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary">
                    Toate clasele
                  </span>
                )}
              </div>

              {/* Instruction preview */}
              <p className="text-sm text-text-secondary line-clamp-3 flex-1">
                {bot.instruction}
              </p>

              {/* Examples count */}
              <p className="text-xs text-text-secondary">
                {bot.examples.length}{' '}
                {bot.examples.length === 1 ? 'exemplu' : 'exemple'} few-shot
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-1 border-t border-gray-100">
                <button
                  onClick={() => openEdit(bot)}
                  className="text-sm text-primary-purple hover:underline"
                >
                  Editează
                </button>
                <button
                  onClick={() => handleDelete(bot)}
                  disabled={deleteMutation.isPending}
                  className="text-sm text-danger hover:underline disabled:opacity-50"
                >
                  Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BotModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bot={editingBot}
      />
    </div>
  )
}
