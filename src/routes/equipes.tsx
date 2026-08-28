import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Shield,
  UserRound,
  Users,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'

type Team = {
  id: number
  created_at: string
  name: string
  category: string | null
  season: string | null
  coach: string | null
  assistant_coach: string | null
  description: string | null
  image_url: string | null
  active: boolean
}

function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setLoading(true)
    setError(false)

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('active', true)
      .order('created_at', {
        ascending: true,
      })

    if (error) {
      console.error(error)
      setError(true)
      setLoading(false)
      return
    }

    setTeams(data || [])
    setLoading(false)
  }

  const currentSeason =
    teams.find((team) => team.season)?.season ||
    '2026/2027'

  return (
    <div>
      <Seo
        title="Nos équipes"
        description="Découvrez les équipes du Football Club Plouha, leurs catégories, leurs entraîneurs et leurs effectifs."
      />

      {/* HERO */}
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">

          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            EFFECTIFS {currentSeason.replace('/', '-')}
          </span>

          <h1 className="mt-4 text-4xl sm:text-6xl text-white">
            Nos équipes
          </h1>

          {!loading && !error && teams.length > 0 && (
            <p className="mt-6 text-white/70 font-condensed text-lg max-w-2xl mx-auto">
              {teams.length} équipe
              {teams.length > 1 ? 's' : ''} porte
              {teams.length > 1 ? 'nt' : ''} les couleurs
              des Falaises.
            </p>
          )}

        </div>

      </section>

      {/* CONTENU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">

        {/* CHARGEMENT */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">

            <Loader2
              size={36}
              className="animate-spin text-[var(--club-navy-deep)]/40"
            />

            <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/50">
              Chargement des équipes...
            </p>

          </div>
        )}

        {/* ERREUR */}
        {!loading && error && (
          <div className="py-20 text-center">

            <Shield
              size={44}
              className="mx-auto text-[var(--club-red)]"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Impossible de charger les équipes
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Veuillez réessayer ultérieurement.
            </p>

          </div>
        )}

        {/* AUCUNE EQUIPE */}
        {!loading &&
          !error &&
          teams.length === 0 && (
            <div className="py-20 text-center">

              <Users
                size={46}
                className="mx-auto text-[var(--club-navy-deep)]/20"
              />

              <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
                Les équipes arrivent bientôt
              </h2>

              <p className="mt-2 text-[var(--club-navy-deep)]/60">
                Les effectifs du FC Plouha seront
                prochainement disponibles.
              </p>

            </div>
          )}

        {/* EQUIPES */}
        {!loading &&
          !error &&
          teams.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">

              {teams.map((team) => (
                <Link
                  key={team.id}
                  to={`/equipes/${team.id}`}
                  className="group block rounded-2xl overflow-hidden border border-black/5 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >

                  {/* PHOTO */}
                  <div className="relative h-56 overflow-hidden bg-[var(--club-navy-deep)]">

                    {team.image_url ? (
                      <img
                        src={team.image_url}
                        alt={team.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">

                        <Shield
                          size={54}
                          className="text-white/20"
                        />

                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--club-navy-deep)]/90 via-transparent to-transparent" />

                    {team.category && (
                      <div className="absolute left-4 top-4">

                        <span className="inline-flex bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold text-xs px-3 py-1.5 rounded-full">
                          {team.category}
                        </span>

                      </div>
                    )}

                    <div className="absolute left-5 right-5 bottom-4">

                      <h2 className="font-condensed font-bold text-2xl text-white normal-case">
                        {team.name}
                      </h2>

                      {team.season && (
                        <p className="text-white/60 text-xs font-condensed mt-1">
                          Saison {team.season}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* INFORMATIONS */}
                  <div className="p-6">

                    {(team.coach ||
                      team.assistant_coach) && (
                      <div className="space-y-3">

                        {team.coach && (
                          <div className="flex items-center justify-between gap-4">

                            <div className="flex items-center gap-2 text-sm text-[var(--club-navy-deep)]/55 font-condensed">

                              <UserRound size={15} />

                              <span>
                                Entraîneur
                              </span>

                            </div>

                            <span className="font-condensed font-semibold text-sm text-[var(--club-navy-deep)] text-right">
                              {team.coach}
                            </span>

                          </div>
                        )}

                        {team.assistant_coach && (
                          <div className="flex items-center justify-between gap-4">

                            <div className="flex items-center gap-2 text-sm text-[var(--club-navy-deep)]/55 font-condensed">

                              <Users size={15} />

                              <span>
                                Adjoint
                              </span>

                            </div>

                            <span className="font-condensed font-semibold text-sm text-[var(--club-navy-deep)] text-right">
                              {team.assistant_coach}
                            </span>

                          </div>
                        )}

                      </div>
                    )}

                    {team.description && (
                      <div
                        className={`${
                          team.coach ||
                          team.assistant_coach
                            ? 'mt-5 pt-5 border-t border-black/[0.06]'
                            : ''
                        }`}
                      >

                        <p className="text-sm leading-relaxed text-[var(--club-navy-deep)]/65">
                          {team.description}
                        </p>

                        <div className="mt-5 pt-4 border-t border-black/[0.06] font-condensed font-bold text-sm text-[var(--club-navy)] group-hover:text-[var(--club-red)] transition-colors">
                      Voir l'effectif →
                    </div>

                  </div>
                    )}

                  </div>

                </Link>
              ))}

            </div>
          )}

      </section>

    </div>
  )
}

export default TeamsPage
