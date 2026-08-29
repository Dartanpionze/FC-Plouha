import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldHalf,
  Trophy,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SectionHeading } from '@/components/SectionHeading'
import { ClubCrest } from '@/components/ClubCrest'
import Seo from '@/components/Seo'

type ClubSettings = {
  club_name: string | null
  short_name: string | null
  season: string | null
  city: string | null
  description: string | null
  founded_year: number | null
  members_count: number | null
  volunteers_count: number | null
  district_titles: number | null
}

type Team = {
  id: number
  name: string
  category: string | null
  coach: string | null
  image_url: string | null
  active: boolean
}

type Match = {
  id: number
  opponent: string
  match_date: string
  match_time: string | null
  location: string | null
  is_home: boolean
  competition: string | null
  status: string
  teams?: {
    id: number
    name: string
  } | null
}

type GalleryPhoto = {
  id: number
  image_url: string
  caption: string | null
  active: boolean
}

type Partner = {
  id: number
  name: string
  logo_url: string | null
  website_url: string | null
  active: boolean
  display_order: number
}

function singleRelation<T>(
  relation: T | T[] | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function Home() {
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [news, setNews] = useState<any[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [homeStoryPhotos, setHomeStoryPhotos] = useState<GalleryPhoto[]>([])
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchHomeData = async () => {
    setLoading(true)
    setError(false)

    try {
      const [
        settingsResult,
        newsResult,
        teamsResult,
        matchesResult,
        homeStoryResult,
        galleryResult,
        partnersResult,
      ] = await Promise.all([
        supabase
          .from('club_settings')
          .select('*')
          .limit(1)
          .single(),

        supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4),

        supabase
          .from('teams')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: true }),

        supabase
          .from('matches')
          .select(`
            id,
            opponent,
            match_date,
            match_time,
            location,
            is_home,
            competition,
            status,
            teams (
              id,
              name
            )
          `)
          .eq('status', 'scheduled')
          .order('match_date', { ascending: true })
          .order('match_time', { ascending: true })
          .limit(3),

        supabase
          .from('gallery_photos')
          .select('*')
          .eq('active', true)
          .not('home_slot', 'is', null)
          .order('home_slot', { ascending: true })
          .limit(3),

        supabase
          .from('gallery_photos')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(8),

        supabase
          .from('partners')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true })
          .limit(12),
      ])

      const results = [
        settingsResult,
        newsResult,
        teamsResult,
        matchesResult,
        homeStoryResult,
        galleryResult,
        partnersResult,
      ]

      const hasError = results.some((result) => Boolean(result.error))

      if (hasError) {
        results.forEach((result) => {
          if (result.error) console.error(result.error)
        })
        setError(true)
      }

      setSettings(settingsResult.data || null)
      setNews(newsResult.data || [])
      setTeams(teamsResult.data || [])
      setMatches(
        (matchesResult.data || []).map((match) => ({
          ...match,
          teams: singleRelation(match.teams),
        })),
      )
      setHomeStoryPhotos(homeStoryResult.data || [])
      setGalleryPhotos(galleryResult.data || [])
      setPartners(partnersResult.data || [])
    } catch (fetchError) {
      console.error(fetchError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomeData()
  }, [])

  const clubName = settings?.club_name || 'Football Club Plouha'
  const city = settings?.city || 'Plouha'
  const season = settings?.season || '2026/2027'
  const foundedYear = settings?.founded_year ?? 2026
  const membersCount = settings?.members_count ?? 0
  const volunteersCount = settings?.volunteers_count ?? 0
  const districtTitles = settings?.district_titles ?? 0

  const getTeamName = (match: Match) =>
    match.teams?.name || settings?.short_name || 'FC Plouha'

  const getHomeTeam = (match: Match) =>
    match.is_home ? getTeamName(match) : match.opponent

  const getAwayTeam = (match: Match) =>
    match.is_home ? match.opponent : getTeamName(match)

  if (loading) {
    return (
      <>
        <Seo />
        <div className="min-h-[65vh] bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-[var(--club-navy)]"
          />
          <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/60">
            Chargement du site...
          </p>
        </div>
      </div>
      </>
    )
  }

  return (
    <div>
      <Seo />
      {error && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 text-amber-900">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0"
              />
              <p className="font-condensed text-sm">
                Certaines informations du site n'ont pas pu être chargées.
                Vous pouvez réessayer sans quitter cette page.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchHomeData}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 font-condensed font-bold text-sm text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] grain-overlay">
        <div className="absolute top-0 right-0 bottom-2 w-1/2">
          <img
            src="/fond-foot.jpg"
            alt=""
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--club-navy-deep)] via-[var(--club-navy-deep)]/70 to-transparent" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(29,79,145,0.55),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(200,32,47,0.35),transparent_55%)]" />

        <svg
          className="absolute -right-24 -top-24 w-[560px] h-[560px] opacity-[0.07]"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="94" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="100" y1="6" x2="100" y2="194" stroke="white" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 pt-8 pb-10 sm:pt-12 sm:pb-12 2xl:pt-16 2xl:pb-16 grid lg:grid-cols-[1.2fr_0.8fr] 2xl:grid-cols-[1.15fr_0.85fr] gap-12 2xl:gap-16 items-center">
          <div className="animate-rise">
            <div className="flex items-center gap-3 2xl:gap-4 mb-4 2xl:mb-5">
              <span className="h-px w-10 2xl:w-12 bg-[var(--club-yellow)]" />
              <span className="font-condensed text-[var(--club-yellow)] text-sm 2xl:text-base font-semibold tracking-[0.3em]">
                {city.toUpperCase()} · BRETAGNE
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl 2xl:text-[5.5rem] text-white leading-[0.95] text-balance">
              {clubName}
              <span className="block text-[var(--club-yellow)]">
                Les Falaises
              </span>
            </h1>

            <p className="mt-6 2xl:mt-7 text-white/70 text-lg 2xl:text-xl max-w-xl 2xl:max-w-2xl font-condensed 2xl:leading-relaxed">
              {settings?.description ||
                "Le FC Plouha ouvre une nouvelle page de son histoire. Une aventure humaine et sportive portée par la passion du football, l'engagement des bénévoles et l'envie de construire ensemble l'avenir des Falaises."}
            </p>

            <div className="mt-9 2xl:mt-10 flex flex-wrap gap-4 2xl:gap-5">
              <Link
                to="/equipes"
                className="inline-flex items-center gap-2 2xl:gap-3 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold 2xl:text-lg px-6 py-3.5 2xl:px-8 2xl:py-4 rounded-lg hover:bg-white transition-colors"
              >
                Découvrir nos équipes
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/calendrier"
                className="inline-flex items-center gap-2 2xl:gap-3 border border-white/30 text-white font-condensed font-bold 2xl:text-lg px-6 py-3.5 2xl:px-8 2xl:py-4 rounded-lg hover:bg-white/10 transition-colors"
              >
                Voir le calendrier
              </Link>
            </div>
          </div>

          <div
            className="relative flex justify-center lg:justify-end animate-rise"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="relative bg-white/[0.04] border border-white/10 rounded-3xl p-4 2xl:p-6 backdrop-blur-sm w-full max-w-xl 2xl:max-w-2xl">
              <ClubCrest className="w-56 h-56 sm:w-72 sm:h-72 lg:w-[560px] lg:h-[560px] 2xl:w-[590px] 2xl:h-[590px] mx-auto -mt-6 2xl:-mt-8 drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]" />

              <div className="mt-0 2xl:mt-1 grid grid-cols-2 gap-4 2xl:gap-6 text-center">
                <div>
                  <div className="font-display text-3xl 2xl:text-4xl text-[var(--club-yellow)]">
                    {foundedYear}
                  </div>
                  <div className="font-condensed text-white/60 text-xs 2xl:text-sm tracking-widest">
                    FONDATION
                  </div>
                </div>

                <div>
                  <div className="font-display text-3xl 2xl:text-4xl text-[var(--club-yellow)]">
                    {teams.length}
                  </div>
                  <div className="font-condensed text-white/60 text-xs 2xl:text-sm tracking-widest">
                    ÉQUIPES
                  </div>
                </div>

                <div>
                  <div className="font-display text-3xl 2xl:text-4xl text-[var(--club-yellow)]">
                    {membersCount}
                  </div>
                  <div className="font-condensed text-white/60 text-xs 2xl:text-sm tracking-widest">
                    LICENCIÉS
                  </div>
                </div>

                <div>
                  <div className="font-display text-3xl 2xl:text-4xl text-[var(--club-yellow)]">
                    {districtTitles}
                  </div>
                  <div className="font-condensed text-white/60 text-xs 2xl:text-sm tracking-widest">
                    TITRES DISTRICT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 h-2 stripe-diagonal" />
      </section>

      {/* PRESENTATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            {homeStoryPhotos.map((photo, index) => (
              <Link
                key={photo.id}
                to="/galerie"
                className={`group relative overflow-hidden rounded-2xl ${
                  index === 0 ? 'h-56 col-span-2' : 'h-40'
                }`}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || 'FC Plouha'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <span className="text-white font-condensed font-semibold text-sm">
                      {photo.caption}
                    </span>
                  </div>
                )}
              </Link>
            ))}

            {homeStoryPhotos.length === 0 && (
              <div className="h-56 col-span-2 rounded-2xl bg-[var(--club-navy)]/[0.05] flex items-center justify-center text-[var(--club-navy-deep)]/40 font-condensed">
                Les photos du club apparaîtront ici.
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeading eyebrow="Le club" title="Une histoire ancrée dans le Goëlo" />

          <p className="mt-6 text-[var(--club-navy-deep)]/80 leading-relaxed font-condensed text-lg">
            {settings?.description ||
              `Créé en ${foundedYear}, le ${clubName} écrit une nouvelle page de son histoire à ${city}.`}
          </p>

          <p className="mt-4 text-[var(--club-navy-deep)]/70 leading-relaxed font-condensed">
            Aujourd'hui, {membersCount} licencié{membersCount > 1 ? 's' : ''} réparti
            {membersCount > 1 ? 's' : ''} en {teams.length} équipe
            {teams.length > 1 ? 's' : ''} porte{teams.length > 1 ? 'nt' : ''} les couleurs
            du club pour la saison {season}.
          </p>

          <div className="mt-8 grid sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <ShieldHalf className="text-[var(--club-red)] shrink-0" size={26} />
              <div>
                <div className="font-condensed font-bold">Valeurs</div>
                <div className="text-sm text-[var(--club-navy-deep)]/70">
                  Respect, engagement, convivialité
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Trophy className="text-[var(--club-red)] shrink-0" size={26} />
              <div>
                <div className="font-condensed font-bold">Palmarès</div>
                <div className="text-sm text-[var(--club-navy-deep)]/70">
                  {districtTitles} titre{districtTitles > 1 ? 's' : ''} de District
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="text-[var(--club-red)] shrink-0" size={26} />
              <div>
                <div className="font-condensed font-bold">Bénévoles</div>
                <div className="text-sm text-[var(--club-navy-deep)]/70">
                  {volunteersCount} bénévole{volunteersCount > 1 ? 's' : ''} actif
                  {volunteersCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/club"
            className="inline-flex items-center gap-2 mt-8 font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] transition-colors"
          >
            En savoir plus sur le club <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* NEWS */}
      <section className="bg-[var(--club-navy)]/[0.04] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <SectionHeading eyebrow="À la une" title="Dernières actualités" />
            <Link
              to="/actualites"
              className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
            >
              Toutes les actualités <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {news.map((item) => (
              <Link
                key={item.id}
                to={`/actualites/${item.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-black/5 block"
              >
                {item.image_url && (
                  <div className="h-36 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="text-xs font-condensed font-semibold text-[var(--club-navy)]/60 tracking-wide">
                    {formatDate(item.created_at)}
                  </div>
                  <h3 className="mt-2 font-condensed font-bold text-lg leading-snug normal-case">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="mt-2 text-sm text-[var(--club-navy-deep)]/70 leading-relaxed line-clamp-3">
                      {item.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TEAMS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <SectionHeading eyebrow="Effectifs" title="Toutes nos équipes" />
          <Link
            to="/equipes"
            className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
          >
            Le détail des équipes <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.slice(0, 6).map((team) => (
            <div
              key={team.id}
              className="rounded-2xl overflow-hidden border border-[var(--club-navy)]/10 hover:border-[var(--club-yellow)] transition-all bg-white"
            >
              {team.image_url && (
                <div className="h-36 overflow-hidden">
                  <img
                    src={team.image_url}
                    alt={team.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-condensed font-bold text-xl normal-case">
                    {team.name}
                  </h3>
                  {team.category && (
                    <span className="text-xs font-condensed font-semibold px-2.5 py-1 rounded-full bg-[var(--club-red)]/10 text-[var(--club-red)]">
                      {team.category}
                    </span>
                  )}
                </div>

                {team.coach && (
                  <p className="mt-3 text-sm text-[var(--club-navy-deep)]/70">
                    Entraîneur : {team.coach}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CALENDAR PREVIEW */}
      <section className="bg-[var(--club-navy-deep)] py-20 grain-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Agenda" title="Prochaines rencontres" dark />

          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 text-white"
              >
                <div className="text-xs font-condensed font-semibold text-[var(--club-yellow)] tracking-widest mb-4">
                  {match.competition || 'Rencontre'}
                </div>

                <div className="flex items-center justify-between gap-3 font-condensed font-bold text-lg normal-case">
                  <span className="flex-1 text-right">{getHomeTeam(match)}</span>
                  <span className="text-white/40 text-sm">vs</span>
                  <span className="flex-1">{getAwayTeam(match)}</span>
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm text-white/60">
                  <CalendarDays size={15} />
                  {formatDate(`${match.match_date}T12:00:00`)}
                  {match.match_time && ` · ${match.match_time.slice(0, 5)}`}
                </div>

                {match.location && (
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-white/60">
                    <MapPin size={15} />
                    {match.location}
                  </div>
                )}
              </div>
            ))}

            {matches.length === 0 && (
              <div className="md:col-span-3 text-center py-10 text-white/50 font-condensed">
                Aucun match programmé pour le moment.
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/calendrier"
              className="inline-flex items-center gap-2 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors"
            >
              Calendrier complet <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <SectionHeading eyebrow="En images" title="Galerie photo" />
          <Link
            to="/galerie"
            className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
          >
            Voir toute la galerie <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryPhotos.map((photo) => (
            <Link
              key={photo.id}
              to="/galerie"
              className="group relative h-44 rounded-xl overflow-hidden bg-[var(--club-navy-deep)]/5"
            >
              <img
                src={photo.image_url}
                alt={photo.caption || 'Galerie FC Plouha'}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <span className="text-white text-sm font-condensed font-semibold">
                    {photo.caption}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* PARTNERS */}
      <section className="bg-[var(--club-cream)] border-t border-black/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Ils nous soutiennent"
            title="Nos partenaires"
            align="center"
          />

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {partners.map((partner) => {
              const content = (
                <>
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={`Logo ${partner.name}`}
                      loading="lazy"
                      decoding="async"
                      className="h-12 max-w-36 object-contain"
                    />
                  ) : (
                    <span className="font-condensed font-bold text-[var(--club-navy)] text-sm">
                      {partner.name}
                    </span>
                  )}
                </>
              )

              return partner.website_url ? (
                <a
                  key={partner.id}
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-40 h-20 px-6 bg-white rounded-xl border border-black/5 flex items-center justify-center hover:shadow-md transition-shadow"
                >
                  {content}
                </a>
              ) : (
                <div
                  key={partner.id}
                  className="min-w-40 h-20 px-6 bg-white rounded-xl border border-black/5 flex items-center justify-center"
                >
                  {content}
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/partenaires"
              className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
            >
              Découvrir nos partenaires <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] py-24">
        
        {/* Image de fond côté gauche */}
        <div className="absolute top-0 left-0 bottom-0 w-1/2">
          <img
            src="/rejoignez-nous.jpg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            />
          
          {/* Fondu bleu vers la droite */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--club-navy-deep)]/70 to-[var(--club-navy-deep)]" />
        </div>
        
        {/* Effets de fond */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(255,199,44,0.15),transparent_45%),radial-gradient(circle_at_right,rgba(29,79,145,0.45),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-md shadow-2xl">
            
            {/* Accent jaune */}
            <div className="absolute top-0 left-0 h-full w-2 bg-[var(--club-yellow)]" />
            <div className="px-8 py-12 lg:px-14 lg:py-14 flex flex-col lg:flex-row items-center justify-between gap-12">
              
              {/* Texte */}
              <div className="max-w-2xl">
                
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--club-yellow)]/15 border border-[var(--club-yellow)]/30 px-4 py-2 text-[var(--club-yellow)] text-xs font-condensed font-bold uppercase tracking-[0.2em]">
                  Ensemble, écrivons la suite
                </span>
                
                <h2 className="mt-6 text-4xl lg:text-5xl text-white leading-tight">
                  Le FC Plouha a besoin de vous.
                </h2>
                
                <p className="mt-6 text-lg leading-relaxed text-white/75 font-condensed">
                  Le FC Plouha écrit une nouvelle page de son histoire.
                  <br /><br />
                  Joueurs, bénévoles, éducateurs ou partenaires, chacun peut contribuer à faire grandir le club.
                  <br /><br />
                  Rejoignez une aventure humaine portée par la passion du football et les couleurs des Falaises.
                </p>
                
                <div className="mt-8 h-px w-24 bg-[var(--club-yellow)]" />
                
              </div>
              
              {/* Boutons */}
              <div className="flex flex-col gap-4 w-full lg:w-auto shrink-0">
                
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] px-8 py-4 rounded-xl font-condensed font-bold shadow-lg hover:bg-white hover:scale-105 transition-all duration-300"
                  >
                  Nous rejoindre
                  <ArrowRight size={18} />
                </Link>
                
                <Link
                  to="/partenaires"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-condensed font-bold hover:bg-white/10 transition-all duration-300"
                  >
                  Devenir partenaire
                </Link>
                
              </div>
              
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home
