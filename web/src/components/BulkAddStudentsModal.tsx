import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from './Modal'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'

interface ParsedStudent { username: string; password: string; displayName?: string }

function parseCSV(input: string): ParsedStudent[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(',').map((p) => p.trim())
      const [username, password, displayName] = parts
      return { username: username ?? '', password: password ?? '', displayName: displayName || undefined }
    })
}

export default function BulkAddStudentsModal({ open, onClose, classId }: { open: boolean; onClose: () => void; classId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const parsed = parseCSV(text)
  const valid = parsed.length > 0 && parsed.every((s) => s.username.length >= 2 && s.password.length >= 6)

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(
        `/teacher/classes/${classId}/students/bulk`,
        { method: 'POST', body: JSON.stringify({ students: parsed }) },
        accessToken ?? undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes', classId] })
      setText('')
      onClose()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Eroare'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Adaugă elevi în grup">
      <form onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate() }} className="space-y-3">
        <p className="text-sm text-text-secondary">
          Format CSV (un elev pe linie): <code>utilizator,parola,nume</code>
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={'ana,parola123,Ana Popescu\nion.pop,parola456,Ion Pop'}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-purple outline-none"
        />
        <p className="text-xs text-text-secondary">{parsed.length} elevi detectați {!valid && parsed.length > 0 && '— verifică formatul (min. 2 char user, 6 char parolă)'}</p>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-text-secondary hover:bg-gray-50">Anulează</button>
          <button type="submit" disabled={!valid || mutation.isPending} className="flex-1 bg-primary-purple text-white font-semibold py-2 rounded-lg disabled:opacity-50">
            {mutation.isPending ? 'Se adaugă...' : `Adaugă ${parsed.length}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
