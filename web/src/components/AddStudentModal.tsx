import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from './Modal'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'

export default function AddStudentModal({ open, onClose, classId }: { open: boolean; onClose: () => void; classId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(
        `/teacher/classes/${classId}/students`,
        {
          method: 'POST',
          body: JSON.stringify({
            username: username.trim(),
            password,
            displayName: displayName.trim() || undefined,
          }),
        },
        accessToken ?? undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes', classId] })
      setUsername(''); setPassword(''); setDisplayName('')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Elev nou">
      <form onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate() }} className="space-y-3">
        <label className="block">
          <span className="text-sm text-text-secondary">Utilizator (litere, cifre, . - _)</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required pattern="[a-zA-Z0-9._-]+" minLength={2} maxLength={30}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Parolă (min 6 caractere)</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={50}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Nume afișat (opțional)</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50">Anulează</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 bg-primary-purple text-white font-semibold py-2 rounded-lg disabled:opacity-50">
            {mutation.isPending ? 'Se adaugă...' : 'Adaugă'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
