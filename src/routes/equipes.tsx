import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { teams } from '@/data/club'
import { PhotoTile } from '@/components/PhotoTile'

function TeamsPage() {
  return (
    <div>
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            EFFECTIFS 2026-2027
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">Nos équipes</h1>
          <p className="mt-6 text-white/70 font-condensed text-lg max-w-2xl mx-auto">
            De l'école de foot aux séniors, {teams.length} équipes portent
            les couleurs des Falaises chaque week-end.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, i) => (
            <div
              key={team.id}
              className="rounded-2xl overflow-hidden border border-black/5 bg-white hover:shadow-lg transition-shadow"
            >
              <PhotoTile hue={i % 3 === 0 ? 214 : i % 3 === 1 ? 48 : 0} caption={team.category} className="h-32" />
              <div className="p-6">
                <h2 className="font-condensed font-bold text-xl normal-case">{team.name}</h2>
                <div className="mt-4 space-y-2 text-sm text-[var(--club-navy-deep)]/75 font-condensed">
                  <div className="flex justify-between">
                    <span>Entraîneur</span>
                    <span className="font-semibold text-[var(--club-navy-deep)]">{team.coach}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entraînements</span>
                    <span className="font-semibold text-[var(--club-navy-deep)]">{team.training}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Effectif</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--club-navy-deep)]">
                      <Users size={14} /> {team.players}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default TeamsPage
