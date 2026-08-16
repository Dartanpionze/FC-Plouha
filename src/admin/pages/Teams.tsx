import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Shield,
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
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage('Impossible de récupérer les équipes.')
      return
    }

    setTeams(data || [])
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
    setShowForm(false)
  }

  const openNewForm = () => {
    resetForm()
    setShowForm(true)
  }

  const editTeam = (team: Team) => {
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
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const saveTeam = async () => {
    if (!name.trim()) {
      setMessage("Le nom de l'équipe est obligatoire.")
      return
    }

    setLoading(true)
    setMessage('')

    let imageUrl = ''

    if (image) {
      const fileName = `${Date.now()}-${image.name}`

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
      setMessage("Erreur lors de l'enregistrement.")
      setLoading(false)
      return
    }

    await fetchTeams()

    resetForm()

    setMessage(
      editingId
        ? 'Équipe modifiée avec succès.'
        : 'Équipe créée avec succès.',
    )

    setLoading(false)
  }

  const deleteTeam = async (id: number) => {
    const confirmDelete = window.confirm(
      'Supprimer définitivement cette équipe ?',
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      setMessage('Erreur lors de la suppression.')
      return
    }

    setMessage('Équipe supprimée.')
    fetchTeams()
  }

  const toggleActive = async (team: Team) => {
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

    fetchTeams()
  }

  const filteredTeams = teams.filter((team) => {
    const query = search.toLowerCase()

    return (
      team.name.toLowerCase().includes(query) ||
      team.category?.toLowerCase().includes(query) ||
      team.coach?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion du club
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Équipes
          </h1>

          <p className="mt-2 text-slate-400">
            Gérez les équipes du FC Plouha.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition"
        >
          <Plus size={19} />
          Nouvelle équipe
        </button>

      </div>

      {/* MESSAGE */}
      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {/* FORMULAIRE */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

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

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                >
                  <option value="">Sélectionner</option>
                  <option value="Seniors">Seniors</option>
                  <option value="U18">U18</option>
                  <option value="U17">U17</option>
                  <option value="U16">U16</option>
                  <option value="U15">U15</option>
                  <option value="U14">U14</option>
                  <option value="U13">U13</option>
                  <option value="U12">U12</option>
                  <option value="U11">U11</option>
                  <option value="U10">U10</option>
                  <option value="U9">U9</option>
                  <option value="U8">U8</option>
                  <option value="U7">U7</option>
                  <option value="U6">U6</option>
                </select>
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
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]

                    if (file) {
                      setImage(file)
                      setPreview(URL.createObjectURL(file))
                    }
                  }}
                />

              </label>

              {preview && (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="mt-4 w-full max-h-72 object-cover rounded-xl border border-white/10"
                />
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

        <div className="p-5 border-b border-white/10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

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

                <button
                  onClick={() => toggleActive(team)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                >
                  {team.active ? 'Masquer' : 'Afficher'}
                </button>

                <button
                  onClick={() => editTeam(team)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                >
                  <Pencil size={16} />
                  Modifier
                </button>

                <button
                  onClick={() => deleteTeam(team.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>

              </div>

            </div>

          ))}

        </div>
      </div>
    </div>
  )
}
