import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import ResetPasswordModal from './ResetPasswordModal'

export default function StudentRow({ studentId, username, displayName, classId }: {
  studentId: string
  username: string
  displayName: string | null
  classId: string
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [openReset, setOpenReset] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const del = useMutation({
    mutationFn: () =>
      apiFetch(`/teacher/students/${studentId}`, { method: 'DELETE' }, accessToken ?? undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes', classId] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-5 py-3 font-mono text-sm">{username}</td>
        <td className="px-5 py-3 text-sm text-text-secondary">{displayName ?? '—'}</td>
        <td className="px-5 py-3 text-right">
          <div className="flex justify-end gap-3 text-sm">
            <button onClick={() => setOpenReset(true)} className="text-primary-purple hover:underline">Resetează parola</button>
            <button onClick={() => { if (confirm(`Ștergi ${username}?`)) del.mutate() }}
              disabled={del.isPending}
              className="text-danger hover:underline">
              {del.isPending ? '...' : 'Șterge'}
            </button>
          </div>
          {error && <p className="text-danger text-xs">{error}</p>}
        </td>
      </tr>
      <ResetPasswordModal open={openReset} onClose={() => setOpenReset(false)} studentId={studentId} classId={classId} />
    </>
  )
}
