import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { Assignment } from '../lib/types'
import Modal from './Modal'

function CreateAssignmentModal({
  open,
  onClose,
  classId,
}: { open: boolean; onClose: () => void; classId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const m = useMutation({
    mutationFn: () =>
      apiFetch(
        `/teacher/classes/${classId}/assignments`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          }),
        },
        accessToken ?? undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-assignments', classId] })
      setTitle(''); setDescription(''); setDueAt('')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Temă nouă">
      <form onSubmit={(e) => { e.preventDefault(); setError(null); m.mutate() }} className="space-y-3">
        <label className="block">
          <span className="text-sm text-text-secondary">Titlu</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={1} maxLength={200}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Descriere</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={1} maxLength={2000} rows={4}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Termen (opțional)</span>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50">Anulează</button>
          <button type="submit" disabled={m.isPending} className="flex-1 bg-primary-purple text-white font-semibold py-2 rounded-lg disabled:opacity-50">
            {m.isPending ? 'Se creează...' : 'Creează'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ClassAssignments({ classId }: { classId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [openCreate, setOpenCreate] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['class-assignments', classId],
    queryFn: () =>
      apiFetch<{ data: Assignment[] }>(
        `/teacher/classes/${classId}/assignments`,
        {},
        accessToken ?? undefined,
      ),
  })

  const archive = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/teacher/assignments/${id}`, { method: 'DELETE' }, accessToken ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-assignments', classId] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-text-primary">Teme</h2>
        <button onClick={() => setOpenCreate(true)} className="text-sm bg-primary-purple text-white font-semibold px-3 py-1.5 rounded-lg">
          + Temă nouă
        </button>
      </div>

      {isLoading && <p className="text-text-secondary text-sm">Se încarcă...</p>}
      {error && <p className="text-danger text-sm">{error instanceof ApiError ? error.message : 'Eroare'}</p>}

      {data && data.data.length === 0 && (
        <p className="text-text-secondary text-sm">Nicio temă încă. Creează prima ta temă pentru elevi.</p>
      )}

      <div className="space-y-2">
        {data?.data.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">{a.title}</h3>
                <p className="text-sm text-text-secondary mt-1 whitespace-pre-line">{a.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-secondary">
                  <span>📨 {a._count.submissions} predate</span>
                  {a.dueAt && <span>📅 {new Date(a.dueAt).toLocaleString('ro-RO')}</span>}
                </div>
              </div>
              <button
                onClick={() => { if (confirm(`Arhivezi tema "${a.title}"?`)) archive.mutate(a.id) }}
                disabled={archive.isPending}
                className="text-xs text-danger hover:underline shrink-0"
              >
                Arhivează
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreateAssignmentModal open={openCreate} onClose={() => setOpenCreate(false)} classId={classId} />
    </div>
  )
}
