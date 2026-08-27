import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { removeStorageFile } from '@/lib/storage'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  GripVertical,
} from 'lucide-react'

type Partner = {
  id: number
  created_at: string
  name: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  type: string
  display_order: number
  active: boolean
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [type, setType] = useState('partner')
  const [displayOrder, setDisplayOrder] = useState('0')

  const [logo, setLogo] = useState<File | null>(null)
  const [preview, setPreview] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error(error)
      setMessage(
        'Impossible de récupérer les partenaires.',
      )
      return
    }

    setPartners(data || [])
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setWebsiteUrl('')
    setType('partner')
    setDisplayOrder('0')

    setLogo(null)
    setPreview('')

    setEditingId(null)
    setShowForm(false)
  }

  const openNewForm = () => {
    resetForm()
    setShowForm(true)
    setMessage('')
  }

  const editPartner = (partner: Partner) => {
    setEditingId(partner.id)

    setName(partner.name)
    setDescription(partner.description || '')
    setWebsiteUrl(partner.website_url || '')
    setType(partner.type || 'partner')
    setDisplayOrder(
      partner.display_order?.toString() || '0',
    )

    setLogo(null)
    setPreview(partner.logo_url || '')

    setShowForm(true)
    setMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const savePartner = async () => {
    if (!name.trim()) {
      setMessage('Le nom du partenaire est obligatoire.')
      return
    }

    setLoading(true)
    setMessage('')

    const previousLogoUrl = editingId
      ? partners.find((partner) => partner.id === editingId)?.logo_url || null
      : null

    let logoUrl = ''

    if (logo) {
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}-${logo.name}`

      const { error: uploadError } = await supabase.storage
        .from('partner-logos')
        .upload(fileName, logo)

      if (uploadError) {
        console.error(uploadError)
        setMessage("Erreur lors de l'envoi du logo.")
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('partner-logos')
        .getPublicUrl(fileName)

      logoUrl = data.publicUrl
    }

    const payload = {
      name,
      description: description || null,
      website_url: websiteUrl || null,
      type,
      display_order: Number(displayOrder) || 0,
      ...(logoUrl && {
        logo_url: logoUrl,
      }),
    }

    let error

    if (editingId) {
      const result = await supabase
        .from('partners')
        .update(payload)
        .eq('id', editingId)

      error = result.error
    } else {
      const result = await supabase
        .from('partners')
        .insert([
          {
            ...payload,
            active: true,
          },
        ])

      error = result.error
    }

    if (error) {
      console.error(error)

      if (logoUrl) {
        await removeStorageFile(
          'partner-logos',
          logoUrl,
        )
      }

      setMessage(
        "Erreur lors de l'enregistrement du partenaire.",
      )
      setLoading(false)
      return
    }

    if (logoUrl && previousLogoUrl) {
      await removeStorageFile(
        'partner-logos',
        previousLogoUrl,
      )
    }

    const wasEditing = Boolean(editingId)

    await fetchPartners()

    resetForm()

    setMessage(
      wasEditing
        ? 'Partenaire modifié avec succès.'
        : 'Partenaire ajouté avec succès.',
    )

    setLoading(false)
  }

  const togglePartner = async (partner: Partner) => {
    const { error } = await supabase
      .from('partners')
      .update({
        active: !partner.active,
      })
      .eq('id', partner.id)

    if (error) {
      console.error(error)
      setMessage(
        "Impossible de modifier l'état du partenaire.",
      )
      return
    }

    fetchPartners()
  }

  const deletePartner = async (partner: Partner) => {
    const confirmDelete = window.confirm(
      `Supprimer définitivement "${partner.name}" ?`,
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', partner.id)

    if (error) {
      console.error(error)
      setMessage(
        'Erreur lors de la suppression.',
      )
      return
    }

    if (partner.logo_url) {
      await removeStorageFile(
        'partner-logos',
        partner.logo_url,
      )
    }

    setMessage('Partenaire supprimé.')
    fetchPartners()
  }

  const getTypeLabel = (value: string) => {
    switch (value) {
      case 'sponsor':
        return 'Sponsor'
      case 'equipment':
        return 'Équipementier'
      default:
        return 'Partenaire'
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion du club
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Partenaires
          </h1>

          <p className="mt-2 text-slate-400">
            Gérez les partenaires et sponsors du FC Plouha.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition"
        >
          <Plus size={19} />
          Ajouter un partenaire
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
                  ? 'Modifier le partenaire'
                  : 'Ajouter un partenaire'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Les informations seront visibles sur le site public.
              </p>
            </div>

            <button
              onClick={resetForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X size={18} />
            </button>

          </div>

          <div className="space-y-6">

            {/* NOM / TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nom
                </label>

                <input
                  type="text"
                  placeholder="Ex : Entreprise Dupont"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Type
                </label>

                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                >
                  <option value="partner">
                    Partenaire
                  </option>

                  <option value="sponsor">
                    Sponsor
                  </option>

                  <option value="equipment">
                    Équipementier
                  </option>
                </select>
              </div>

            </div>

            {/* DESCRIPTION */}
            <div>

              <label className="block text-sm font-semibold mb-2">
                Description
              </label>

              <textarea
                rows={3}
                placeholder="Quelques mots sur le partenaire..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none resize-none"
              />

            </div>

            {/* SITE / ORDRE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Site internet
                </label>

                <input
                  type="url"
                  placeholder="https://..."
                  value={websiteUrl}
                  onChange={(e) =>
                    setWebsiteUrl(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
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

            </div>

            {/* LOGO */}
            <div>

              <label className="block text-sm font-semibold mb-2">
                Logo
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {

                  const file =
                    e.target.files?.[0]

                  if (!file) return

                  setLogo(file)
                  setPreview(
                    URL.createObjectURL(file),
                  )
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              />

              {preview && (
                <div className="mt-4 w-full h-48 rounded-xl bg-white flex items-center justify-center p-6">

                  <img
                    src={preview}
                    alt="Aperçu du logo"
                    className="max-h-full max-w-full object-contain"
                  />

                </div>
              )}

            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">

              <button
                onClick={savePartner}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading
                  ? 'Enregistrement...'
                  : editingId
                    ? 'Mettre à jour'
                    : 'Ajouter le partenaire'}
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

        <div className="p-5 border-b border-white/10">

          <h2 className="font-semibold">
            Partenaires enregistrés
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {partners.length} partenaire
            {partners.length > 1 ? 's' : ''}
          </p>

        </div>

        {partners.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Aucun partenaire enregistré.
          </div>
        ) : (
          <div className="divide-y divide-white/5">

            {partners.map((partner) => (

              <div
                key={partner.id}
                className={`p-5 transition hover:bg-white/[0.02] ${
                  !partner.active
                    ? 'opacity-50'
                    : ''
                }`}
              >

                <div className="flex flex-col md:flex-row md:items-center gap-5">

                  {/* DRAG / ORDRE */}
                  <div className="hidden md:flex text-slate-600">
                    <GripVertical size={20} />
                  </div>

                  {/* LOGO */}
                  <div className="w-24 h-24 shrink-0 rounded-xl bg-white flex items-center justify-center p-3">

                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 text-center">
                        Aucun logo
                      </span>
                    )}

                  </div>

                  {/* INFOS */}
                  <div className="flex-1 min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-bold text-lg">
                        {partner.name}
                      </h3>

                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400">
                        {getTypeLabel(
                          partner.type,
                        )}
                      </span>

                      {!partner.active && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                          Masqué
                        </span>
                      )}

                    </div>

                    {partner.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {partner.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">

                      <span>
                        Position :{' '}
                        {partner.display_order}
                      </span>

                      {partner.website_url && (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition"
                        >
                          Site internet
                          <ExternalLink
                            size={13}
                          />
                        </a>
                      )}

                    </div>

                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 shrink-0">

                    <button
                      onClick={() =>
                        togglePartner(
                          partner,
                        )
                      }
                      title={
                        partner.active
                          ? 'Masquer'
                          : 'Afficher'
                      }
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                    >
                      {partner.active ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        editPartner(
                          partner,
                        )
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                    >
                      <Pencil size={16} />
                      Modifier
                    </button>

                    <button
                      onClick={() =>
                        deletePartner(
                          partner,
                        )
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  )
}
