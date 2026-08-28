import { ArrowLeft, Home, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import Seo from '@/components/Seo'

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page introuvable"
        description="La page demandée est introuvable."
        noIndex
      />

      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] min-h-[70vh] flex items-center grain-overlay">
      <div className="absolute inset-0 opacity-15">
        <img
          src="/fond-foot.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[var(--club-navy-deep)]/40 to-[var(--club-navy-deep)]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="mx-auto w-20 h-20 rounded-3xl border border-white/10 bg-white/[0.06] flex items-center justify-center shadow-2xl">
          <SearchX
            size={38}
            className="text-[var(--club-yellow)]"
          />
        </div>

        <p className="mt-8 font-condensed font-bold text-sm tracking-[0.3em] text-[var(--club-yellow)]">
          ERREUR 404
        </p>

        <h1 className="mt-4 text-5xl sm:text-7xl text-white">
          Page introuvable
        </h1>

        <p className="mt-6 max-w-2xl mx-auto font-condensed text-lg sm:text-xl leading-relaxed text-white/70">
          La page que vous recherchez n'existe pas, a été déplacée ou
          l'adresse saisie est incorrecte.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-6 py-3 font-condensed font-bold text-[var(--club-navy-deep)] transition hover:opacity-90"
          >
            <Home size={18} />
            Retour à l'accueil
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3 font-condensed font-bold text-white transition hover:bg-white/[0.1]"
          >
            <ArrowLeft size={18} />
            Page précédente
          </button>
        </div>
      </div>
      </section>
    </>
  )
}
