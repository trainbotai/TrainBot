import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../auth/authStore'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  async function onLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary-purple">TrainBot</Link>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary text-sm">{user?.name}</span>
            <button onClick={onLogout} className="text-sm text-danger hover:underline">
              Deconectare
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-text-secondary">
          © 2026 TrainBot ·{' '}
          <Link to="/privacy" className="hover:underline">Confidențialitate</Link>
          {' · '}
          <Link to="/terms" className="hover:underline">Termeni</Link>
          {' · '}
          <Link to="/dpa" className="hover:underline">DPA</Link>
        </div>
      </footer>
    </div>
  )
}
