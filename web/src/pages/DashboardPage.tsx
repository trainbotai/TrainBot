import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../lib/api'
import { useAuthStore } from '../auth/authStore'
import type { ClassSummary } from '../lib/types'
import CreateClassModal from '../components/CreateClassModal'
import StatsCard from '../components/StatsCard'

export default function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [openCreate, setOpenCreate] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiFetch<{ data: ClassSummary[] }>('/teacher/classes', {}, accessToken ?? undefined),
  })

  return (
    <div>
      <StatsCard />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Clasele mele</h1>
        <button onClick={() => setOpenCreate(true)}
          className="bg-primary-purple text-white font-semibold px-4 py-2 rounded-lg hover:bg-secondary-purple transition">
          + Clasă nouă
        </button>
      </div>

      {isLoading && <p className="text-text-secondary">Se încarcă...</p>}
      {error && <p className="text-danger">{error instanceof ApiError ? error.message : 'Eroare'}</p>}

      {data && data.data.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-primary-purple/30">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Bun venit la TrainBot!</h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Creează prima ta clasă, apoi adaugă elevii. Fiecare clasă primește un cod unic — elevii îl folosesc pentru a se conecta din aplicația iOS.
          </p>
          <button
            onClick={() => setOpenCreate(true)}
            className="bg-primary-purple text-white font-semibold px-6 py-3 rounded-lg hover:bg-secondary-purple transition"
          >
            Creează prima clasă
          </button>
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((c) => (
            <Link key={c.id} to={`/classes/${c.id}`}
              className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-primary-purple transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-text-primary">{c.name}</h3>
                <span className="text-xs font-mono bg-surface-light text-primary-purple px-2 py-1 rounded">{c.code}</span>
              </div>
              {c.description && <p className="text-text-secondary text-sm mb-3">{c.description}</p>}
              <p className="text-text-secondary text-xs">{c._count.students} elevi</p>
            </Link>
          ))}
        </div>
      )}

      <CreateClassModal open={openCreate} onClose={() => setOpenCreate(false)} />
    </div>
  )
}
