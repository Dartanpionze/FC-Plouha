import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur React non gérée :', error, info)
  }

  private reloadPage = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--club-off-white)] px-4 py-12">
        <section
          role="alert"
          aria-labelledby="unexpected-error-title"
          className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-6 text-center shadow-lg sm:p-10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--club-red)]/10 text-[var(--club-red)]">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>

          <h1
            id="unexpected-error-title"
            className="mt-6 font-condensed text-3xl font-bold text-[var(--club-navy-deep)]"
          >
            Une erreur est survenue
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--club-navy-deep)]/65 sm:text-base">
            La page n’a pas pu s’afficher correctement. Vous pouvez la
            recharger ou revenir à l’accueil du FC Plouha.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.reloadPage}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--club-red)] px-5 py-3 font-condensed font-bold text-white transition-colors hover:bg-[var(--club-red-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-red)] focus-visible:ring-offset-2"
            >
              <RefreshCw size={18} aria-hidden="true" />
              Réessayer
            </button>

            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--club-navy-deep)]/15 bg-white px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)] transition-colors hover:bg-[var(--club-navy-deep)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-navy-deep)] focus-visible:ring-offset-2"
            >
              <Home size={18} aria-hidden="true" />
              Retour à l’accueil
            </a>
          </div>
        </section>
      </main>
    )
  }
}

export default ErrorBoundary
