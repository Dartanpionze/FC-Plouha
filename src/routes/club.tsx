import { useEffect, useState } from 'react'
import {
  Award,
  HeartHandshake,
  ShieldHalf,
  Users2,
  AlertTriangle,
  Mail,
  Phone,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SectionHeading } from '@/components/SectionHeading'
import Seo from '@/components/Seo'

type ClubSettings = {
  club_name: string | null
  short_name: string | null
  season: string | null
  description: string | null
  founded_year: number | null
  members_count: number | null
  volunteers_count: number | null
  district_titles: number | null
  city: string | null
}

type HistoryItem = {
  id: number
  year: number
  title: string
  description: string | null
  display_order: number
}

type StaffMember = {
  id: number
  name: string
  role: string
  photo_url: string | null
  email: string | null
  phone: string | null
  display_order: number
  active: boolean
}

type Team = {
  id: number
  active: boolean
}

function ClubPage() {
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchClubData()
  }, [])

  const fetchClubData = async () => {
    setLoading(true)
    setError(false)

    try {
      const [
        settingsResult,
        historyResult,
        staffResult,
        teamsResult,
      ] = await Promise.all([
        supabase
          .from('club_settings')
          .select(`
            club_name,
            short_name,
            season,
            description,
            founded_year,
            members_count,
            volunteers_count,
            district_titles,
            city
          `)
          .limit(1)
          .single(),

        supabase
          .from('club_history')
          .select('*')
          .order('display_order', { ascending: true })
          .order('year', { ascending: true }),

        supabase
          .from('club_staff')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),

        supabase
          .from('teams')
          .select('id, active')
          .eq('active', true),
      ])

      const results = [
        settingsResult,
        historyResult,
        staffResult,
        teamsResult,
      ]

      if (results.some((result) => Boolean(result.error))) {
        results.forEach((result) => {
          if (result.error) console.error(result.error)
        })

        setError(true)
      }

      setSettings(settingsResult.data || null)
      setHistory(historyResult.data || [])
      setStaff(staffResult.data || [])
      setTeams(teamsResult.data || [])
    } catch (fetchError) {
      console.error(fetchError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const clubName =
    settings?.club_name || 'Football Club Plouha'

  const shortName =
    settings?.short_name || 'FC Plouha'

  const foundedYear =
    settings?.founded_year ?? 2026

  const membersCount =
    settings?.members_count ?? 0

  const volunteersCount =
    settings?.volunteers_count ?? 0

  const districtTitles =
    settings?.district_titles ?? 0

  const city =
    settings?.city || 'Plouha'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2
          size={36}
          className="animate-spin text-[var(--club-navy-deep)]/40"
        />

        <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/50">
          Chargement du club...
        </p>
      </div>
    )
  }

  return (
    <div>
      <Seo
        title="Le club"
        description="Découvrez le Football Club Plouha, son histoire, ses dirigeants, ses bénévoles et les informations essentielles du club."
      />

      {error && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 text-amber-900">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p className="font-condensed text-sm">
                Certaines informations du club n'ont pas pu être chargées.
                Les données disponibles restent affichées.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchClubData}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 font-condensed font-bold text-sm text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] grain-overlay py-20 2xl:py-24">

        <div className="absolute inset-0 opacity-20">
          <img
            src="/fond-foot.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-[var(--club-navy-deep)]/40 to-[var(--club-navy-deep)]" />

        <div className="relative z-10 max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 text-center">

          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            LE CLUB
          </span>

          <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            {clubName}
          </h1>

          <p className="mt-6 text-white/70 font-condensed text-lg 2xl:text-xl max-w-2xl 2xl:max-w-3xl mx-auto 2xl:leading-relaxed">
            {settings?.description ||
              `Une aventure humaine et sportive à ${city}, portée par la passion du football et l'envie de construire ensemble l'avenir des Falaises.`}
          </p>

        </div>

      </section>

      {/* INTRO / CHIFFRES */}
      <section className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 2xl:px-8 py-20 2xl:py-24">

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">

          <div>

            <SectionHeading
              eyebrow="Notre identité"
              title="Une histoire ancrée dans le Goëlo"
            />

            <p className="mt-6 font-condensed text-lg text-[var(--club-navy-deep)]/80 leading-relaxed">
              {settings?.description ||
                `Fondé en ${foundedYear}, le ${clubName} rassemble joueurs, éducateurs, bénévoles et partenaires autour d'une même passion : le football.`}
            </p>

            <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/65 leading-relaxed">
              Pour la saison {settings?.season || '2026/2027'},
              le club compte {membersCount} licencié
              {membersCount > 1 ? 's' : ''} réparti
              {membersCount > 1 ? 's' : ''} en {teams.length} équipe
              {teams.length > 1 ? 's' : ''}.
            </p>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-2xl bg-[var(--club-navy-deep)] text-white p-6 text-center">
              <div className="font-display text-4xl text-[var(--club-yellow)]">
                {foundedYear}
              </div>
              <div className="mt-1 text-xs font-condensed tracking-widest text-white/55">
                FONDATION
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--club-navy-deep)] text-white p-6 text-center">
              <div className="font-display text-4xl text-[var(--club-yellow)]">
                {membersCount}
              </div>
              <div className="mt-1 text-xs font-condensed tracking-widest text-white/55">
                LICENCIÉS
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-6 text-center">
              <div className="font-display text-4xl text-[var(--club-red)]">
                {teams.length}
              </div>
              <div className="mt-1 text-xs font-condensed tracking-widest text-[var(--club-navy-deep)]/55">
                ÉQUIPES
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-6 text-center">
              <div className="font-display text-4xl text-[var(--club-red)]">
                {volunteersCount}
              </div>
              <div className="mt-1 text-xs font-condensed tracking-widest text-[var(--club-navy-deep)]/55">
                BÉNÉVOLES
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* CHRONOLOGIE */}
      <section className="bg-[var(--club-navy)]/[0.04] py-20">

        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <SectionHeading
            eyebrow="Chronologie"
            title="Les grandes dates"
            align="center"
          />

          {history.length === 0 ? (
            <div className="mt-12 text-center text-[var(--club-navy-deep)]/50 font-condensed">
              L'histoire du club sera prochainement complétée.
            </div>
          ) : (
            <ol className="mt-12 relative border-l-2 border-[var(--club-yellow)] ml-3">

              {history.map((item) => (
                <li
                  key={item.id}
                  className="mb-10 ml-8"
                >

                  <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-[var(--club-red)] border-2 border-white" />

                  <div className="font-display text-xl text-[var(--club-navy)]">
                    {item.year}
                  </div>

                  <h3 className="mt-1 font-condensed font-bold text-lg text-[var(--club-navy-deep)]">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="font-condensed text-[var(--club-navy-deep)]/70 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                </li>
              ))}

            </ol>
          )}

        </div>

      </section>

      {/* VALEURS */}
      <section className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 py-20 2xl:py-24">

        <SectionHeading
          eyebrow="Nos valeurs"
          title="Ce qui nous rassemble"
          align="center"
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {[
            {
              icon: ShieldHalf,
              title: 'Respect',
              text: "Des terrains, des arbitres et de l'adversaire, en toute circonstance.",
            },
            {
              icon: Users2,
              title: 'Convivialité',
              text: 'Un club où chacun trouve sa place, joueur, parent ou bénévole.',
            },
            {
              icon: Award,
              title: 'Exigence',
              text: "Progresser à son rythme, de l'école de foot aux séniors.",
            },
            {
              icon: HeartHandshake,
              title: 'Engagement',
              text: 'Des bénévoles qui font vivre le club toute la saison.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="text-center p-6 rounded-2xl bg-white border border-black/5"
            >
              <Icon
                className="mx-auto text-[var(--club-red)]"
                size={30}
              />

              <h3 className="mt-4 font-condensed font-bold text-lg">
                {title}
              </h3>

              <p className="mt-2 text-sm text-[var(--club-navy-deep)]/70">
                {text}
              </p>
            </div>
          ))}

        </div>

        {districtTitles > 0 && (
          <div className="mt-10 flex justify-center">

            <div className="inline-flex items-center gap-3 rounded-full bg-[var(--club-yellow)]/15 border border-[var(--club-yellow)]/30 px-5 py-3 text-[var(--club-navy-deep)]">

              <Award
                size={20}
                className="text-[var(--club-red)]"
              />

              <span className="font-condensed font-bold">
                {districtTitles} titre
                {districtTitles > 1 ? 's' : ''} de District
              </span>

            </div>

          </div>
        )}

      </section>

      {/* BUREAU */}
      <section className="bg-[var(--club-navy-deep)] py-20 grain-overlay">

        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <SectionHeading
            eyebrow="Bureau directeur"
            title="L'équipe dirigeante"
            dark
            align="center"
          />

          {staff.length === 0 ? (
            <p className="mt-12 text-center text-white/45 font-condensed">
              Le bureau du club sera prochainement présenté.
            </p>
          ) : (
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {staff.map((person) => (
                <div
                  key={person.id}
                  className="overflow-hidden bg-white/5 border border-white/10 rounded-2xl text-white"
                >

                  {person.photo_url && (
                    <div className="h-56 overflow-hidden">
                      <img
                        src={person.photo_url}
                        alt={person.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-5">

                    <div className="font-condensed font-bold text-lg">
                      {person.name}
                    </div>

                    <div className="text-sm text-[var(--club-yellow)] mt-1">
                      {person.role}
                    </div>

                    {(person.email || person.phone) && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm text-white/60">

                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                          >
                            <Mail size={14} />
                            {person.email}
                          </a>
                        )}

                        {person.phone && (
                          <a
                            href={`tel:${person.phone.replace(/\s/g, '')}`}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                          >
                            <Phone size={14} />
                            {person.phone}
                          </a>
                        )}

                      </div>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

          <p className="mt-10 text-center text-white/50 font-condensed">
            {shortName} · {membersCount} licencié
            {membersCount > 1 ? 's' : ''} · {teams.length} équipe
            {teams.length > 1 ? 's' : ''}
          </p>

        </div>

      </section>

      {error && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-[var(--club-red)]">
          Certaines informations n'ont pas pu être chargées.
        </div>
      )}

    </div>
  )
}

export default ClubPage
