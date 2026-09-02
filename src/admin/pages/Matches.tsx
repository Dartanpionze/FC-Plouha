import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAccess } from '@/admin/hooks/useAdminAccess'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  MapPin,
  Clock,
  RefreshCw,
  ExternalLink,
  Trophy,
  Ban,
  CircleDot,
  ImageDown,
} from 'lucide-react'

type Team = {
  id: number
  name: string
  category: string | null
  season: string | null
  active: boolean
}

type Match = {
  id: number
  created_at: string
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
  notes: string | null
  teams?: Team | null
}

export default function Matches() {
  const { can } = useAdminAccess()
  const canCreate = can('matches', 'create')
  const canUpdate = can('matches', 'update')
  const canDelete = can('matches', 'delete')

  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  const [teamId, setTeamId] = useState('')
  const [opponent, setOpponent] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchTime, setMatchTime] = useState('')
  const [location, setLocation] = useState('')
  const [isHome, setIsHome] = useState(true)
  const [competition, setCompetition] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [notes, setNotes] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchPageData()
  }, [])

  const fetchPageData = async () => {
    setFetching(true)

    try {
      const [teamsResult, matchesResult] = await Promise.all([
        supabase
          .from('teams')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true }),

        supabase
          .from('matches')
          .select(`
            *,
            teams (
              id,
              name,
              category,
              season,
              active
            )
          `)
          .order('match_date', { ascending: true })
          .order('match_time', { ascending: true }),
      ])

      const errors: string[] = []

      if (teamsResult.error) {
        console.error(teamsResult.error)
        errors.push('les équipes')
      } else {
        setTeams(teamsResult.data || [])
      }

      if (matchesResult.error) {
        console.error(matchesResult.error)
        errors.push('les matchs')
      } else {
        setMatches(matchesResult.data || [])
      }

      if (errors.length > 0) {
        setMessage(
          `Impossible de récupérer ${errors.join(
            ' et ',
          )}. Vous pouvez réessayer.`,
        )
        return false
      }

      return true
    } catch (fetchError) {
      console.error(fetchError)
      setMessage(
        'Impossible de récupérer les données du calendrier. Vous pouvez réessayer.',
      )
      return false
    } finally {
      setFetching(false)
    }
  }

  const resetForm = () => {
    setTeamId('')
    setOpponent('')
    setMatchDate('')
    setMatchTime('')
    setLocation('')
    setIsHome(true)
    setCompetition('')
    setStatus('scheduled')
    setHomeScore('')
    setAwayScore('')
    setNotes('')

    setEditingId(null)
    setMessage('')
    setShowForm(false)
  }

  const openNewForm = () => {
    if (!canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer un match.")
      return
    }

    resetForm()
    setShowForm(true)
  }

  const editMatch = (match: Match) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un match.")
      return
    }

    setEditingId(match.id)

    setTeamId(match.team_id?.toString() || '')
    setOpponent(match.opponent)
    setMatchDate(match.match_date)
    setMatchTime(match.match_time || '')
    setLocation(match.location || '')
    setIsHome(match.is_home)
    setCompetition(match.competition || '')
    setStatus(match.status || 'scheduled')
    setHomeScore(
      match.home_score !== null
        ? match.home_score.toString()
        : '',
    )
    setAwayScore(
      match.away_score !== null
        ? match.away_score.toString()
        : '',
    )
    setNotes(match.notes || '')

    setMessage('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const saveMatch = async () => {
    if (editingId && !canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un match.")
      return
    }

    if (!editingId && !canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer un match.")
      return
    }

    if (!teamId) {
      setMessage("Veuillez sélectionner l'équipe.")
      return
    }

    if (!opponent.trim()) {
      setMessage("L'adversaire est obligatoire.")
      return
    }

    if (!matchDate) {
      setMessage('La date du match est obligatoire.')
      return
    }

    if (status === 'finished') {
      if (homeScore === '' || awayScore === '') {
        setMessage('Renseignez les deux scores pour un match terminé.')
        return
      }

      const parsedHomeScore = Number(homeScore)
      const parsedAwayScore = Number(awayScore)

      if (
        !Number.isInteger(parsedHomeScore) ||
        !Number.isInteger(parsedAwayScore) ||
        parsedHomeScore < 0 ||
        parsedAwayScore < 0
      ) {
        setMessage('Les scores doivent être des nombres entiers positifs.')
        return
      }
    }

    setLoading(true)
    setMessage('')

    const payload = {
      team_id: Number(teamId),
      opponent: opponent.trim(),
      match_date: matchDate,
      match_time: matchTime || null,
      location: location.trim() || null,
      is_home: isHome,
      competition: competition.trim() || null,
      status,
      home_score:
        status === 'finished' ? Number(homeScore) : null,
      away_score:
        status === 'finished' ? Number(awayScore) : null,
      notes: notes.trim() || null,
    }

    let error

    if (editingId) {
      const result = await supabase
        .from('matches')
        .update(payload)
        .eq('id', editingId)

      error = result.error
    } else {
      const result = await supabase
        .from('matches')
        .insert([payload])

      error = result.error
    }

    if (error) {
      console.error(error)
      setMessage("Erreur lors de l'enregistrement du match.")
      setLoading(false)
      return
    }

    const wasEditing = Boolean(editingId)

    resetForm()

    const refreshed = await fetchPageData()

    if (refreshed) {
      setMessage(
        wasEditing
          ? 'Match modifié avec succès.'
          : 'Match ajouté avec succès.',
      )
    }

    setLoading(false)
  }

  const deleteMatch = async (id: number) => {
    if (!canDelete) {
      setMessage("Vous n'avez pas l'autorisation de supprimer un match.")
      return
    }

    const confirmDelete = window.confirm(
      'Supprimer définitivement ce match ?',
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      setMessage('Erreur lors de la suppression.')
      return
    }

    const refreshed = await fetchPageData()

    if (refreshed) {
      setMessage('Match supprimé.')
    }
  }

  const filteredMatches = matches.filter((match) => {
    const query = search.trim().toLowerCase()

    const matchesStatus =
      statusFilter === 'all' ||
      match.status === statusFilter

    const matchesSearch =
      !query ||
      match.opponent.toLowerCase().includes(query) ||
      match.teams?.name.toLowerCase().includes(query) ||
      match.competition?.toLowerCase().includes(query) ||
      match.location?.toLowerCase().includes(query)

    return matchesStatus && Boolean(matchesSearch)
  })

  const scheduledCount = matches.filter(
    (match) => match.status === 'scheduled',
  ).length

  const finishedCount = matches.filter(
    (match) => match.status === 'finished',
  ).length

  const cancelledCount = matches.filter(
    (match) => match.status === 'cancelled',
  ).length

  const formatDate = (date: string) => {
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

  const getStatusLabel = (value: string) => {
    switch (value) {
      case 'finished':
        return 'Terminé'
      case 'cancelled':
        return 'Annulé'
      default:
        return 'À venir'
    }
  }

  const getStatusClass = (value: string) => {
    switch (value) {
      case 'finished':
        return 'bg-blue-500/10 text-blue-400'
      case 'cancelled':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-green-500/10 text-green-400'
    }
  }


  const loadPosterImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = src
    })

  const setPosterFont = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    startSize: number,
    minSize: number,
    weight = 800,
  ) => {
    let size = startSize
    while (size > minSize) {
      ctx.font = `${weight} ${size}px Arial, sans-serif`
      if (ctx.measureText(text).width <= maxWidth) break
      size -= 2
    }
    ctx.font = `${weight} ${size}px Arial, sans-serif`
  }

  const generateMatchPoster = async (match: Match) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1350
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        setMessage("Impossible de générer l'affiche sur cet appareil.")
        return
      }

      const gradient = ctx.createLinearGradient(0, 0, 1080, 1350)
      gradient.addColorStop(0, '#123d6b')
      gradient.addColorStop(0.45, '#071b33')
      gradient.addColorStop(1, '#04111f')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1080, 1350)

      ctx.fillStyle = '#ffc72c'
      ctx.fillRect(0, 0, 1080, 18)
      ctx.fillStyle = '#c8202f'
      ctx.fillRect(0, 18, 1080, 8)

      ctx.globalAlpha = 0.08
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(920, 260, 300, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(920, 260, 135, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(920, -40)
      ctx.lineTo(920, 560)
      ctx.stroke()
      ctx.globalAlpha = 1

      try {
        const logo = await loadPosterImage('/logo.png')
        const ratio = Math.min(220 / logo.naturalWidth, 220 / logo.naturalHeight)
        const width = logo.naturalWidth * ratio
        const height = logo.naturalHeight * ratio
        ctx.drawImage(logo, (1080 - width) / 2, 75, width, height)
      } catch (logoError) {
        console.error('Logo non chargé pour affiche :', logoError)
      }

      const isResult = match.status === 'finished'
      const clubTeam = match.teams?.name || 'FC Plouha'
      const homeTeam = match.is_home ? clubTeam : match.opponent
      const awayTeam = match.is_home ? match.opponent : clubTeam

      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffc72c'
      ctx.font = '800 42px Arial, sans-serif'
      ctx.fillText(isResult ? 'RÉSULTAT' : 'PROCHAIN MATCH', 540, 365)

      if (match.competition) {
        ctx.fillStyle = 'rgba(255,255,255,0.72)'
        setPosterFont(ctx, match.competition.toUpperCase(), 820, 28, 20, 700)
        ctx.fillText(match.competition.toUpperCase(), 540, 415)
      }

      ctx.fillStyle = '#ffffff'
      setPosterFont(ctx, homeTeam.toUpperCase(), 850, 66, 38, 900)
      ctx.fillText(homeTeam.toUpperCase(), 540, 555)

      if (isResult && match.home_score !== null && match.away_score !== null) {
        ctx.fillStyle = '#ffc72c'
        ctx.font = '900 126px Arial, sans-serif'
        ctx.fillText(`${match.home_score}  -  ${match.away_score}`, 540, 735)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.font = '800 42px Arial, sans-serif'
        ctx.fillText('VS', 540, 690)
      }

      ctx.fillStyle = '#ffffff'
      setPosterFont(ctx, awayTeam.toUpperCase(), 850, 66, 38, 900)
      ctx.fillText(awayTeam.toUpperCase(), 540, isResult ? 855 : 825)

      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(170, 930)
      ctx.lineTo(910, 930)
      ctx.stroke()

      const dateLabel = new Date(`${match.match_date}T12:00:00`).toLocaleDateString(
        'fr-FR',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
      )

      ctx.fillStyle = '#ffc72c'
      ctx.font = '800 35px Arial, sans-serif'
      ctx.fillText(dateLabel.toUpperCase(), 540, 1005)

      if (!isResult && match.match_time) {
        ctx.fillStyle = '#ffffff'
        ctx.font = '900 50px Arial, sans-serif'
        ctx.fillText(match.match_time.slice(0, 5), 540, 1070)
      }

      if (match.location) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        setPosterFont(ctx, match.location, 800, 30, 22, 600)
        ctx.fillText(match.location, 540, isResult ? 1075 : 1130)
      }

      ctx.fillStyle = '#c8202f'
      ctx.fillRect(150, 1205, 780, 4)
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = '700 24px Arial, sans-serif'
      ctx.fillText('FC PLOUHA · LES FALAISES', 540, 1265)
      ctx.fillStyle = '#ffc72c'
      ctx.font = '700 22px Arial, sans-serif'
      ctx.fillText('fcplouha.fr', 540, 1305)

      const safeOpponent = match.opponent
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()

      const link = document.createElement('a')
      link.download = `${isResult ? 'resultat' : 'match'}-${match.match_date}-fc-plouha-${safeOpponent || match.id}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      link.remove()

      setMessage(isResult ? 'Visuel du résultat généré en PNG.' : 'Affiche du match générée en PNG.')
    } catch (posterError) {
      console.error(posterError)
      setMessage("Impossible de générer l'affiche du match.")
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion sportive
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Calendrier
          </h1>

          <p className="mt-2 text-slate-400">
            Programmez les rencontres et publiez les résultats du FC Plouha.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          <a
            href="/calendrier"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition"
          >
            <ExternalLink size={17} />
            Voir le calendrier public
          </a>

          <button
            type="button"
            onClick={() => void fetchPageData()}
            disabled={fetching}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition"
          >
            <RefreshCw
              size={17}
              className={fetching ? 'animate-spin' : ''}
            />
            Actualiser
          </button>

          {canCreate && (
            <button
              onClick={openNewForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition"
            >
              <Plus size={19} />
              Ajouter un match
            </button>
          )}

        </div>
      </div>

      {/* INDICATEURS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

        <button
          type="button"
          onClick={() => setStatusFilter('scheduled')}
          className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
        >
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <CircleDot size={19} className="text-green-400" />
            À venir
          </div>
          <p className="mt-3 text-3xl font-bold">{scheduledCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('finished')}
          className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
        >
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Trophy size={19} className="text-blue-400" />
            Terminés
          </div>
          <p className="mt-3 text-3xl font-bold">{finishedCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
        >
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Ban size={19} className="text-red-400" />
            Annulés
          </div>
          <p className="mt-3 text-3xl font-bold">{cancelledCount}</p>
        </button>

      </div>

      {/* MESSAGE */}
      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {fetching && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
          Chargement du calendrier...
        </div>
      )}

      {!fetching &&
        message.startsWith('Impossible de récupérer') && (
          <button
            type="button"
            onClick={() => fetchPageData()}
            className="mb-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition"
          >
            Réessayer le chargement
          </button>
        )}

      {/* FORMULAIRE */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                {editingId
                  ? 'Modifier le match'
                  : 'Ajouter un match'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Programmez une rencontre ou renseignez son résultat.
              </p>
            </div>

            <button
              onClick={resetForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <X size={19} />
            </button>

          </div>

          <div className="space-y-6">

            {/* EQUIPE / ADVERSAIRE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Équipe
                </label>

                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                >
                  <option value="">
                    Sélectionner une équipe
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.name}
                      {team.category
                        ? ` · ${team.category}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Adversaire
                </label>

                <input
                  type="text"
                  placeholder="Nom du club adverse"
                  value={opponent}
                  onChange={(e) =>
                    setOpponent(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
                />
              </div>

            </div>

            {/* DATE / HEURE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Date
                </label>

                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) =>
                    setMatchDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Heure
                </label>

                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) =>
                    setMatchTime(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

            </div>

            {/* DOMICILE / EXTERIEUR */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                Rencontre
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setIsHome(true)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    isHome
                      ? 'border-[var(--club-yellow)] bg-[var(--club-yellow)]/10 text-[var(--club-yellow)]'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/5'
                  }`}
                >
                  🏠 Domicile
                </button>

                <button
                  type="button"
                  onClick={() => setIsHome(false)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    !isHome
                      ? 'border-[var(--club-yellow)] bg-[var(--club-yellow)]/10 text-[var(--club-yellow)]'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/5'
                  }`}
                >
                  🚌 Extérieur
                </button>

              </div>
            </div>

            {/* COMPETITION / STATUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Compétition
                </label>

                <input
                  type="text"
                  placeholder="Ex : Championnat D4"
                  value={competition}
                  onChange={(e) =>
                    setCompetition(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Statut
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                >
                  <option value="scheduled">
                    À venir
                  </option>

                  <option value="finished">
                    Terminé
                  </option>

                  <option value="cancelled">
                    Annulé
                  </option>
                </select>
              </div>

            </div>

            {/* SCORE */}
            {status === 'finished' && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Score
                </label>

                <div className="grid grid-cols-2 gap-5">

                  <div>
                    <label className="block text-xs text-slate-500 mb-2">
                      {isHome
                        ? 'FC Plouha'
                        : 'Adversaire'}
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) =>
                        setHomeScore(e.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-2">
                      {isHome
                        ? 'Adversaire'
                        : 'FC Plouha'}
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) =>
                        setAwayScore(e.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* LIEU */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Lieu
              </label>

              <input
                type="text"
                placeholder="Ex : Stade de Plouha"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
              />
            </div>

            {/* NOTES */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Notes
              </label>

              <textarea
                rows={4}
                placeholder="Informations complémentaires..."
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30 resize-none"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">

              <button
                onClick={saveMatch}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading
                  ? 'Enregistrement...'
                  : editingId
                    ? 'Mettre à jour le match'
                    : 'Ajouter le match'}
              </button>

              <button
                onClick={resetForm}
                className="px-6 rounded-xl bg-white/5 hover:bg-white/10 py-3.5 font-semibold transition"
              >
                Annuler
              </button>

            </div>

          </div>
        </div>
      )}

      {/* LISTE */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

        <div className="p-5 border-b border-white/10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold">
              Calendrier des matchs
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {filteredMatches.length} match
              {filteredMatches.length > 1 ? 's' : ''}
              {(statusFilter !== 'all' || search.trim()) &&
                ` sur ${matches.length}`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="scheduled">À venir</option>
              <option value="finished">Terminés</option>
              <option value="cancelled">Annulés</option>
            </select>

            <div className="relative w-full sm:w-72">

              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-white/30"
              />

            </div>

          </div>

        </div>

        <div className="divide-y divide-white/5">

          {filteredMatches.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              Aucun match trouvé.
            </div>
          )}

          {filteredMatches.map((match) => (

            <div
              key={match.id}
              className="p-5 hover:bg-white/[0.02] transition"
            >

              <div className="flex flex-col lg:flex-row lg:items-center gap-5">

                {/* DATE */}
                <div className="w-full lg:w-44 shrink-0">

                  <div className="flex items-center gap-2 text-[var(--club-yellow)]">
                    <CalendarDays size={17} />

                    <span className="text-sm font-semibold capitalize">
                      {formatDate(match.match_date)}
                    </span>
                  </div>

                  {match.match_time && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                      <Clock size={15} />
                      {match.match_time.slice(0, 5)}
                    </div>
                  )}

                </div>

                {/* MATCH */}
                <div className="flex-1 min-w-0">

                  <div className="flex flex-wrap items-center gap-2 mb-2">

                    {match.teams && (
                      <span className="text-xs text-slate-500">
                        {match.teams.name}
                      </span>
                    )}

                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusClass(
                        match.status,
                      )}`}
                    >
                      {getStatusLabel(match.status)}
                    </span>

                  </div>

                  <div className="flex items-center gap-3">

                    <span className="font-semibold">
                      {match.is_home
                        ? match.teams?.name || 'FC Plouha'
                        : match.opponent}
                    </span>

                    <span className="text-slate-600 font-bold">
                      VS
                    </span>

                    <span className="font-semibold">
                      {match.is_home
                        ? match.opponent
                        : match.teams?.name || 'FC Plouha'}
                    </span>

                  </div>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">

                    {match.competition && (
                      <span>
                        {match.competition}
                      </span>
                    )}

                    {match.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} />
                        {match.location}
                      </span>
                    )}

                  </div>

                  {match.status === 'finished' &&
                    match.home_score !== null &&
                    match.away_score !== null && (
                      <div className="mt-3 text-xl font-black">
                        {match.home_score}
                        <span className="mx-2 text-slate-600">
                          -
                        </span>
                        {match.away_score}
                      </div>
                    )}

                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  {match.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => void generateMatchPoster(match)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--club-yellow)]/10 hover:bg-[var(--club-yellow)]/20 text-[var(--club-yellow)] text-sm font-semibold transition"
                    >
                      <ImageDown size={16} />
                      {match.status === 'finished'
                        ? 'Générer le résultat'
                        : "Générer l'affiche"}
                    </button>
                  )}

                  {canUpdate && (
                    <button
                      onClick={() => editMatch(match)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                    >
                      <Pencil size={16} />
                      Modifier
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}
                </div>

              </div>

            </div>

          ))}

        </div>
      </div>
    </div>
  )
}
