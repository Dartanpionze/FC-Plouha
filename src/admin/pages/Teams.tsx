import { useEffect, useState } from 'react'
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
  Shield,
  ExternalLink,
  ImageOff,
  RefreshCw,
  UsersRound,
  EyeOff,
} from 'lucide-react'

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

export default function Teams() {
  const { can } = useAdminAccess()
  const canCreate = can('teams', 'create')
  const canUpdate = can('teams', 'update')
  const canDelete = can('teams', 'delete')

  const [teams, setTeams] = useState<Team[]>([])

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [season, setSeason] = useState('2026/2027')
  const [coach, setCoach] = useState('')
  const [assistantCoach, setAssistantCoach] = useState('')
  const [description, setDescription] = useState('')

  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [imageValidationError, setImageValidationError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setFetching(true)

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setMessage(
          'Impossible de récupérer les équipes. Vous pouvez réessayer.',
        )
        return false
      }

      setTeams(data || [])
      return true
    } catch (fetchError) {
      console.error(fetchError)
      setMessage(
        'Impossible de récupérer les équipes. Vous pouvez réessayer.',
      )
      return false
    } finally {
      setFetching(false)
    }
  }

  const resetForm = () => {
    setName('')
    setCategory('')
    setSeason('2026/2027')
    setCoach('')
    setAssistantCoach('')
    setDescription('')

    setImage(null)
    setPreview('')

    setEditingId(null)
    setMessage('')
    setImageValidationError('')
    setShowForm(false)
  }

  const openNewForm = () => {
    if (!canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer une équipe.")
      return
    }

    resetForm()
    setShowForm(true)
  }

  const editTeam = (team: Team) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier une équipe.")
      return
    }

    setEditingId(team.id)

    setName(team.name)
    setCategory(team.category || '')
    setSeason(team.season || '')
    setCoach(team.coach || '')
    setAssistantCoach(team.assistant_coach || '')
    setDescription(team.description || '')

    setPreview(team.image_url || '')
    setImage(null)

    setMessage('')
    setImageValidationError('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const saveTeam = async () => {
    if (editingId && !canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier une équipe.")
      return
    }

    if (!editingId && !canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer une équipe.")
      return
    }

    if (!name.trim()) {
      setMessage("Le nom de l'équipe est obligatoire.")
      return
    }

    setLoading(true)
    setMessage('')

    const previousImageUrl = editingId
      ? teams.find((team) => team.id === editingId)?.image_url || null
      : null

    let imageUrl = ''

    if (image) {
      const imageError = validateImageFile(image)

      if (imageError) {
        setImageValidationError(imageError)
        setLoading(false)
        return
      }

      const fileName = createImageFileName(image)

      const { error: uploadError } = await supabase.storage
        .from('team-images')
        .upload(fileName, image)

      if (uploadError) {
        console.error(uploadError)
        setMessage("Erreur lors de l'envoi de l'image.")
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('team-images')
        .getPublicUrl(fileName)

      imageUrl = data.publicUrl
    }

    let error

    if (editingId) {
      const result = await supabase
        .from('teams')
        .update({
          name,
          category,
          season,
          coach,
          assistant_coach: assistantCoach,
          description,
          ...(imageUrl && { image_url: imageUrl }),
        })
        .eq('id', editingId)

      error = result.error
    } else {
      const result = await supabase
        .from('teams')
        .insert([
          {
            name,
            category,
            season,
            coach,
            assistant_coach: assistantCoach,
            description,
            image_url: imageUrl,
            active: true,
          },
        ])

      error = result.error
    }

    if (error) {
      console.error(error)

      if (imageUrl) {
        await removeStorageFile(
          'team-images',
          imageUrl,
        )
      }

      setMessage("Erreur lors de l'enregistrement.")
      setLoading(false)
      return
    }

    if (imageUrl && previousImageUrl) {
      await removeStorageFile(
        'team-images',
        previousImageUrl,
      )
    }

    const wasEditing = Boolean(editingId)

    resetForm()

    const refreshed = await fetchTeams()

    if (refreshed) {
      setMessage(
        wasEditing
          ? 'Équipe modifiée avec succès.'
          : 'Équipe créée avec succès.',
      )
    }

    setLoading(false)
  }

  const deleteTeam = async (id: number) => {
    if (!canDelete) {
      setMessage("Vous n'avez pas l'autorisation de supprimer une équipe.")
      return
    }

    const confirmDelete = window.confirm(
      'Supprimer définitivement cette équipe ?',
    )

    if (!confirmDelete) return

    const team = teams.find(
      (item) => item.id === id,
    )

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      setMessage('Erreur lors de la suppression.')
      return
    }

    if (team?.image_url) {
      await removeStorageFile(
        'team-images',
        team.image_url,
      )
    }

    const refreshed = await fetchTeams()

    if (refreshed) {
      setMessage('Équipe supprimée.')
    }
  }

  const removeTeamImage = async (team: Team) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier une équipe.")
      return
    }

    if (!team.image_url) return

    const confirmRemove = window.confirm(
      `Retirer la photo de l'équipe "${team.name}" ?`,
    )

    if (!confirmRemove) return

    const { error } = await supabase
      .from('teams')
      .update({ image_url: null })
      .eq('id', team.id)

    if (error) {
      console.error(error)
      setMessage("Impossible de retirer la photo de l'équipe.")
      return
    }

    await removeStorageFile('team-images', team.image_url)

    const refreshed = await fetchTeams()

    if (refreshed) {
      setMessage("Photo de l'équipe retirée.")
    }
  }

  const toggleActive = async (team: Team) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier une équipe.")
      return
    }

    const { error } = await supabase
      .from('teams')
      .update({
        active: !team.active,
      })
      .eq('id', team.id)

    if (error) {
      console.error(error)
      setMessage("Impossible de modifier l'état de l'équipe.")
      return
    }

    const refreshed = await fetchTeams()

    if (refreshed) {
      setMessage(
        team.active
          ? 'Équipe désactivée.'
          : 'Équipe activée.',
      )
    }
  }

  const filteredTeams = teams.filter((team) => {
    const query = search.toLowerCase()

    return (
      team.name.toLowerCase().includes(query) ||
      team.category?.toLowerCase().includes(query) ||
      team.coach?.toLowerCase().includes(query)
    )
  })

  const activeTeamsCount = teams.filter(
    (team) => team.active,
  ).length

  const hiddenTeamsCount =
    teams.length - activeTeamsCount

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion sportive
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Équipes
          </h1>

          <p className="mt-2 text-slate-400">
            Gérez les équipes et contrôlez leur affichage sur le site public.
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
            Voir la page publique
          </a>

          <button
            type="button"
            onClick={() => void fetchTeams()}
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
              Nouvelle équipe
            </button>
          )}

        </div>
      </div>

      {/* INDICATEURS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <UsersRound size={20} className="text-[var(--club-yellow)]" />
            <span className="text-sm text-slate-400">Total</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{teams.length}</p>
          <p className="mt-1 text-xs text-slate-500">équipes enregistrées</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-green-400" />
            <span className="text-sm text-slate-400">Publiées</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{activeTeamsCount}</p>
          <p className="mt-1 text-xs text-slate-500">visibles sur le site</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <EyeOff size={20} className="text-slate-400" />
            <span className="text-sm text-slate-400">Masquées</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{hiddenTeamsCount}</p>
          <p className="mt-1 text-xs text-slate-500">non visibles publiquement</p>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {fetching && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
          Chargement des équipes...
        </div>
      )}

      {!fetching &&
        message.startsWith('Impossible de récupérer') && (
          <button
            type="button"
            onClick={() => fetchTeams()}
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
                  ? "Modifier l'équipe"
                  : 'Nouvelle équipe'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Les informations seront utilisées sur le site public.
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

            {/* NOM + CATEGORIE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nom de l'équipe
                </label>

                <input
                  type="text"
                  placeholder="Ex : Seniors D4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Catégorie
                </label>

                <input
                  type="text"
                  list="team-categories"
                  placeholder="Ex : Seniors, U18, Féminines..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
                />

                <datalist id="team-categories">
                  <option value="Seniors" />
                  <option value="Féminines" />
                  <option value="Vétérans" />
                  <option value="U18" />
                  <option value="U17" />
                  <option value="U16" />
                  <option value="U15" />
                  <option value="U14" />
                  <option value="U13" />
                  <option value="U12" />
                  <option value="U11" />
                  <option value="U10" />
                  <option value="U9" />
                  <option value="U8" />
                  <option value="U7" />
                  <option value="U6" />
                </datalist>

                <p className="mt-2 text-xs text-slate-500">
                  Choisissez une suggestion ou saisissez librement une catégorie.
                </p>
              </div>

            </div>

            {/* SAISON */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Saison
              </label>

              <input
                type="text"
                placeholder="2026/2027"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
              />
            </div>

            {/* STAFF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Coach
                </label>

                <input
                  type="text"
                  placeholder="Nom du coach"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Entraîneur adjoint
                </label>

                <input
                  type="text"
                  placeholder="Nom de l'adjoint"
                  value={assistantCoach}
                  onChange={(e) => setAssistantCoach(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
                />
              </div>

            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>

              <textarea
                rows={5}
                placeholder="Présentation de l'équipe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30 resize-none"
              />
            </div>

            {/* IMAGE */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Photo de l'équipe
              </label>

              <label className="flex items-center justify-center cursor-pointer rounded-xl border border-dashed border-white/15 bg-slate-950 px-4 py-8 hover:bg-white/[0.03] transition">

                <div className="text-center">
                  <Shield
                    size={28}
                    className="mx-auto text-slate-500 mb-2"
                  />

                  <p className="text-sm text-slate-400">
                    Cliquez pour choisir une photo
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]

                    if (file) {
                      const imageError = validateImageFile(file)

                      if (imageError) {
                        setImage(null)
                        setPreview('')
                        setImageValidationError(imageError)
                        e.currentTarget.value = ''
                        return
                      }

                      setImageValidationError('')
                      setImage(file)
                      setPreview(URL.createObjectURL(file))
                    }
                  }}
                />

              </label>

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG ou WebP — {MAX_IMAGE_SIZE_LABEL} maximum.
              </p>

              {imageValidationError && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300"
                >
                  {imageValidationError}
                </div>
              )}

              {preview && (
                <div className="mt-4">
                  <img
                    src={preview}
                    alt="Aperçu de l'équipe"
                    className="w-full max-h-72 object-cover rounded-xl border border-white/10"
                  />
                  {editingId && !image && (
                    <p className="mt-2 text-xs text-slate-500">
                      Photo actuelle. Choisissez un nouveau fichier pour la remplacer.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">

              <button
                onClick={saveTeam}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading
                  ? 'Enregistrement...'
                  : editingId
                    ? "Mettre à jour l'équipe"
                    : "Créer l'équipe"}
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

        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold">
              Équipes enregistrées
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {teams.length} équipe{teams.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="relative w-full md:w-72">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-white/30"
            />

          </div>

        </div>

        <div className="divide-y divide-white/5">

          {filteredTeams.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              Aucune équipe trouvée.
            </div>
          )}

          {filteredTeams.map((team) => (

            <div
              key={team.id}
              className="p-5 flex flex-col md:flex-row md:items-center gap-5 hover:bg-white/[0.02] transition"
            >

              {/* IMAGE */}
              {team.image_url ? (
                <img
                  src={team.image_url}
                  alt=""
                  className="w-full md:w-28 h-24 object-cover rounded-xl shrink-0"
                />
              ) : (
                <div className="w-full md:w-28 h-24 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Shield
                    size={28}
                    className="text-slate-600"
                  />
                </div>
              )}

              {/* INFORMATIONS */}
              <div className="flex-1 min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="font-semibold">
                    {team.name}
                  </h3>

                  {team.active ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-500/10 text-slate-500">
                      Masquée
                    </span>
                  )}

                </div>

                <p className="text-sm text-slate-400 mt-1">
                  {team.category || 'Catégorie non renseignée'}
                  {team.season ? ` · ${team.season}` : ''}
                </p>

                {team.coach && (
                  <p className="text-sm text-slate-500 mt-2">
                    Coach : {team.coach}
                  </p>
                )}

              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-2 shrink-0">

                {team.active && (
                  <a
                    href={`/equipes/${team.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                  >
                    <ExternalLink size={15} />
                    Voir
                  </a>
                )}

                {canUpdate && team.image_url && (
                  <button
                    type="button"
                    onClick={() => void removeTeamImage(team)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                  >
                    <ImageOff size={15} />
                    Retirer photo
                  </button>
                )}

                {canUpdate && (
                  <button
                    onClick={() => void toggleActive(team)}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                  >
                    {team.active ? 'Masquer' : 'Afficher'}
                  </button>
                )}

                {canUpdate && (
                  <button
                    onClick={() => editTeam(team)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                  >
                    <Pencil size={16} />
                    Modifier
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={() => void deleteTeam(team.id)}
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
      </div>
    </div>
  )
}
