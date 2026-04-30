import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { ClassDetail } from '../lib/types'
import StudentRow from '../components/StudentRow'
import AddStudentModal from '../components/AddStudentModal'
import BulkAddStudentsModal from '../components/BulkAddStudentsModal'
import EditClassModal from '../components/EditClassModal'

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [openAddStudent, setOpenAddStudent] = useState(false)
  const [openBulk, setOpenBulk] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['classes', classId],
    queryFn: () => apiFetch<ClassDetail>(`/teacher/classes/${classId}`, {}, accessToken ?? undefined),
    enabled: !!classId,
  })

  if (isLoading) return <p className="text-text-secondary">Se încarcă...</p>
  if (error) return <p className="text-danger">{error instanceof ApiError ? error.message : 'Eroare'}</p>
  if (!data) return null

  return (
    <div>
      <Link to="/" className="text-primary-purple text-sm hover:underline">← Înapoi la clase</Link>
      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-text-primary">{data.name}</h1>
            <span className="text-sm font-mono bg-surface-light text-primary-purple px-3 py-1 rounded">{data.code}</span>
          </div>
          {data.description && <p className="text-text-secondary">{data.description}</p>}
        </div>
        <button onClick={() => setOpenEdit(true)} className="text-sm text-primary-purple hover:underline">
          Editează
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-text-primary">Elevi ({data.students.length})</h2>
          <div className="flex gap-2">
            <button onClick={() => setOpenBulk(true)} className="text-sm text-text-secondary hover:text-text-primary">
              + În grup
            </button>
            <button onClick={() => setOpenAddStudent(true)} className="bg-primary-purple text-white text-sm font-semibold px-3 py-1.5 rounded-lg">
              + Elev
            </button>
          </div>
        </div>
        {data.students.length === 0 && (
          <p className="text-text-secondary text-center py-8 text-sm">Nu ai elevi. Adaugă primul!</p>
        )}
        {data.students.length > 0 && (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Utilizator</th>
                <th className="text-left px-5 py-2 font-medium">Nume</th>
                <th className="text-right px-5 py-2 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <StudentRow key={s.id} studentId={s.id} username={s.username} displayName={s.displayName} classId={classId!} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddStudentModal open={openAddStudent} onClose={() => setOpenAddStudent(false)} classId={classId!} />
      <BulkAddStudentsModal open={openBulk} onClose={() => setOpenBulk(false)} classId={classId!} />
      <EditClassModal open={openEdit} onClose={() => setOpenEdit(false)} classId={classId!} initial={{ name: data.name, description: data.description }} />
    </div>
  )
}
