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
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  RefreshCw,
  ImageOff,
  ArrowUp,
  ArrowDown,
  Handshake,
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
  const { can } = useAdminAccess()
  const canCreate = can('partners', 'create')
  const canUpdate = can('partners', 'update')
  const canDelete = can('partners', 'delete')

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
  const [logoValidationError, setLogoValidationError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setFetching(true)

    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error(error)
        setMessage(
          'Impossible de récupérer les partenaires. Vous pouvez réessayer.',
        )
        return false
      }

      setPartners(data || [])
      return true
    } catch (fetchError) {
      console.error(fetchError)
      setMessage(
        'Impossible de récupérer les partenaires. Vous pouvez réessayer.',
      )
      return false
    } finally {
      setFetching(false)
    }
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
    if (!canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer un partenaire.")
      return
    }

    resetForm()
    setShowForm(true)
    setMessage('')
  }

  const editPartner = (partner: Partner) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un partenaire.")
      return
    }

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
    if (editingId && !canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un partenaire.")
      return
    }

    if (!editingId && !canCreate) {
      setMessage("Vous n'avez pas l'autorisation de créer un partenaire.")
      return
    }

    if (!name.trim()) {
      setMessage('Le nom du partenaire est obligatoire.')
      return
    }

    if (
      displayOrder !== '' &&
      (!Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0)
    ) {
      setMessage("L'ordre d'affichage doit être un nombre entier positif.")
      return
    }

    if (websiteUrl.trim()) {
      try {
        const parsedUrl = new URL(websiteUrl.trim())
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('unsupported protocol')
        }
      } catch {
        setMessage("L'adresse du site internet doit être une URL complète valide.")
        return
      }
    }

    setLoading(true)
    setMessage('')

    const previousLogoUrl = editingId
      ? partners.find((partner) => partner.id === editingId)?.logo_url || null
      : null

    let logoUrl = ''

    if (logo) {
      const logoError = validateImageFile(logo)

      if (logoError) {
        setLogoValidationError(logoError)
        setLoading(false)
        return
      }

      const fileName = createImageFileName(logo)

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
      name: name.trim(),
      description: description.trim() || null,
      website_url: websiteUrl.trim() || null,
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

    resetForm()

    const refreshed = await fetchPartners()

    if (refreshed) {
      setMessage(
        wasEditing
          ? 'Partenaire modifié avec succès.'
          : 'Partenaire ajouté avec succès.',
      )
    }

    setLoading(false)
  }

  const removePartnerLogo = async (partner: Partner) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un partenaire.")
      return
    }

    if (!partner.logo_url) return

    const confirmed = window.confirm(`Retirer le logo de "${partner.name}" ?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('partners')
      .update({ logo_url: null })
      .eq('id', partner.id)

    if (error) {
      console.error(error)
      setMessage('Impossible de retirer le logo.')
      return
    }

    await removeStorageFile('partner-logos', partner.logo_url)
    const refreshed = await fetchPartners()
    if (refreshed) setMessage('Logo retiré.')
  }

  const movePartner = async (partner: Partner, direction: -1 | 1) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier les partenaires.")
      return
    }

    const currentIndex = partners.findIndex((item) => item.id === partner.id)
    const targetIndex = currentIndex + direction

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= partners.length) {
      return
    }

    const reordered = [...partners]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const results = await Promise.all(
      reordered.map((item, index) =>
        supabase
          .from('partners')
          .update({ display_order: index })
          .eq('id', item.id),
      ),
    )

    const failed = results.find((result) => result.error)
    if (failed?.error) {
      console.error(failed.error)
      setMessage("Impossible de modifier l'ordre des partenaires.")
      return
    }

    const refreshed = await fetchPartners()
    if (refreshed) setMessage('Ordre des partenaires mis à jour.')
  }

  const togglePartner = async (partner: Partner) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un partenaire.")
      return
    }

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

    const refreshed = await fetchPartners()

    if (refreshed) {
      setMessage(
        partner.active
          ? 'Partenaire masqué.'
          : 'Partenaire affiché.',
      )
    }
  }

  const deletePartner = async (partner: Partner) => {
    if (!canDelete) {
      setMessage("Vous n'avez pas l'autorisation de supprimer un partenaire.")
      return
    }

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

    const refreshed = await fetchPartners()

    if (refreshed) {
      setMessage('Partenaire supprimé.')
    }
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

  const activePartnersCount = partners.filter(
    (partner) => partner.active,
  ).length

  const principalPartnersCount = partners.filter(
    (partner) => partner.type === 'principal',
  ).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-slate-400 mb-1">Relations du club</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Partenaires</h1>
          <p className="mt-2 text-slate-400">
            Gérez les partenaires, leurs logos et leur ordre d'affichage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/partenaires"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition"
          >
            <ExternalLink size={17} />
            Voir la page publique
          </a>

          <button
            type="button"
            onClick={() => void fetchPartners()}
            disabled={fetching}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition"
          >
            <RefreshCw size={17} className={fetching ? 'animate-spin' : ''} />
            Actualiser
          </button>

          {canCreate && (
            <button
              onClick={openNewForm}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition"
            >
              <Plus size={19} />
              Nouveau partenaire
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Handshake size={19} className="text-[var(--club-yellow)]" /> Total
          </div>
          <p className="mt-3 text-3xl font-bold">{partners.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Eye size={19} className="text-green-400" /> Publiés
          </div>
          <p className="mt-3 text-3xl font-bold">{activePartnersCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ExternalLink size={19} className="text-blue-400" /> Principaux
          </div>
          <p className="mt-3 text-3xl font-bold">{principalPartnersCount}</p>
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
          Chargement des partenaires...
        </div>
      )}

      {!fetching &&
        message.startsWith('Impossible de récupérer') && (
          <button
            type="button"
            onClick={() => fetchPartners()}
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
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {

                  const file =
                    e.target.files?.[0]

                  if (!file) return

                  const logoError = validateImageFile(file)

                  if (logoError) {
                    setLogo(null)
                    setPreview('')
                    setLogoValidationError(logoError)
                    e.currentTarget.value = ''
                    return
                  }

                  setLogoValidationError('')
                  setLogo(file)
                  setPreview(URL.createObjectURL(file))
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG ou WebP — {MAX_IMAGE_SIZE_LABEL} maximum.
              </p>

              {logoValidationError && (
                <div role="alert" className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300">
                  {logoValidationError}
                </div>
              )}

              {preview && (
                <div className="mt-4">
                  <div className="w-full h-48 rounded-xl bg-white flex items-center justify-center p-6">
                    <img
                      src={preview}
                      alt="Aperçu du logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  {editingId && !logo && (
                    <p className="mt-2 text-xs text-slate-500">
                      Logo actuel. Choisissez un nouveau fichier pour le remplacer.
                    </p>
                  )}
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

                  {/* ORDRE */}
                  <div className="hidden md:flex w-9 h-9 shrink-0 rounded-lg bg-white/5 items-center justify-center text-xs font-bold text-slate-500">
                    {partner.display_order}
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
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {canUpdate && (
                      <>
                        <button
                          type="button"
                          onClick={() => void movePartner(partner, -1)}
                          disabled={partners[0]?.id === partner.id}
                          title="Monter"
                          className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void movePartner(partner, 1)}
                          disabled={partners[partners.length - 1]?.id === partner.id}
                          title="Descendre"
                          className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </>
                    )}

                    {canUpdate && partner.logo_url && (
                      <button
                        type="button"
                        onClick={() => void removePartnerLogo(partner)}
                        title="Retirer le logo"
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                      >
                        <ImageOff size={16} />
                      </button>
                    )}

                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => void togglePartner(partner)}
                        title={partner.active ? 'Masquer' : 'Afficher'}
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                      >
                        {partner.active ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    )}

                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => editPartner(partner)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                      >
                        <Pencil size={16} />
                        Modifier
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void deletePartner(partner)}
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
        )}

      </div>

    </div>
  )
}
