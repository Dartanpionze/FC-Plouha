import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { removeStorageFile } from '@/lib/storage'
import {
  createImageFileName,
  MAX_IMAGE_SIZE_LABEL,
  validateImageFile,
} from '@/lib/uploads'
import { useAdminAccess } from '@/admin/hooks/useAdminAccess'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  UserRound,
  Eye,
  EyeOff,
  Save,
  ExternalLink,
  ImageOff,
  RefreshCw,
  UsersRound,
} from 'lucide-react'

type Team = {
  id: number
  name: string
  category: string | null
  season: string | null
  active: boolean
}

type Player = {
  id: number
  created_at: string
  team_id: number | null
  first_name: string
  last_name: string
  position: string | null
  shirt_number: number | null
  photo_url: string | null
  bio: string | null
  season: string | null
  display_order: number
  active: boolean
  teams?: {
    id: number
    name: string
    category: string | null
  } | null
}

function singleRelation<T>(
  relation: T | T[] | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

const positions = [
  'Gardien',
  'Défenseur',
  'Milieu',
  'Attaquant',
]

export default function Players() {
  const { can } = useAdminAccess()
  const canCreate = can('players', 'create')
  const canUpdate = can('players', 'update')
  const canDelete = can('players', 'delete')

  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  const [teamId, setTeamId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState('')
  const [shirtNumber, setShirtNumber] = useState('')
  const [season, setSeason] = useState('2026/2027')
  const [bio, setBio] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')

  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')

  const [message, setMessage] = useState('')
  const [photoValidationError, setPhotoValidationError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    try {
      const [playersResult, teamsResult] = await Promise.all([
        supabase
          .from('players')
          .select(`
            id,
            created_at,
            team_id,
            first_name,
            last_name,
            position,
            shirt_number,
            photo_url,
            bio,
            season,
            display_order,
            active,
            teams (
              id,
              name,
              category
            )
          `)
          .order('display_order', { ascending: true })
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true }),

        supabase
          .from('teams')
          .select('id, name, category, season, active')
          .order('name', { ascending: true }),
      ])

      const errors: string[] = []

      if (playersResult.error) {
        console.error(playersResult.error)
        errors.push('les joueurs')
      } else {
        setPlayers(
          (playersResult.data || []).map((player) => ({
            ...player,
            teams: singleRelation(player.teams),
          })),
        )
      }

      if (teamsResult.error) {
        console.error(teamsResult.error)
        errors.push('les équipes')
      } else {
        setTeams((teamsResult.data || []) as Team[])
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
        'Impossible de récupérer les joueurs et les équipes. Vous pouvez réessayer.',
      )
      return false
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTeamId('')
    setFirstName('')
    setLastName('')
    setPosition('')
    setShirtNumber('')
    setSeason('2026/2027')
    setBio('')
    setDisplayOrder('0')
    setPhoto(null)
    setPreview('')
    setEditingId(null)
    setShowForm(false)
  }

  const openNewForm = () => {
    if (!canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer un joueur.")
      return
    }

    resetForm()
    setMessage('')
    setPhotoValidationError('')
    setShowForm(true)
  }

  const editPlayer = (player: Player) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un joueur.")
      return
    }

    setEditingId(player.id)
    setTeamId(player.team_id?.toString() || '')
    setFirstName(player.first_name)
    setLastName(player.last_name)
    setPosition(player.position || '')
    setShirtNumber(
      player.shirt_number !== null
        ? player.shirt_number.toString()
        : '',
    )
    setSeason(player.season || '2026/2027')
    setBio(player.bio || '')
    setDisplayOrder(player.display_order?.toString() || '0')
    setPhoto(null)
    setPreview(player.photo_url || '')
    setMessage('')
    setPhotoValidationError('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const savePlayer = async () => {
    if (editingId && !canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un joueur.")
      return
    }

    if (!editingId && !canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer un joueur.")
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      setMessage('Le prénom et le nom sont obligatoires.')
      return
    }

    if (!teamId) {
      setMessage('Sélectionnez une équipe.')
      return
    }

    if (
      shirtNumber !== '' &&
      (!Number.isInteger(Number(shirtNumber)) ||
        Number(shirtNumber) < 0 ||
        Number(shirtNumber) > 99)
    ) {
      setMessage('Le numéro de maillot doit être compris entre 0 et 99.')
      return
    }

    if (
      displayOrder !== '' &&
      (!Number.isInteger(Number(displayOrder)) ||
        Number(displayOrder) < 0)
    ) {
      setMessage("L'ordre d'affichage doit être un nombre entier positif.")
      return
    }

    setSaving(true)
    setMessage('')

    const previousPhotoUrl = editingId
      ? players.find((player) => player.id === editingId)?.photo_url || null
      : null

    let photoUrl = ''

    if (photo) {
      const photoError = validateImageFile(photo)

      if (photoError) {
        setPhotoValidationError(photoError)
        setSaving(false)
        return
      }

      const fileName = createImageFileName(photo)

      const { error: uploadError } = await supabase.storage
        .from('player-images')
        .upload(fileName, photo)

      if (uploadError) {
        console.error(uploadError)
        setMessage("Erreur lors de l'envoi de la photo.")
        setSaving(false)
        return
      }

      const { data } = supabase.storage
        .from('player-images')
        .getPublicUrl(fileName)

      photoUrl = data.publicUrl
    }

    const payload = {
      team_id: Number(teamId),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      position: position || null,
      shirt_number:
        shirtNumber === ''
          ? null
          : Number(shirtNumber),
      season: season || null,
      bio: bio || null,
      display_order: Number(displayOrder) || 0,
      ...(photoUrl && {
        photo_url: photoUrl,
      }),
    }

    const result = editingId
      ? await supabase
          .from('players')
          .update(payload)
          .eq('id', editingId)
      : await supabase
          .from('players')
          .insert([
            {
              ...payload,
              active: true,
            },
          ])

    if (result.error) {
      console.error(result.error)

      if (photoUrl) {
        await removeStorageFile(
          'player-images',
          photoUrl,
        )
      }

      setMessage("Erreur lors de l'enregistrement du joueur.")
      setSaving(false)
      return
    }

    if (photoUrl && previousPhotoUrl) {
      await removeStorageFile(
        'player-images',
        previousPhotoUrl,
      )
    }

    const wasEditing = Boolean(editingId)

    resetForm()

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage(
        wasEditing
          ? 'Joueur modifié avec succès.'
          : 'Joueur ajouté avec succès.',
      )
    }

    setSaving(false)
  }

  const removePlayerPhoto = async (player: Player) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un joueur.")
      return
    }

    if (!player.photo_url) return

    const confirmed = window.confirm(
      `Retirer la photo de ${player.first_name} ${player.last_name} ?`,
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('players')
      .update({
        photo_url: null,
      })
      .eq('id', player.id)

    if (error) {
      console.error(error)
      setMessage('Impossible de retirer la photo du joueur.')
      return
    }

    await removeStorageFile(
      'player-images',
      player.photo_url,
    )

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage('Photo du joueur retirée.')
    }
  }

  const togglePlayer = async (player: Player) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un joueur.")
      return
    }

    const { error } = await supabase
      .from('players')
      .update({
        active: !player.active,
      })
      .eq('id', player.id)

    if (error) {
      console.error(error)
      setMessage("Impossible de modifier l'état du joueur.")
      return
    }

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage(
        player.active
          ? 'Joueur désactivé.'
          : 'Joueur activé.',
      )
    }
  }

  const deletePlayer = async (player: Player) => {
    if (!canDelete) {
      setMessage("Vous n'avez pas l'autorisation de supprimer un joueur.")
      return
    }

    const confirmed = window.confirm(
      `Supprimer définitivement ${player.first_name} ${player.last_name} ?`,
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', player.id)

    if (error) {
      console.error(error)
      setMessage('Erreur lors de la suppression du joueur.')
      return
    }

    if (player.photo_url) {
      await removeStorageFile(
        'player-images',
        player.photo_url,
      )
    }

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage('Joueur supprimé.')
    }
  }

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return players.filter((player) => {
      const matchesTeam =
        teamFilter === 'all' ||
        player.team_id?.toString() === teamFilter

      const matchesSearch =
        !query ||
        player.first_name.toLowerCase().includes(query) ||
        player.last_name.toLowerCase().includes(query) ||
        player.position?.toLowerCase().includes(query) ||
        player.teams?.name.toLowerCase().includes(query)

      return matchesTeam && matchesSearch
    })
  }, [players, search, teamFilter])

  const activePlayersCount = players.filter(
    (player) => player.active,
  ).length

  const hiddenPlayersCount =
    players.length - activePlayersCount

  const teamsWithPlayersCount = new Set(
    players
      .map((player) => player.team_id)
      .filter((team): team is number => team !== null),
  ).size

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion sportive
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Joueurs
          </h1>

          <p className="mt-2 text-slate-400">
            Gérez les effectifs, leur équipe et leur visibilité sur le site public.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          <a
            href="/equipes"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition"
          >
            <ExternalLink size={17} />
            Voir les équipes
          </a>

          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
            Actualiser
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={openNewForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition"
            >
              <Plus size={19} />
              Nouveau joueur
            </button>
          )}

        </div>

      </div>

      {/* INDICATEURS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <UserRound size={20} className="text-[var(--club-yellow)]" />
            <span className="text-sm text-slate-400">Effectif total</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{players.length}</p>
          <p className="mt-1 text-xs text-slate-500">joueurs enregistrés</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Eye size={20} className="text-green-400" />
            <span className="text-sm text-slate-400">Visibles</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{activePlayersCount}</p>
          <p className="mt-1 text-xs text-slate-500">affichés publiquement</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <EyeOff size={20} className="text-slate-400" />
            <span className="text-sm text-slate-400">Masqués</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{hiddenPlayersCount}</p>
          <p className="mt-1 text-xs text-slate-500">non visibles publiquement</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <UsersRound size={20} className="text-blue-400" />
            <span className="text-sm text-slate-400">Équipes</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{teamsWithPlayersCount}</p>
          <p className="mt-1 text-xs text-slate-500">avec au moins un joueur</p>
        </div>

      </div>

      {/* MESSAGE */}
      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {!loading &&
        message.startsWith('Impossible de récupérer') && (
          <button
            type="button"
            onClick={() => fetchData()}
            className="mb-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition"
          >
            Réessayer le chargement
          </button>
        )}

      {/* FORMULAIRE */}
      {showForm && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                {editingId
                  ? 'Modifier le joueur'
                  : 'Ajouter un joueur'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Le joueur pourra ensuite être affiché automatiquement sur le site public.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X size={18} />
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Équipe
              </label>

              <select
                value={teamId}
                onChange={(e) => {
                  const value = e.target.value
                  setTeamId(value)

                  const selectedTeam = teams.find(
                    (team) => team.id.toString() === value,
                  )

                  if (
                    selectedTeam?.season &&
                    !editingId
                  ) {
                    setSeason(selectedTeam.season)
                  }
                }}
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
                    {!team.active
                      ? ' · masquée'
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Saison
              </label>

              <input
                type="text"
                value={season}
                onChange={(e) =>
                  setSeason(e.target.value)
                }
                placeholder="2026/2027"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Prénom
              </label>

              <input
                type="text"
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                placeholder="Prénom"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                placeholder="Nom"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Poste
              </label>

              <select
                value={position}
                onChange={(e) =>
                  setPosition(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              >
                <option value="">
                  Non renseigné
                </option>

                {positions.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Numéro de maillot
              </label>

              <input
                type="number"
                min="0"
                max="99"
                value={shirtNumber}
                onChange={(e) =>
                  setShirtNumber(e.target.value)
                }
                placeholder="Ex : 10"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Ordre d'affichage
              </label>

              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) =>
                  setDisplayOrder(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Photo
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]

                  if (!file) return

                  const photoError = validateImageFile(file)

                  if (photoError) {
                    setPhoto(null)
                    setPreview('')
                    setPhotoValidationError(photoError)
                    e.currentTarget.value = ''
                    return
                  }

                  setPhotoValidationError('')
                  setPhoto(file)
                  setPreview(URL.createObjectURL(file))
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              />
                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG ou WebP — {MAX_IMAGE_SIZE_LABEL} maximum.
                </p>

                {photoValidationError && (
                  <div
                    role="alert"
                    className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300"
                  >
                    {photoValidationError}
                  </div>
                )}
            </div>

            {preview && (
              <div className="md:col-span-2">
                <div className="w-40 h-48 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <img
                    src={preview}
                    alt="Aperçu du joueur"
                    className="w-full h-full object-cover"
                  />
                </div>

                {editingId && !photo && (
                  <p className="mt-2 text-xs text-slate-500">
                    Photo actuelle. Choisissez un nouveau fichier pour la remplacer.
                  </p>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Présentation
              </label>

              <textarea
                rows={4}
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                placeholder="Courte présentation du joueur..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30 resize-none"
              />
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">

            <button
              type="button"
              onClick={savePlayer}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold disabled:opacity-50"
            >
              <Save size={18} />

              {saving
                ? 'Enregistrement...'
                : editingId
                  ? 'Mettre à jour'
                  : 'Ajouter le joueur'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="px-6 rounded-xl bg-white/5 hover:bg-white/10 py-3.5 font-semibold"
            >
              Annuler
            </button>

          </div>

        </section>
      )}

      {/* LISTE */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>
            <h2 className="font-semibold">
              Effectifs enregistrés
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {filteredPlayers.length} joueur
              {filteredPlayers.length > 1 ? 's' : ''}
              {(search.trim() || teamFilter !== 'all') &&
                ` sur ${players.length}`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

            <select
              value={teamFilter}
              onChange={(e) =>
                setTeamFilter(e.target.value)
              }
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="all">
                Toutes les équipes
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-white/30"
              />
            </div>

          </div>

        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Chargement des joueurs...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="p-12 text-center">

            <UserRound
              size={38}
              className="mx-auto text-slate-600 mb-3"
            />

            <p className="text-slate-500">
              Aucun joueur trouvé.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-white/5">

            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className={`p-5 flex flex-col lg:flex-row lg:items-center gap-5 hover:bg-white/[0.02] transition ${
                  !player.active
                    ? 'opacity-50'
                    : ''
                }`}
              >

                <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">

                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={`${player.first_name} ${player.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound
                      size={28}
                      className="text-slate-600"
                    />
                  )}

                </div>

                <div className="flex-1 min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    {player.shirt_number !== null && (
                      <span className="w-8 h-8 rounded-lg bg-[var(--club-yellow)] text-slate-950 flex items-center justify-center font-black text-sm">
                        {player.shirt_number}
                      </span>
                    )}

                    <h3 className="font-bold text-lg">
                      {player.first_name}{' '}
                      {player.last_name}
                    </h3>

                    {!player.active && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                        Masqué
                      </span>
                    )}

                  </div>

                  <p className="text-sm text-slate-400 mt-1">
                    {[
                      player.teams?.name,
                      player.position,
                      player.season,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  {player.bio && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {player.bio}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 mt-2">
                    Position d'affichage :{' '}
                    {player.display_order}
                  </p>

                </div>

                <div className="flex flex-wrap gap-2 shrink-0">

                  {player.teams?.id && player.active && (
                    <a
                      href={`/equipes/${player.teams.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                    >
                      <ExternalLink size={15} />
                      Voir équipe
                    </a>
                  )}

                  {canUpdate && player.photo_url && (
                    <button
                      type="button"
                      onClick={() => void removePlayerPhoto(player)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                    >
                      <ImageOff size={15} />
                      Retirer photo
                    </button>
                  )}

                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => void togglePlayer(player)}
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                      title={player.active ? 'Masquer' : 'Afficher'}
                      aria-label={player.active ? 'Masquer le joueur' : 'Afficher le joueur'}
                    >
                      {player.active ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  )}

                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => editPlayer(player)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                    >
                      <Pencil size={16} />
                      Modifier
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => void deletePlayer(player)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  )
}
