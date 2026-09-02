import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Shield,
  Shirt,
  UserRound,
  Users,
  ArrowRight,
  UserPlus,
  CalendarClock,
  Clock3,
  MapPin,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'
import {
  getNextTraining,
  weekdayLabels,
  type TrainingException,
  type TrainingSlot,
} from '@/lib/trainings'

type Team = {
  id: number
  name: string
  category: string | null
  season: string | null
  coach: string | null
  assistant_coach: string | null
  description: string | null
  image_url: string | null
  active: boolean
}

type Player = {
  id: number
  first_name: string
  last_name: string
  position: string | null
  shirt_number: number | null
  photo_url: string | null
  bio: string | null
  display_order: number
}

const positions = [
  'Gardien',
  'Défenseur',
  'Milieu',
  'Attaquant',
]

function TeamDetailPage() {
  const { id } = useParams()

  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [trainingSlots, setTrainingSlots] = useState<TrainingSlot[]>([])
  const [trainingExceptions, setTrainingExceptions] = useState<TrainingException[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)
  const [playersError, setPlayersError] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTeam(id)
    } else {
      setLoading(false)
      setNotFound(true)
    }
  }, [id])

  const fetchTeam = async (teamId: string) => {
    setLoading(true)
    setNotFound(false)
    setError(false)
    setPlayersError(false)

    try {
      const [teamResult, playersResult, trainingSlotsResult, trainingExceptionsResult] = await Promise.all([
        supabase
          .from('teams')
          .select(`
            id,
            name,
            category,
            season,
            coach,
            assistant_coach,
            description,
            image_url,
            active
          `)
          .eq('id', teamId)
          .eq('active', true)
          .maybeSingle(),

        supabase
          .from('players')
          .select(`
            id,
            first_name,
            last_name,
            position,
            shirt_number,
            photo_url,
            bio,
            display_order
          `)
          .eq('team_id', teamId)
          .eq('active', true)
          .order('display_order', { ascending: true })
          .order('last_name', { ascending: true }),

        supabase
          .from('training_slots')
          .select(`
            id,
            team_id,
            weekday,
            start_time,
            end_time,
            location,
            coach,
            start_date,
            end_date,
            active,
            teams (id, name, category)
          `)
          .eq('team_id', teamId)
          .eq('active', true)
          .order('weekday', { ascending: true })
          .order('start_time', { ascending: true }),

        supabase
          .from('training_exceptions')
          .select('*')
          .gte('original_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
          .order('original_date', { ascending: true }),
      ])

      if (teamResult.error) {
        console.error(teamResult.error)
        setTeam(null)
        setError(true)
        return
      }

      if (!teamResult.data) {
        setTeam(null)
        setNotFound(true)
        return
      }

      setTeam(teamResult.data)

      if (playersResult.error) {
        console.error(playersResult.error)
        setPlayers([])
        setPlayersError(true)
      } else {
        setPlayers(playersResult.data || [])
      }

      if (trainingSlotsResult.error) {
        console.error(trainingSlotsResult.error)
        setTrainingSlots([])
      } else {
        setTrainingSlots(
          ((trainingSlotsResult.data || []) as any[]).map((slot) => ({
            ...slot,
            teams: Array.isArray(slot.teams) ? slot.teams[0] ?? null : slot.teams,
          })) as TrainingSlot[],
        )
      }

      if (trainingExceptionsResult.error) {
        console.error(trainingExceptionsResult.error)
        setTrainingExceptions([])
      } else {
        setTrainingExceptions((trainingExceptionsResult.data || []) as TrainingException[])
      }
    } catch (fetchError) {
      console.error(fetchError)
      setTeam(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Seo title="Équipe" />
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2
          size={36}
          className="animate-spin text-[var(--club-navy-deep)]/40"
        />

        <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/50">
          Chargement de l'équipe...
        </p>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Seo title="Équipe indisponible" noIndex />
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
        <AlertTriangle
          size={48}
          className="mx-auto text-[var(--club-red)]"
        />

        <h1 className="mt-5 text-3xl text-[var(--club-navy-deep)]">
          Impossible de charger l'équipe
        </h1>

        <p className="mt-3 text-[var(--club-navy-deep)]/60">
          Une erreur est survenue pendant le chargement.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => id && fetchTeam(id)}
            className="inline-flex items-center justify-center gap-2 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold px-5 py-3 rounded-lg"
          >
            <RefreshCw size={17} />
            Réessayer
          </button>

          <Link
            to="/equipes"
            className="inline-flex items-center justify-center gap-2 border border-[var(--club-navy-deep)]/15 text-[var(--club-navy-deep)] font-condensed font-bold px-5 py-3 rounded-lg"
          >
            <ArrowLeft size={17} />
            Retour aux équipes
          </Link>
        </div>
        </section>
      </>
    )
  }

  if (notFound || !team) {
    return (
      <>
        <Seo title="Équipe introuvable" noIndex />
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
        <Shield
          size={48}
          className="mx-auto text-[var(--club-red)]"
        />

        <h1 className="mt-5 text-3xl text-[var(--club-navy-deep)]">
          Équipe introuvable
        </h1>

        <p className="mt-3 text-[var(--club-navy-deep)]/60">
          Cette équipe n'existe pas ou n'est pas publiée.
        </p>

        <Link
          to="/equipes"
          className="inline-flex items-center gap-2 mt-7 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold px-5 py-3 rounded-lg"
        >
          <ArrowLeft size={17} />
          Retour aux équipes
        </Link>
        </section>
      </>
    )
  }

  const groups = positions
    .map((position) => ({
      position,
      players: players.filter(
        (player) => player.position === position,
      ),
    }))
    .filter((group) => group.players.length > 0)

  const otherPlayers = players.filter(
    (player) =>
      !positions.includes(player.position || ''),
  )

  const nextTraining = getNextTraining(trainingSlots, trainingExceptions)

  const formatTrainingDate = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

  const seoDescription =
    team.description ||
    `Découvrez l'équipe ${team.name} du Football Club Plouha${
      team.category ? `, catégorie ${team.category}` : ''
    }.`

  return (
    <div>
      <Seo
        title={team.name}
        description={seoDescription}
        image={team.image_url}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] grain-overlay">

        {team.image_url && (
          <div className="absolute inset-0">
            <img
              src={team.image_url}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover opacity-35"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[var(--club-navy-deep)] via-[var(--club-navy-deep)]/85 to-[var(--club-navy-deep)]/50" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 py-16 sm:py-20 2xl:py-24">

          <Link
            to="/equipes"
            className="inline-flex items-center gap-2 text-white/65 hover:text-[var(--club-yellow)] font-condensed font-semibold text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Toutes les équipes
          </Link>

          <div className="mt-8 max-w-3xl">

            {team.category && (
              <span className="inline-flex bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold text-xs px-3 py-1.5 rounded-full">
                {team.category}
              </span>
            )}

            <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
              {team.name}
            </h1>

            {team.season && (
              <p className="mt-3 text-white/55 font-condensed">
                Saison {team.season}
              </p>
            )}

            {team.description && (
              <p className="mt-6 text-white/75 font-condensed text-lg 2xl:text-xl leading-relaxed max-w-2xl 2xl:max-w-3xl">
                {team.description}
              </p>
            )}

          </div>

        </div>

      </section>

      {playersError && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 text-amber-900">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p className="font-condensed text-sm">
                L'équipe a bien été chargée, mais la liste des joueurs est
                momentanément indisponible.
              </p>
            </div>

            <button
              type="button"
              onClick={() => id && fetchTeam(id)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 font-condensed font-bold text-sm text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ENCADREMENT */}
      {(team.coach || team.assistant_coach) && (
        <section className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 pt-14 2xl:pt-16">

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">

            {team.coach && (
              <div className="rounded-2xl border border-black/5 bg-white p-5 flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-[var(--club-red)]/10 flex items-center justify-center">
                  <UserRound
                    size={21}
                    className="text-[var(--club-red)]"
                  />
                </div>

                <div>
                  <p className="text-xs font-condensed text-[var(--club-navy-deep)]/50 uppercase tracking-wider">
                    Entraîneur
                  </p>

                  <p className="font-condensed font-bold text-lg text-[var(--club-navy-deep)]">
                    {team.coach}
                  </p>
                </div>

              </div>
            )}

            {team.assistant_coach && (
              <div className="rounded-2xl border border-black/5 bg-white p-5 flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-[var(--club-yellow)]/20 flex items-center justify-center">
                  <Users
                    size={21}
                    className="text-[var(--club-navy-deep)]"
                  />
                </div>

                <div>
                  <p className="text-xs font-condensed text-[var(--club-navy-deep)]/50 uppercase tracking-wider">
                    Entraîneur adjoint
                  </p>

                  <p className="font-condensed font-bold text-lg text-[var(--club-navy-deep)]">
                    {team.assistant_coach}
                  </p>
                </div>

              </div>
            )}

          </div>

        </section>
      )}

      {/* ENTRAÎNEMENTS */}
      {trainingSlots.length > 0 && (
        <section className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 pt-14 2xl:pt-16">
          <div className="rounded-3xl border border-black/5 bg-[var(--club-navy)]/[0.04] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-7">
              <div>
                <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
                  ENTRAÎNEMENTS
                </span>
                <h2 className="mt-2 text-3xl text-[var(--club-navy-deep)]">
                  Les créneaux de l'équipe
                </h2>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {trainingSlots.map((slot) => (
                    <div key={slot.id} className="rounded-2xl border border-black/5 bg-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[var(--club-yellow)]/25 flex items-center justify-center">
                          <CalendarClock size={21} className="text-[var(--club-navy-deep)]" />
                        </div>
                        <div>
                          <p className="font-condensed font-bold text-lg text-[var(--club-navy-deep)]">
                            {weekdayLabels[slot.weekday]}
                          </p>
                          <p className="text-sm text-[var(--club-navy-deep)]/55">
                            {slot.start_time.slice(0, 5)}{slot.end_time ? ` – ${slot.end_time.slice(0, 5)}` : ''}
                          </p>
                        </div>
                      </div>
                      {slot.location && (
                        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--club-navy-deep)]/60">
                          <MapPin size={15} /> {slot.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {nextTraining && (
                <div className="lg:w-[360px] shrink-0 rounded-2xl bg-[var(--club-navy-deep)] p-6 text-white">
                  <p className="text-xs font-condensed font-bold tracking-[0.2em] text-[var(--club-yellow)]">
                    PROCHAIN ENTRAÎNEMENT
                  </p>
                  <p className="mt-3 font-condensed text-2xl font-bold normal-case capitalize">
                    {formatTrainingDate(nextTraining.date)}
                  </p>
                  <p className="mt-4 flex items-center gap-2 text-white/75">
                    <Clock3 size={17} />
                    {nextTraining.startTime.slice(0, 5)}{nextTraining.endTime ? ` – ${nextTraining.endTime.slice(0, 5)}` : ''}
                  </p>
                  {nextTraining.location && (
                    <p className="mt-2 flex items-center gap-2 text-white/75">
                      <MapPin size={17} /> {nextTraining.location}
                    </p>
                  )}
                  {nextTraining.modified && (
                    <div className="mt-4 rounded-xl bg-[var(--club-yellow)]/15 px-4 py-3 text-sm text-[var(--club-yellow)]">
                      Cette séance a été exceptionnellement modifiée.
                      {nextTraining.note ? ` ${nextTraining.note}` : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* EFFECTIF */}
      <section className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 py-16 2xl:py-20">

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">

          <div>
            <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
              EFFECTIF
            </span>

            <h2 className="mt-2 text-3xl 2xl:text-4xl text-[var(--club-navy-deep)]">
              Les joueurs
            </h2>
          </div>

          <div className="font-condensed text-sm text-[var(--club-navy-deep)]/55">
            {players.length} joueur
            {players.length > 1 ? 's' : ''}
          </div>

        </div>

        {players.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white px-6 py-14 text-center">

            <Users
              size={42}
              className="mx-auto text-[var(--club-navy-deep)]/20"
            />

            <h3 className="mt-4 text-xl text-[var(--club-navy-deep)]">
              Effectif en construction
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-[var(--club-navy-deep)]/55">
              Les joueurs de cette équipe seront présentés ici au fur et à
              mesure. Vous souhaitez faire partie de l'aventure ?
            </p>

            <Link
              to={`/contact?subject=Inscription${
                team.category
                  ? `&category=${encodeURIComponent(team.category)}`
                  : ''
              }`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--club-yellow)] px-6 py-3 font-condensed font-bold text-[var(--club-navy-deep)] transition hover:brightness-105"
            >
              <UserPlus size={18} />
              Rejoindre cette équipe
            </Link>

          </div>
        ) : (
          <div className="space-y-12">

            {groups.map((group) => (
              <PlayerGroup
                key={group.position}
                title={group.position}
                players={group.players}
              />
            ))}

            {otherPlayers.length > 0 && (
              <PlayerGroup
                title="Autres joueurs"
                players={otherPlayers}
              />
            )}

          </div>
        )}

      </section>

      <section className="bg-[var(--club-navy-deep)]">
        <div className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 py-12 2xl:py-14">
          <div className="flex flex-col gap-7 rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-8 sm:px-9 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="font-condensed text-xs font-bold tracking-[0.22em] text-[var(--club-yellow)]">
                REJOINDRE L'ÉQUIPE
              </span>
              <h2 className="mt-2 text-3xl text-white">
                Envie de porter les couleurs du FC Plouha ?
              </h2>
              <p className="mt-3 font-condensed leading-relaxed text-white/65">
                Envoyez votre demande au club. La catégorie
                {team.category ? ` « ${team.category} »` : ''} sera
                automatiquement renseignée dans le formulaire.
              </p>
            </div>

            <Link
              to={`/contact?subject=Inscription${
                team.category
                  ? `&category=${encodeURIComponent(team.category)}`
                  : ''
              }`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--club-yellow)] px-7 py-3.5 font-condensed font-bold text-[var(--club-navy-deep)] transition hover:brightness-105"
            >
              Faire une demande
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

function PlayerGroup({
  title,
  players,
}: {
  title: string
  players: Player[]
}) {
  return (
    <div>

      <h3 className="font-condensed font-bold text-xl 2xl:text-2xl text-[var(--club-navy-deep)] mb-5">
        {title}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">

        {players.map((player) => (
          <article
            key={player.id}
            className="group overflow-hidden rounded-2xl border border-black/5 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >

            <div className="relative h-56 bg-[var(--club-navy-deep)]/5 overflow-hidden">

              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={`${player.first_name} ${player.last_name}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserRound
                    size={48}
                    className="text-[var(--club-navy-deep)]/15"
                  />
                </div>
              )}

              {player.shirt_number !== null && (
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-[var(--club-yellow)] text-[var(--club-navy-deep)] flex items-center justify-center font-black shadow">
                  {player.shirt_number}
                </div>
              )}

            </div>

            <div className="p-4">

              <h4 className="font-condensed font-bold text-lg leading-tight text-[var(--club-navy-deep)] normal-case">
                {player.first_name}
                <span className="block uppercase">
                  {player.last_name}
                </span>
              </h4>

              {player.position && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-condensed font-semibold text-[var(--club-red)]">
                  <Shirt size={13} />
                  {player.position}
                </div>
              )}

              {player.bio && (
                <p className="mt-3 text-xs leading-relaxed text-[var(--club-navy-deep)]/55 line-clamp-3">
                  {player.bio}
                </p>
              )}

            </div>

          </article>
        ))}

      </div>

    </div>
  )
}

export default TeamDetailPage
