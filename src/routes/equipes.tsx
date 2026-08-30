import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Loader2,
  Shield,
  UserPlus,
  UserRound,
  Users,
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
  const [categoryFilter, setCategoryFilter] = useState('all')

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

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          teams
            .map((team) => team.category?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ),
    [teams],
  )

  const visibleTeams = useMemo(
    () =>
      categoryFilter === 'all'
        ? teams
        : teams.filter((team) => team.category === categoryFilter),
    [teams, categoryFilter],
  )

  return (
    <div>
      <Seo
        title="Nos équipes"
        description="Découvrez les équipes du Football Club Plouha, leurs catégories, leurs entraîneurs et leurs effectifs."
      />

      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">
        <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            EFFECTIFS {currentSeason.replace('/', '-')}
          </span>

          <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            Nos équipes
          </h1>

          {!loading && !error && teams.length > 0 && (
            <p className="mt-6 text-white/70 font-condensed text-lg 2xl:text-xl max-w-2xl 2xl:max-w-3xl mx-auto 2xl:leading-relaxed">
              {teams.length} équipe{teams.length > 1 ? 's' : ''} porte
              {teams.length > 1 ? 'nt' : ''} les couleurs des Falaises.
            </p>
          )}
        </div>
      </section>

      <section className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 py-20 2xl:py-24">
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

            <button
              type="button"
              onClick={fetchTeams}
              className="mt-6 rounded-lg bg-[var(--club-yellow)] px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)]"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="py-20 text-center">
            <Users
              size={46}
              className="mx-auto text-[var(--club-navy-deep)]/20"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Les équipes arrivent bientôt
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Les effectifs du FC Plouha seront prochainement disponibles.
            </p>

            <Link
              to="/contact?subject=Inscription"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--club-yellow)] px-6 py-3 font-condensed font-bold text-[var(--club-navy-deep)]"
            >
              <UserPlus size={18} />
              Demander une inscription
            </Link>
          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <>
            {categories.length > 1 && (
              <div className="mb-10">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`rounded-full px-4 py-2 font-condensed text-sm font-bold transition ${
                      categoryFilter === 'all'
                        ? 'bg-[var(--club-navy-deep)] text-white'
                        : 'border border-black/10 bg-white text-[var(--club-navy-deep)] hover:border-[var(--club-navy)]/30'
                    }`}
                  >
                    Toutes les équipes
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setCategoryFilter(category)}
                      className={`rounded-full px-4 py-2 font-condensed text-sm font-bold transition ${
                        categoryFilter === category
                          ? 'bg-[var(--club-yellow)] text-[var(--club-navy-deep)]'
                          : 'border border-black/10 bg-white text-[var(--club-navy-deep)] hover:border-[var(--club-navy)]/30'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-center text-sm font-condensed text-[var(--club-navy-deep)]/45">
                  {visibleTeams.length} équipe{visibleTeams.length > 1 ? 's' : ''} affichée
                  {visibleTeams.length > 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {visibleTeams.map((team) => (
                <Link
                  key={team.id}
                  to={`/equipes/${team.id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-black/5 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-56 overflow-hidden bg-[var(--club-navy-deep)]">
                    {team.image_url ? (
                      <img
                        src={team.image_url}
                        alt={team.name}
                        loading="lazy"
                        decoding="async"
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
                      <h2 className="font-condensed font-bold text-2xl 2xl:text-3xl text-white normal-case">
                        {team.name}
                      </h2>

                      {team.season && (
                        <p className="text-white/60 text-xs font-condensed mt-1">
                          Saison {team.season}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    {(team.coach || team.assistant_coach) && (
                      <div className="space-y-3">
                        {team.coach && (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-[var(--club-navy-deep)]/55 font-condensed">
                              <UserRound size={15} />
                              <span>Entraîneur</span>
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
                              <span>Adjoint</span>
                            </div>

                            <span className="font-condensed font-semibold text-sm text-[var(--club-navy-deep)] text-right">
                              {team.assistant_coach}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {team.description && (
                      <p
                        className={`text-sm leading-relaxed text-[var(--club-navy-deep)]/65 ${
                          team.coach || team.assistant_coach
                            ? 'mt-5 pt-5 border-t border-black/[0.06]'
                            : ''
                        }`}
                      >
                        {team.description}
                      </p>
                    )}

                    <div className="mt-auto pt-5">
                      <div className="border-t border-black/[0.06] pt-4 inline-flex items-center gap-2 font-condensed font-bold text-sm text-[var(--club-navy)] group-hover:text-[var(--club-red)] transition-colors">
                        Voir l'équipe
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-14 rounded-3xl bg-[var(--club-navy-deep)] px-6 py-8 sm:px-10 sm:py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
              <div className="max-w-2xl">
                <span className="font-condensed font-bold text-xs tracking-[0.22em] text-[var(--club-yellow)]">
                  RECRUTEMENT
                </span>
                <h2 className="mt-2 text-3xl text-white">
                  Vous souhaitez rejoindre le FC Plouha ?
                </h2>
                <p className="mt-3 font-condensed text-white/65 leading-relaxed">
                  Choisissez votre équipe ou envoyez directement une demande
                  d'inscription au club.
                </p>
              </div>

              <Link
                to="/contact?subject=Inscription"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--club-yellow)] px-6 py-3.5 font-condensed font-bold text-[var(--club-navy-deep)]"
              >
                <UserPlus size={18} />
                Faire une demande
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default TeamsPage
