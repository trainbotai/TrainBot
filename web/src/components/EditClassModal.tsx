import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'

export default function EditClassModal({ open, onClose, classId, initial }: {
  open: boolean
  onClose: () => void
  classId: string
  initial: { name: string; description: string | null }
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description ?? '')
  const [error, setError] = useState<string | null>(null)

  // Componenta e montată permanent în ClassDetailPage; fără reset la deschidere
  // ar afișa valorile de la primul mount (stale) după o editare + redeschidere.
  useEffect(() => {
    if (open) {
      setName(initial.name)
      setDescription(initial.description ?? '')
      setError(null)
    }
  }, [open, initial.name, initial.description])

  const update = useMutation({
    mutationFn: () =>
      apiFetch(
        `/teacher/classes/${classId}`,
        // trimitem description explicit (inclusiv '') ca golirea să persiste;
        // undefined ar face backend-ul să păstreze valoarea veche.
        { method: 'PATCH', body: JSON.stringify({ name: name.trim(), description: description.trim() }) },
        accessToken ?? undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      qc.invalidateQueries({ queryKey: ['classes', classId] })
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  const archive = useMutation({
    mutationFn: () =>
      apiFetch(`/teacher/classes/${classId}`, { method: 'DELETE' }, accessToken ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      onClose()
      navigate('/') // navigare SPA, nu full reload
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Editează clasa">
      <form onSubmit={(e) => { e.preventDefault(); setError(null); update.mutate() }} className="space-y-3">
        <label className="block">
          <span className="text-sm text-text-secondary">Nume</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={1} maxLength={100}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Descriere</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50">Anulează</button>
          <button type="submit" disabled={update.isPending} className="flex-1 bg-primary-purple text-white font-semibold py-2 rounded-lg disabled:opacity-50">
            {update.isPending ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
        <button type="button" onClick={() => { if (confirm('Sigur arhivezi clasa?')) archive.mutate() }}
          disabled={archive.isPending}
          className="w-full text-sm text-danger hover:underline pt-2">
          {archive.isPending ? 'Se arhivează...' : 'Arhivează clasa'}
        </button>
      </form>
    </Modal>
  )
}
