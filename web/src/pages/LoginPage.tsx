import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../auth/authStore'
import { ApiError } from '../lib/api'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Eroare la conectare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-purple">TrainBot</h1>
          <p className="text-text-secondary text-sm mt-1">Conectare profesor</p>
        </div>
        <label className="block">
          <span className="text-sm text-text-secondary">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple focus:ring-1 focus:ring-primary-purple outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Parolă</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple focus:ring-1 focus:ring-primary-purple outline-none"
          />
        </label>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-purple text-white font-semibold py-2.5 rounded-lg hover:bg-secondary-purple transition disabled:opacity-50"
        >
          {loading ? 'Se conectează...' : 'Intră'}
        </button>
        <p className="text-center text-sm text-text-secondary">
          Nu ai cont?{' '}
          <Link to="/signup" className="text-primary-purple font-semibold hover:underline">
            Creează unul nou
          </Link>
        </p>
      </form>
    </div>
  )
}
