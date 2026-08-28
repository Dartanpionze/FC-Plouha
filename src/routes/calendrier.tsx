import { useEffect, useState } from 'react'
import {
  CalendarDays,
  MapPin,
  Clock,
  Trophy,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'

type Team = {
  id: number
  name: string
  category: string | null
  season: string | null
}

type Match = {
  id: number
  team_id: number | null
  opponent: string
  match_date: string
  match_time: string | null
  location: string | null
  is_home: boolean
  competition: string | null
  status: string
  home_score: number | null
  away_score: number | null
  teams?: Team | null
}

function singleRelation<T>(
  relation: T | T[] | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    'fr-FR',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

function CalendarPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    setLoading(true)
    setError(false)

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        team_id,
        opponent,
        match_date,
        match_time,
        location,
        is_home,
        competition,
        status,
        home_score,
        away_score,
        teams (
          id,
          name,
          category,
          season
        )
      `)
      .order('match_date', {
        ascending: true,
      })
      .order('match_time', {
        ascending: true,
      })

    if (error) {
      console.error(error)
      setError(true)
      setLoading(false)
      return
    }

    setMatches(
      (data || []).map((match) => ({
        ...match,
        teams: singleRelation(match.teams),
      })),
    )
    setLoading(false)
  }

  const upcoming = matches.filter(
    (match) => match.status === 'scheduled',
  )

  const past = matches
    .filter(
      (match) => match.status === 'finished',
    )
    .sort(
      (a, b) =>
        new Date(b.match_date).getTime() -
        new Date(a.match_date).getTime(),
    )

  const cancelled = matches.filter(
    (match) => match.status === 'cancelled',
  )

  const currentSeason =
    matches.find((match) => match.teams?.season)
      ?.teams?.season || '2026/2027'

  const getTeamName = (match: Match) =>
    match.teams?.name || 'FC Plouha'

  const getHomeTeam = (match: Match) =>
    match.is_home
      ? getTeamName(match)
      : match.opponent

  const getAwayTeam = (match: Match) =>
    match.is_home
      ? match.opponent
      : getTeamName(match)

  return (
    <div>
      <Seo
        title="Calendrier & résultats"
        description="Consultez le calendrier, les prochains matchs et les résultats des équipes du Football Club Plouha."
      />

      {/* HERO */}
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">
        <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 text-center">

          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            SAISON {currentSeason.replace('/', '-')}
          </span>

          <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            Calendrier
          </h1>

          <p className="mt-5 text-white/65 font-condensed text-lg">
            Retrouvez les prochaines rencontres
            et les derniers résultats du FC Plouha.
          </p>

        </div>
      </section>

      <section className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 py-20 2xl:py-24">

        {/* CHARGEMENT */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">

            <Loader2
              size={36}
              className="animate-spin text-[var(--club-navy-deep)]/40"
            />

            <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/50">
              Chargement du calendrier...
            </p>

          </div>
        )}

        {/* ERREUR */}
        {!loading && error && (
          <div className="py-20 text-center">

            <CalendarDays
              size={44}
              className="mx-auto text-[var(--club-red)]"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Impossible de charger le calendrier
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Veuillez réessayer ultérieurement.
            </p>

          </div>
        )}

        {!loading && !error && (
          <>

            {/* PROCHAINS MATCHS */}
            <div>
              <div className="flex items-center gap-3 mb-6">

                <CalendarDays
                  size={22}
                  className="text-[var(--club-red)]"
                />

                <h2 className="font-condensed font-bold text-2xl 2xl:text-3xl text-[var(--club-navy-deep)]">
                  Prochains matchs
                </h2>

              </div>

              {upcoming.length === 0 ? (
                <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-[var(--club-navy-deep)]/50">
                  Aucun match à venir.
                </div>
              ) : (
                <div className="space-y-4">

                  {upcoming.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 p-5 rounded-xl border border-black/5 bg-white hover:border-[var(--club-yellow)] hover:shadow-sm transition-all"
                    >

                      <div className="sm:w-40 shrink-0">

                        <div className="font-condensed font-bold text-xs text-[var(--club-red)] tracking-wide">
                          {match.competition ||
                            'Rencontre'}
                        </div>

                        {match.teams?.category && (
                          <div className="text-xs text-[var(--club-navy-deep)]/45 mt-1">
                            {match.teams.category}
                          </div>
                        )}

                      </div>

                      <div className="flex-1 flex items-center gap-3 font-condensed font-bold text-lg normal-case">

                        <span className="flex-1 text-right">
                          {getHomeTeam(match)}
                        </span>

                        <span className="text-[var(--club-navy)]/40 text-sm font-semibold">
                          VS
                        </span>

                        <span className="flex-1">
                          {getAwayTeam(match)}
                        </span>

                      </div>

                      <div className="sm:w-60 shrink-0 flex flex-col gap-1.5 text-sm text-[var(--club-navy-deep)]/70">

                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {formatDate(
                            match.match_date,
                          )}
                        </span>

                        {match.match_time && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {match.match_time.slice(
                              0,
                              5,
                            )}
                          </span>
                        )}

                        {match.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            {match.location}
                          </span>
                        )}

                      </div>

                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* RESULTATS */}
            <div className="mt-16">

              <div className="flex items-center gap-3 mb-6">

                <Trophy
                  size={22}
                  className="text-[var(--club-yellow)]"
                />

                <h2 className="font-condensed font-bold text-2xl 2xl:text-3xl text-[var(--club-navy-deep)]">
                  Résultats récents
                </h2>

              </div>

              {past.length === 0 ? (
                <div className="rounded-2xl border border-black/5 bg-[var(--club-navy)]/[0.03] p-10 text-center text-[var(--club-navy-deep)]/50">
                  Aucun résultat enregistré.
                </div>
              ) : (
                <div className="space-y-4">

                  {past.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 p-5 rounded-xl border border-black/5 bg-[var(--club-navy)]/[0.03]"
                    >

                      <div className="sm:w-40 shrink-0">

                        <div className="font-condensed font-bold text-xs text-[var(--club-navy)]/60 tracking-wide">
                          {match.competition ||
                            'Rencontre'}
                        </div>

                        {match.teams?.category && (
                          <div className="text-xs text-[var(--club-navy-deep)]/40 mt-1">
                            {match.teams.category}
                          </div>
                        )}

                      </div>

                      <div className="flex-1 flex items-center gap-3 font-condensed font-bold text-lg normal-case">

                        <span className="flex-1 text-right">
                          {getHomeTeam(match)}
                        </span>

                        <span className="px-3 py-1 rounded-md bg-[var(--club-navy-deep)] text-white text-base 2xl:text-lg">

                          {match.home_score ?? '-'}
                          {' - '}
                          {match.away_score ?? '-'}

                        </span>

                        <span className="flex-1">
                          {getAwayTeam(match)}
                        </span>

                      </div>

                      <div className="sm:w-60 shrink-0 text-sm text-[var(--club-navy-deep)]/60">

                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {formatDate(
                            match.match_date,
                          )}
                        </span>

                        {match.location && (
                          <span className="flex items-center gap-1.5 mt-1">
                            <MapPin size={14} />
                            {match.location}
                          </span>
                        )}

                      </div>

                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* MATCHS ANNULES */}
            {cancelled.length > 0 && (
              <div className="mt-16">

                <h2 className="font-condensed font-bold text-xl text-[var(--club-navy-deep)] mb-5">
                  Matchs annulés
                </h2>

                <div className="space-y-3">

                  {cancelled.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-xl border border-red-100 bg-red-50/50"
                    >

                      <span className="font-condensed font-bold text-sm text-red-600">
                        ANNULÉ
                      </span>

                      <div className="flex-1 font-condensed font-semibold text-[var(--club-navy-deep)]">

                        {getHomeTeam(match)}
                        {' — '}
                        {getAwayTeam(match)}

                      </div>

                      <span className="text-sm text-[var(--club-navy-deep)]/50">
                        {formatDate(
                          match.match_date,
                        )}
                      </span>

                    </div>
                  ))}

                </div>

              </div>
            )}

          </>
        )}

      </section>

    </div>
  )
}

export default CalendarPage
