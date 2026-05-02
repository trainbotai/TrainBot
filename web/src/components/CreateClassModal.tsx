import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from './Modal'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { ClassSummary } from '../lib/types'

export default function CreateClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<ClassSummary>(
        '/teacher/classes',
        {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
        },
        accessToken ?? undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      setName('')
      setDescription('')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Clasă nouă">
      <form onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate() }} className="space-y-3">
        <label className="block">
          <span className="text-sm text-text-secondary">Nume clasă</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={1} maxLength={100}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Descriere (opțional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50">
            Anulează
          </button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 bg-primary-purple text-white font-semibold py-2 rounded-lg disabled:opacity-50">
            {mutation.isPending ? 'Se creează...' : 'Creează'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
