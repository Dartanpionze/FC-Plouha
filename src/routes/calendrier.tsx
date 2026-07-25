import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, MapPin } from 'lucide-react'
import { matches } from '@/data/club'

export const Route = createFileRoute('/calendrier')({
  component: CalendarPage,
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function CalendarPage() {
  const upcoming = matches.filter((m) => !m.played)
  const past = matches.filter((m) => m.played)

  return (
    <div>
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            SAISON 2026-2027
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">Calendrier</h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-condensed font-bold text-2xl text-[var(--club-navy-deep)] mb-6">
          Prochains matchs
        </h2>
        <div className="space-y-4">
          {upcoming.map((match) => (
            <div
              key={match.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 p-5 rounded-xl border border-black/5 bg-white hover:border-[var(--club-yellow)] transition-colors"
            >
              <div className="sm:w-40 shrink-0">
                <div className="font-condensed font-bold text-xs text-[var(--club-red)] tracking-wide">
                  {match.competition}
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3 font-condensed font-bold text-lg normal-case">
                <span className="flex-1 text-right">{match.home}</span>
                <span className="text-[var(--club-navy)]/40 text-sm font-semibold">VS</span>
                <span className="flex-1">{match.away}</span>
              </div>
              <div className="sm:w-56 shrink-0 flex flex-col gap-1 text-sm text-[var(--club-navy-deep)]/70">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} /> {formatDate(match.date)} · {match.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {match.venue}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-condensed font-bold text-2xl text-[var(--club-navy-deep)] mt-16 mb-6">
          Résultats récents
        </h2>
        <div className="space-y-4">
          {past.map((match) => (
            <div
              key={match.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 p-5 rounded-xl border border-black/5 bg-[var(--club-navy)]/[0.03]"
            >
              <div className="sm:w-40 shrink-0">
                <div className="font-condensed font-bold text-xs text-[var(--club-navy)]/60 tracking-wide">
                  {match.competition}
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3 font-condensed font-bold text-lg normal-case">
                <span className="flex-1 text-right">{match.home}</span>
                <span className="px-3 py-1 rounded-md bg-[var(--club-navy-deep)] text-white text-base">
                  {match.scoreHome} - {match.scoreAway}
                </span>
                <span className="flex-1">{match.away}</span>
              </div>
              <div className="sm:w-56 shrink-0 text-sm text-[var(--club-navy-deep)]/60">
                {formatDate(match.date)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
