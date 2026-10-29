import { Component, type ErrorInfo, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-primary-purple">Ceva nu a mers bine</h1>
          <p className="text-text-secondary text-sm">
            A apărut o eroare neașteptată. Încearcă să reîncarci pagina.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-purple text-white font-semibold py-2.5 rounded-lg hover:bg-secondary-purple transition"
          >
            Reîncarcă pagina
          </button>
        </div>
      </div>
    )
  }
}
