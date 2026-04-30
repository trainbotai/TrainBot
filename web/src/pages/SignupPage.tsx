import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../auth/authStore'
import { ApiError } from '../lib/api'

export default function SignupPage() {
  const signup = useAuthStore((s) => s.signup)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signup({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        tenantName: tenantName.trim(),
        tenantSlug: tenantSlug.trim().toLowerCase(),
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Eroare la înregistrare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-3">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-primary-purple">TrainBot</h1>
          <p className="text-text-secondary text-sm mt-1">Cont nou — profesor + școală</p>
        </div>
        <label className="block">
          <span className="text-sm text-text-secondary">Nume profesor</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={1} maxLength={100}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Parolă (min 8 caractere)</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={100}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Nume școală/organizație</span>
          <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} required minLength={1} maxLength={100}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        <label className="block">
          <span className="text-sm text-text-secondary">Identificator scurt (lowercase, fără spații)</span>
          <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} required pattern="[a-z0-9-]+" minLength={2} maxLength={50}
            placeholder="scoala-ion-creanga"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-purple outline-none" />
        </label>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-primary-purple text-white font-semibold py-2.5 rounded-lg hover:bg-secondary-purple transition disabled:opacity-50">
          {loading ? 'Se creează...' : 'Creează cont'}
        </button>
        <p className="text-center text-sm text-text-secondary">
          Ai deja cont?{' '}
          <Link to="/login" className="text-primary-purple font-semibold hover:underline">
            Intră
          </Link>
        </p>
      </form>
    </div>
  )
}
