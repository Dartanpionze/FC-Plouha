import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Trophy,
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

function formatLongDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    'fr-FR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}

function CalendarPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [teamFilter, setTeamFilter] = useState('all')

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

  const teams = useMemo(() => {
    const byId = new Map<number, Team>()

    matches.forEach((match) => {
      if (match.teams) {
        byId.set(match.teams.id, match.teams)
      }
    })

    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'fr'),
    )
  }, [matches])

  const filteredMatches = useMemo(
    () =>
      teamFilter === 'all'
        ? matches
        : matches.filter(
            (match) => String(match.team_id) === teamFilter,
          ),
    [matches, teamFilter],
  )

  const upcoming = filteredMatches.filter(
    (match) => match.status === 'scheduled',
  )

  const past = filteredMatches
    .filter((match) => match.status === 'finished')
    .sort(
      (a, b) =>
        new Date(b.match_date).getTime() -
        new Date(a.match_date).getTime(),
    )

  const cancelled = filteredMatches.filter(
    (match) => match.status === 'cancelled',
  )

  const nextMatch = upcoming[0] || null
  const followingMatches = nextMatch ? upcoming.slice(1) : upcoming

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

  const selectedTeam =
    teamFilter === 'all'
      ? null
      : teams.find((team) => String(team.id) === teamFilter) || null

  return (
    <div>
      <Seo
        title="Calendrier & résultats"
        description="Consultez le calendrier, les prochains matchs et les résultats des équipes du Football Club Plouha."
      />

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

            <button
              type="button"
              onClick={fetchMatches}
              className="mt-6 rounded-lg bg-[var(--club-yellow)] px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)]"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {teams.length > 1 && (
              <div className="mb-10 rounded-2xl border border-black/5 bg-white p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-condensed font-bold text-[var(--club-navy-deep)]">
                      Filtrer par équipe
                    </p>
                    <p className="mt-1 text-sm text-[var(--club-navy-deep)]/45">
                      Affichez uniquement le calendrier d'une équipe.
                    </p>
                  </div>

                  <select
                    value={teamFilter}
                    onChange={(event) => setTeamFilter(event.target.value)}
                    className="min-w-64 rounded-xl border border-black/10 bg-white px-4 py-3 font-condensed font-semibold text-[var(--club-navy-deep)] outline-none focus:border-[var(--club-navy)]/30"
                  >
                    <option value="all">Toutes les équipes</option>

                    {teams.map((team) => (
                      <option
                        key={team.id}
                        value={String(team.id)}
                      >
                        {team.name}
                        {team.category ? ` · ${team.category}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTeam && (
                  <div className="mt-4 border-t border-black/[0.06] pt-4">
                    <Link
                      to={`/equipes/${selectedTeam.id}`}
                      className="inline-flex items-center gap-2 font-condensed text-sm font-bold text-[var(--club-navy)] hover:text-[var(--club-red)]"
                    >
                      Voir la fiche de {selectedTeam.name}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {filteredMatches.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white px-6 py-16 text-center">
                <CalendarDays
                  size={44}
                  className="mx-auto text-[var(--club-navy-deep)]/20"
                />

                <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
                  Aucun match pour cette équipe
                </h2>

                <p className="mt-2 text-[var(--club-navy-deep)]/55">
                  Les prochaines rencontres apparaîtront ici dès qu'elles seront renseignées.
                </p>
              </div>
            ) : (
              <>
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
                    <>
                      {nextMatch && (
                        <div className="relative overflow-hidden rounded-3xl bg-[var(--club-navy-deep)] p-6 sm:p-8 text-white">
                          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--club-yellow)]/10" />

                          <div className="relative">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="rounded-full bg-[var(--club-yellow)] px-3 py-1.5 font-condensed text-xs font-bold tracking-[0.15em] text-[var(--club-navy-deep)]">
                                PROCHAIN MATCH
                              </span>

                              <span className="font-condensed text-sm text-white/55 capitalize">
                                {formatLongDate(nextMatch.match_date)}
                              </span>
                            </div>

                            <div className="mt-8 grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
                              <div className="text-center sm:text-right">
                                <p className="font-condensed text-2xl sm:text-3xl font-bold">
                                  {getHomeTeam(nextMatch)}
                                </p>
                              </div>

                              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-condensed font-bold text-[var(--club-yellow)]">
                                VS
                              </div>

                              <div className="text-center sm:text-left">
                                <p className="font-condensed text-2xl sm:text-3xl font-bold">
                                  {getAwayTeam(nextMatch)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/65">
                              {nextMatch.competition && (
                                <span className="font-condensed font-bold text-white/80">
                                  {nextMatch.competition}
                                </span>
                              )}

                              {nextMatch.match_time && (
                                <span className="flex items-center gap-1.5">
                                  <Clock size={15} />
                                  {nextMatch.match_time.slice(0, 5)}
                                </span>
                              )}

                              {nextMatch.location && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={15} />
                                  {nextMatch.location}
                                </span>
                              )}
                            </div>

                            {nextMatch.teams && (
                              <div className="mt-6 text-center">
                                <Link
                                  to={`/equipes/${nextMatch.teams.id}`}
                                  className="inline-flex items-center gap-2 font-condensed text-sm font-bold text-[var(--club-yellow)] hover:text-white"
                                >
                                  Voir l'équipe
                                  <ArrowRight size={15} />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {followingMatches.length > 0 && (
                        <div className="mt-5 space-y-4">
                          {followingMatches.map((match) => (
                            <div
                              key={match.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 p-5 rounded-xl border border-black/5 bg-white hover:border-[var(--club-yellow)] hover:shadow-sm transition-all"
                            >
                              <div className="sm:w-40 shrink-0">
                                <div className="font-condensed font-bold text-xs text-[var(--club-red)] tracking-wide">
                                  {match.competition || 'Rencontre'}
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
                                  {formatDate(match.match_date)}
                                </span>

                                {match.match_time && (
                                  <span className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {match.match_time.slice(0, 5)}
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
                    </>
                  )}
                </div>

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
                              {match.competition || 'Rencontre'}
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
                              {match.home_score ?? '-'} - {match.away_score ?? '-'}
                            </span>

                            <span className="flex-1">
                              {getAwayTeam(match)}
                            </span>
                          </div>

                          <div className="sm:w-60 shrink-0 text-sm text-[var(--club-navy-deep)]/60">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays size={14} />
                              {formatDate(match.match_date)}
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
                            {getHomeTeam(match)} — {getAwayTeam(match)}
                          </div>

                          <span className="text-sm text-[var(--club-navy-deep)]/50">
                            {formatDate(match.match_date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default CalendarPage
