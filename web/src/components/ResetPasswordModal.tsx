import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from './Modal'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'

export default function ResetPasswordModal({ open, onClose, studentId, classId }: {
  open: boolean
  onClose: () => void
  studentId: string
  classId: string
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(
        `/teacher/students/${studentId}/reset-password`,
        { method: 'POST', body: JSON.stringify({ newPassword }) },
        accessToken ?? undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes', classId] })
      setDone(true)
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  function handleClose() {
    setNewPassword('')
    setError(null)
    setDone(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Resetează parola">
      {done ? (
        <div className="space-y-3">
          <p className="text-success">Parola a fost schimbată cu succes.</p>
          <button onClick={handleClose} className="w-full bg-primary-purple text-white font-semibold py-2 rounded-lg">OK</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate() }} className="space-y-3">
          <label className="block">
            <span className="text-sm text-text-secondary">Parolă nouă (min 6 caractere)</span>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} maxLength={50}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
          </label>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50">Anulează</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-primary-purple text-white font-semibold py-2 rounded-lg disabled:opacity-50">
              {mutation.isPending ? 'Se salvează...' : 'Resetează'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
