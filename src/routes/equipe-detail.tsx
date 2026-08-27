import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Shield,
  Shirt,
  UserRound,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTeam(id)
    }
  }, [id])

  const fetchTeam = async (teamId: string) => {
    setLoading(true)
    setNotFound(false)

    const [teamResult, playersResult] = await Promise.all([
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
    ])

    if (teamResult.error) {
      console.error(teamResult.error)
      setNotFound(true)
      setLoading(false)
      return
    }

    if (!teamResult.data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    if (playersResult.error) {
      console.error(playersResult.error)
    }

    setTeam(teamResult.data)
    setPlayers(playersResult.data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2
          size={36}
          className="animate-spin text-[var(--club-navy-deep)]/40"
        />

        <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/50">
          Chargement de l'équipe...
        </p>
      </div>
    )
  }

  if (notFound || !team) {
    return (
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

  return (
    <div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] grain-overlay">

        {team.image_url && (
          <div className="absolute inset-0">
            <img
              src={team.image_url}
              alt=""
              className="w-full h-full object-cover opacity-35"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[var(--club-navy-deep)] via-[var(--club-navy-deep)]/85 to-[var(--club-navy-deep)]/50" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">

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

            <h1 className="mt-4 text-4xl sm:text-6xl text-white">
              {team.name}
            </h1>

            {team.season && (
              <p className="mt-3 text-white/55 font-condensed">
                Saison {team.season}
              </p>
            )}

            {team.description && (
              <p className="mt-6 text-white/75 font-condensed text-lg leading-relaxed max-w-2xl">
                {team.description}
              </p>
            )}

          </div>

        </div>

      </section>

      {/* ENCADREMENT */}
      {(team.coach || team.assistant_coach) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14">

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

      {/* EFFECTIF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">

          <div>
            <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
              EFFECTIF
            </span>

            <h2 className="mt-2 text-3xl text-[var(--club-navy-deep)]">
              Les joueurs
            </h2>
          </div>

          <div className="font-condensed text-sm text-[var(--club-navy-deep)]/55">
            {players.length} joueur
            {players.length > 1 ? 's' : ''}
          </div>

        </div>

        {players.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white py-16 text-center">

            <Users
              size={42}
              className="mx-auto text-[var(--club-navy-deep)]/20"
            />

            <h3 className="mt-4 text-xl text-[var(--club-navy-deep)]">
              Effectif à venir
            </h3>

            <p className="mt-2 text-[var(--club-navy-deep)]/55">
              Les joueurs de cette équipe seront prochainement présentés.
            </p>

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

      <h3 className="font-condensed font-bold text-xl text-[var(--club-navy-deep)] mb-5">
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
