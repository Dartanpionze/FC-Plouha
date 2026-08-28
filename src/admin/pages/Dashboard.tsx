import { useEffect, useState } from 'react'
import {
  Newspaper,
  Shield,
  CalendarDays,
  Handshake,
  ArrowRight,
  Images,
  Clock,
  MapPin,
  Users,
  ClipboardList,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type Stat = {
  label: string
  value: number
  description: string
  icon: typeof Newspaper
  path: string
}

type NewsItem = {
  id: number
  title: string
  created_at: string
  image_url: string | null
}

type Match = {
  id: number
  opponent: string
  match_date: string
  match_time: string | null
  location: string | null
  is_home: boolean
  status: string
  teams?: {
    name: string
  } | null
}

export default function Dashboard() {
  const [newsCount, setNewsCount] = useState(0)
  const [teamsCount, setTeamsCount] = useState(0)
  const [matchesCount, setMatchesCount] = useState(0)
  const [partnersCount, setPartnersCount] = useState(0)
  const [galleryCount, setGalleryCount] = useState(0)
  const [playersCount, setPlayersCount] = useState(0)
  const [registrationsCount, setRegistrationsCount] = useState(0)

  const [latestNews, setLatestNews] = useState<NewsItem[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    setError(false)

    try {
      const results = await Promise.all([
        fetchNews(),
        fetchTeams(),
        fetchMatches(),
        fetchPartners(),
        fetchGallery(),
        fetchPlayers(),
        fetchRegistrations(),
      ])

      if (results.some((success) => !success)) {
        setError(true)
      }
    } catch (fetchError) {
      console.error(fetchError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchNews = async () => {
    const { count, data, error } = await supabase
      .from('news')
      .select('id, title, created_at, image_url', {
        count: 'exact',
      })
      .order('created_at', {
        ascending: false,
      })
      .limit(5)

    if (error) {
      console.error(error)
      return false
    }

    setNewsCount(count || 0)
    setLatestNews(data || [])
    return true
  }

  const fetchTeams = async () => {
    const { count, error } = await supabase
      .from('teams')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('active', true)

    if (error) {
      console.error(error)
      return false
    }

    setTeamsCount(count || 0)
    return true
  }

  const fetchMatches = async () => {
    const today = new Date()
      .toISOString()
      .split('T')[0]

    const { count, data, error } = await supabase
      .from('matches')
      .select(
        `
          id,
          opponent,
          match_date,
          match_time,
          location,
          is_home,
          status,
          teams (
            name
          )
        `,
        {
          count: 'exact',
        },
      )
      .eq('status', 'scheduled')
      .gte('match_date', today)
      .order('match_date', {
        ascending: true,
      })
      .order('match_time', {
        ascending: true,
      })
      .limit(5)

    if (error) {
      console.error(error)
      return false
    }

    setMatchesCount(count || 0)
    setUpcomingMatches(data || [])
    return true
  }

  const fetchPartners = async () => {
    const { count, error } = await supabase
      .from('partners')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('active', true)

    if (error) {
      console.error(error)
      return false
    }

    setPartnersCount(count || 0)
    return true
  }

  const fetchGallery = async () => {
    const { count, error } = await supabase
      .from('gallery_photos')
      .select('id', {
        count: 'exact',
        head: true,
      })

    if (error) {
      console.error(error)
      return false
    }

    setGalleryCount(count || 0)
    return true
  }

  const fetchPlayers = async () => {
    const { count, error } = await supabase
      .from('players')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('active', true)

    if (error) {
      console.error(error)
      return false
    }

    setPlayersCount(count || 0)
    return true
  }

  const fetchRegistrations = async () => {
    const { count, error } = await supabase
      .from('registrations')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('status', 'Nouveau')

    if (error) {
      console.error(error)
      return false
    }

    setRegistrationsCount(count || 0)
    return true
  }

  const stats: Stat[] = [
    {
      label: 'Actualités',
      value: newsCount,
      description: 'articles publiés',
      icon: Newspaper,
      path: '/admin/news',
    },
    {
      label: 'Équipes',
      value: teamsCount,
      description: 'équipes actives',
      icon: Shield,
      path: '/admin/teams',
    },
    {
      label: 'Matchs à venir',
      value: matchesCount,
      description: 'dans le calendrier',
      icon: CalendarDays,
      path: '/admin/matches',
    },
    {
      label: 'Partenaires',
      value: partnersCount,
      description: 'partenaires actifs',
      icon: Handshake,
      path: '/admin/partners',
    },
    {
      label: 'Joueurs',
      value: playersCount,
      description: 'joueurs actifs',
      icon: Users,
      path: '/admin/players',
    },
    {
      label: 'Inscriptions',
      value: registrationsCount,
      description:
        registrationsCount > 1
          ? 'nouvelles demandes'
          : 'nouvelle demande',
      icon: ClipboardList,
      path: '/admin/registrations',
    },
  ]

  const formatDate = (date: string) => {
    return new Date(
      `${date}T12:00:00`,
    ).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (time: string | null) => {
    if (!time) return null

    return time.slice(0, 5)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-8">

        <p className="text-sm text-slate-400 mb-1">
          Vue d'ensemble
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Tableau de bord
        </h1>

        <p className="mt-2 text-slate-400">
          Gérez facilement le contenu du site du FC Plouha.
        </p>

      </div>

      {error && !loading && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-amber-100">
            Certaines données du tableau de bord n'ont pas pu être chargées.
            Les valeurs affichées peuvent être partielles.
          </p>

          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="shrink-0 rounded-lg border border-amber-400/20 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.1] transition"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">

        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Link
              key={stat.label}
              to={stat.path}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
            >

              <div className="flex items-start justify-between">

                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">

                  <Icon
                    size={21}
                    className="text-[var(--club-yellow)]"
                  />

                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition"
                />

              </div>

              <div className="mt-5">

                <p className="text-sm text-slate-400">
                  {stat.label}
                </p>

                <p className="text-3xl font-bold mt-1">

                  {loading ? (
                    <span className="text-slate-600">
                      ...
                    </span>
                  ) : (
                    stat.value
                  )}

                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {stat.description}
                </p>

              </div>

            </Link>
          )
        })}

      </div>

      {/* ACTIONS RAPIDES */}
      <div className="mt-8">

        <h2 className="text-lg font-semibold">
          Actions rapides
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Accédez rapidement aux outils les plus utilisés.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-4">

          <Link
            to="/admin/news"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >

            <Newspaper
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Nouvelle actualité
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Publier une nouvelle actualité sur le site.
            </p>

          </Link>

          <Link
            to="/admin/matches"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >

            <CalendarDays
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Ajouter un match
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Ajouter une rencontre au calendrier.
            </p>

          </Link>

          <Link
            to="/admin/gallery"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >

            <Images
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Ajouter des photos
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Alimenter la galerie du club.
            </p>

          </Link>

          <Link
            to="/admin/players"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >

            <Users
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Ajouter un joueur
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Gérer les effectifs des différentes équipes.
            </p>

          </Link>

          <Link
            to="/admin/registrations"
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >

            {registrationsCount > 0 && (
              <span className="absolute top-4 right-4 min-w-6 h-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {registrationsCount > 99
                  ? '99+'
                  : registrationsCount}
              </span>
            )}

            <ClipboardList
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Voir les inscriptions
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Traiter les nouvelles demandes reçues depuis le site.
            </p>

          </Link>

        </div>

      </div>

      {/* CONTENU RECENT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        {/* ACTUALITÉS */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">

            <div>

              <h2 className="font-semibold">
                Dernières actualités
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Les dernières publications du club.
              </p>

            </div>

            <Link
              to="/admin/news"
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Tout voir
            </Link>

          </div>

          <div className="divide-y divide-white/5">

            {latestNews.length === 0 ? (

              <div className="p-8 text-center text-slate-500">
                Aucune actualité.
              </div>

            ) : (

              latestNews.map((item) => (

                <Link
                  key={item.id}
                  to="/admin/news"
                  className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition"
                >

                  {item.image_url ? (

                    <img
                      src={item.image_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />

                  ) : (

                    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0">

                      <Newspaper
                        size={20}
                        className="text-slate-600"
                      />

                    </div>

                  )}

                  <div className="min-w-0 flex-1">

                    <h3 className="font-semibold truncate">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(
                        item.created_at,
                      ).toLocaleDateString(
                        'fr-FR',
                      )}
                    </p>

                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-600 shrink-0"
                  />

                </Link>

              ))

            )}

          </div>

        </div>

        {/* MATCHS */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">

            <div>

              <h2 className="font-semibold">
                Prochains matchs
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Les prochaines rencontres programmées.
              </p>

            </div>

            <Link
              to="/admin/matches"
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Tout voir
            </Link>

          </div>

          <div className="divide-y divide-white/5">

            {upcomingMatches.length === 0 ? (

              <div className="p-8 text-center text-slate-500">
                Aucun match à venir.
              </div>

            ) : (

              upcomingMatches.map((match) => {

                const teamName =
                  match.teams?.name ||
                  'FC Plouha'

                const homeTeam = match.is_home
                  ? teamName
                  : match.opponent

                const awayTeam = match.is_home
                  ? match.opponent
                  : teamName

                return (

                  <Link
                    key={match.id}
                    to="/admin/matches"
                    className="block p-4 hover:bg-white/[0.02] transition"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2 text-xs text-[var(--club-yellow)]">

                          <CalendarDays size={14} />

                          <span>
                            {formatDate(
                              match.match_date,
                            )}
                          </span>

                          {formatTime(
                            match.match_time,
                          ) && (
                            <>
                              <Clock size={13} />

                              <span>
                                {formatTime(
                                  match.match_time,
                                )}
                              </span>
                            </>
                          )}

                        </div>

                        <div className="flex items-center gap-2 mt-2">

                          <span className="font-semibold truncate">
                            {homeTeam}
                          </span>

                          <span className="text-slate-600 font-bold">
                            VS
                          </span>

                          <span className="font-semibold truncate">
                            {awayTeam}
                          </span>

                        </div>

                        {match.location && (

                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">

                            <MapPin size={13} />

                            <span className="truncate">
                              {match.location}
                            </span>

                          </div>

                        )}

                      </div>

                      <ArrowRight
                        size={17}
                        className="text-slate-600 shrink-0"
                      />

                    </div>

                  </Link>

                )
              })

            )}

          </div>

        </div>

      </div>

      {/* GALERIE */}
      <div className="mt-6 text-sm text-slate-500">
        {galleryCount} élément
        {galleryCount > 1 ? 's' : ''} dans la galerie.
      </div>

    </div>
  )
}
