import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  X,
  History,
  Users,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Save,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  ImageOff,
} from 'lucide-react'

type HistoryItem = {
  id: number
  created_at: string
  year: number
  title: string
  description: string | null
  display_order: number
}

type StaffMember = {
  id: number
  created_at: string
  name: string
  role: string
  photo_url: string | null
  email: string | null
  phone: string | null
  display_order: number
  active: boolean
}

export default function Club() {
  const { can } = useAdminAccess()
  const canCreate = can('club', 'create')
  const canUpdate = can('club', 'update')
  const canDelete = can('club', 'delete')

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])

  const [historyYear, setHistoryYear] = useState('')
  const [historyTitle, setHistoryTitle] = useState('')
  const [historyDescription, setHistoryDescription] = useState('')
  const [historyOrder, setHistoryOrder] = useState('0')
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null)
  const [showHistoryForm, setShowHistoryForm] = useState(false)

  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState('')
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPhone, setStaffPhone] = useState('')
  const [staffOrder, setStaffOrder] = useState('0')
  const [staffImage, setStaffImage] = useState<File | null>(null)
  const [staffPreview, setStaffPreview] = useState('')
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null)
  const [showStaffForm, setShowStaffForm] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [staffPhotoValidationError, setStaffPhotoValidationError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    try {
      const [historyResult, staffResult] = await Promise.all([
        supabase
          .from('club_history')
          .select('*')
          .order('display_order', { ascending: true })
          .order('year', { ascending: true }),
        supabase
          .from('club_staff')
          .select('*')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),
      ])

      const errors: string[] = []

      if (historyResult.error) {
        console.error(historyResult.error)
        errors.push("l'histoire du club")
      } else {
        setHistory(historyResult.data || [])
      }

      if (staffResult.error) {
        console.error(staffResult.error)
        errors.push('les dirigeants')
      } else {
        setStaff(staffResult.data || [])
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
        'Impossible de récupérer les données du club. Vous pouvez réessayer.',
      )
      return false
    } finally {
      setLoading(false)
    }
  }

  const resetHistoryForm = () => {
    setHistoryYear('')
    setHistoryTitle('')
    setHistoryDescription('')
    setHistoryOrder('0')
    setEditingHistoryId(null)
    setShowHistoryForm(false)
  }

  const openHistoryForm = () => {
    if (!canCreate) {
      setMessage("Vous n'avez pas l'autorisation d'ajouter un événement.")
      return
    }

    resetHistoryForm()
    setMessage('')
    setShowHistoryForm(true)
  }

  const editHistory = (item: HistoryItem) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un événement.")
      return
    }

    setEditingHistoryId(item.id)
    setHistoryYear(item.year.toString())
    setHistoryTitle(item.title)
    setHistoryDescription(item.description || '')
    setHistoryOrder(item.display_order.toString())
    setMessage('')
    setShowHistoryForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const saveHistory = async () => {
    if (editingHistoryId && !canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un événement.")
      return
    }

    if (!editingHistoryId && !canCreate) {
      setMessage("Vous n'avez pas l'autorisation d'ajouter un événement.")
      return
    }

    if (!historyYear || !historyTitle.trim()) {
      setMessage("L'année et le titre sont obligatoires.")
      return
    }

    const parsedYear = Number(historyYear)

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > 2100
    ) {
      setMessage("L'année doit être comprise entre 1900 et 2100.")
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      year: parsedYear,
      title: historyTitle.trim(),
      description: historyDescription || null,
      display_order: Number(historyOrder) || 0,
    }

    const result = editingHistoryId
      ? await supabase
          .from('club_history')
          .update(payload)
          .eq('id', editingHistoryId)
      : await supabase
          .from('club_history')
          .insert([payload])

    if (result.error) {
      console.error(result.error)
      setMessage("Erreur lors de l'enregistrement de l'événement.")
      setSaving(false)
      return
    }

    const wasEditing = Boolean(editingHistoryId)

    resetHistoryForm()

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage(
        wasEditing
          ? 'Événement modifié avec succès.'
          : 'Événement ajouté avec succès.',
      )
    }

    setSaving(false)
  }

  const deleteHistory = async (item: HistoryItem) => {
    if (!canDelete) {
      setMessage("Vous n'avez pas l'autorisation de supprimer un événement.")
      return
    }

    const confirmed = window.confirm(
      `Supprimer l'événement "${item.title}" ?`,
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('club_history')
      .delete()
      .eq('id', item.id)

    if (error) {
      console.error(error)
      setMessage("Erreur lors de la suppression de l'événement.")
      return
    }

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage('Événement supprimé.')
    }
  }

  const moveHistory = async (
    item: HistoryItem,
    direction: 'up' | 'down',
  ) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de réordonner l'histoire.")
      return
    }

    const currentIndex = history.findIndex(
      (historyItem) => historyItem.id === item.id,
    )

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= history.length
    ) {
      return
    }

    const reordered = [...history]
    const [movedItem] = reordered.splice(currentIndex, 1)

    reordered.splice(targetIndex, 0, movedItem)

    const results = await Promise.all(
      reordered.map((historyItem, index) =>
        supabase
          .from('club_history')
          .update({
            display_order: index,
          })
          .eq('id', historyItem.id),
      ),
    )

    const reorderError = results.find(
      (result) => result.error,
    )?.error

    if (reorderError) {
      console.error(reorderError)
      setMessage("Impossible de modifier l'ordre de la frise.")
      return
    }

    await fetchData()
  }

  const resetStaffForm = () => {
    setStaffName('')
    setStaffRole('')
    setStaffEmail('')
    setStaffPhone('')
    setStaffOrder('0')
    setStaffImage(null)
    setStaffPreview('')
    setEditingStaffId(null)
    setShowStaffForm(false)
  }

  const openStaffForm = () => {
    if (!canCreate) {
      setMessage("Vous n'avez pas l'autorisation d'ajouter un dirigeant.")
      return
    }

    resetStaffForm()
    setMessage('')
    setShowStaffForm(true)
  }

  const editStaff = (member: StaffMember) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un dirigeant.")
      return
    }

    setEditingStaffId(member.id)
    setStaffName(member.name)
    setStaffRole(member.role)
    setStaffEmail(member.email || '')
    setStaffPhone(member.phone || '')
    setStaffOrder(member.display_order.toString())
    setStaffImage(null)
    setStaffPreview(member.photo_url || '')
    setMessage('')
    setShowStaffForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const saveStaff = async () => {
    if (editingStaffId && !canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un dirigeant.")
      return
    }

    if (!editingStaffId && !canCreate) {
      setMessage("Vous n'avez pas l'autorisation d'ajouter un dirigeant.")
      return
    }

    if (!staffName.trim() || !staffRole.trim()) {
      setMessage('Le nom et la fonction sont obligatoires.')
      return
    }

    setSaving(true)
    setMessage('')

    const previousPhotoUrl = editingStaffId
      ? staff.find((member) => member.id === editingStaffId)?.photo_url || null
      : null

    let photoUrl = ''

    if (staffImage) {
      const staffPhotoError = validateImageFile(staffImage)

      if (staffPhotoError) {
        setStaffPhotoValidationError(staffPhotoError)
        setSaving(false)
        return
      }

      const fileName = createImageFileName(staffImage)

      const { error: uploadError } = await supabase.storage
        .from('staff-images')
        .upload(fileName, staffImage)

      if (uploadError) {
        console.error(uploadError)
        setMessage("Erreur lors de l'envoi de la photo.")
        setSaving(false)
        return
      }

      const { data } = supabase.storage
        .from('staff-images')
        .getPublicUrl(fileName)

      photoUrl = data.publicUrl
    }

    const payload = {
      name: staffName.trim(),
      role: staffRole.trim(),
      email: staffEmail || null,
      phone: staffPhone || null,
      display_order: Number(staffOrder) || 0,
      ...(photoUrl && { photo_url: photoUrl }),
    }

    const result = editingStaffId
      ? await supabase
          .from('club_staff')
          .update(payload)
          .eq('id', editingStaffId)
      : await supabase
          .from('club_staff')
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
          'staff-images',
          photoUrl,
        )
      }

      setMessage("Erreur lors de l'enregistrement du dirigeant.")
      setSaving(false)
      return
    }

    if (photoUrl && previousPhotoUrl) {
      await removeStorageFile(
        'staff-images',
        previousPhotoUrl,
      )
    }

    const wasEditing = Boolean(editingStaffId)

    resetStaffForm()

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage(
        wasEditing
          ? 'Dirigeant modifié avec succès.'
          : 'Dirigeant ajouté avec succès.',
      )
    }

    setSaving(false)
  }

  const toggleStaff = async (member: StaffMember) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier un dirigeant.")
      return
    }

    const { error } = await supabase
      .from('club_staff')
      .update({
        active: !member.active,
      })
      .eq('id', member.id)

    if (error) {
      console.error(error)
      setMessage("Impossible de modifier l'état du dirigeant.")
      return
    }

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage(
        member.active
          ? 'Dirigeant masqué.'
          : 'Dirigeant affiché.',
      )
    }
  }

  const moveStaff = async (
    member: StaffMember,
    direction: 'up' | 'down',
  ) => {
    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de réordonner les dirigeants.")
      return
    }

    const currentIndex = staff.findIndex(
      (staffMember) => staffMember.id === member.id,
    )

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= staff.length
    ) {
      return
    }

    const reordered = [...staff]
    const [movedMember] = reordered.splice(currentIndex, 1)

    reordered.splice(targetIndex, 0, movedMember)

    const results = await Promise.all(
      reordered.map((staffMember, index) =>
        supabase
          .from('club_staff')
          .update({
            display_order: index,
          })
          .eq('id', staffMember.id),
      ),
    )

    const reorderError = results.find(
      (result) => result.error,
    )?.error

    if (reorderError) {
      console.error(reorderError)
      setMessage("Impossible de modifier l'ordre des dirigeants.")
      return
    }

    await fetchData()
  }

  const removeStaffPhoto = async (member: StaffMember) => {
    if (!canUpdate || !member.photo_url) return

    const confirmed = window.confirm(
      `Retirer la photo de "${member.name}" ?`,
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('club_staff')
      .update({
        photo_url: null,
      })
      .eq('id', member.id)

    if (error) {
      console.error(error)
      setMessage("Impossible de retirer la photo du dirigeant.")
      return
    }

    await removeStorageFile(
      'staff-images',
      member.photo_url,
    )

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage('Photo du dirigeant retirée.')
    }
  }

  const deleteStaff = async (member: StaffMember) => {
    if (!canDelete) {
      setMessage("Vous n'avez pas l'autorisation de supprimer un dirigeant.")
      return
    }

    const confirmed = window.confirm(
      `Supprimer définitivement "${member.name}" ?`,
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('club_staff')
      .delete()
      .eq('id', member.id)

    if (error) {
      console.error(error)
      setMessage('Erreur lors de la suppression du dirigeant.')
      return
    }

    if (member.photo_url) {
      await removeStorageFile(
        'staff-images',
        member.photo_url,
      )
    }

    const refreshed = await fetchData()

    if (refreshed) {
      setMessage('Dirigeant supprimé.')
    }
  }

  const activeStaffCount = staff.filter(
    (member) => member.active,
  ).length

  const hiddenStaffCount =
    staff.length - activeStaffCount

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-slate-400">
        Chargement de la page Club...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion du club
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Club
          </h1>

          <p className="mt-2 text-slate-400">
            Gérez l'histoire du FC Plouha et les membres du bureau.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] transition"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>

          <Link
            to="/club"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-4 py-2.5 text-sm font-bold text-slate-950 hover:opacity-90 transition"
          >
            <ExternalLink size={16} />
            Voir la page publique
          </Link>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">
            Frise historique
          </p>
          <p className="mt-2 text-3xl font-black">
            {history.length}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            événement{history.length > 1 ? 's' : ''} publié{history.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">
            Dirigeants visibles
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-400">
            {activeStaffCount}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            affiché{activeStaffCount > 1 ? 's' : ''} sur le site
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-500">
            Dirigeants masqués
          </p>
          <p className="mt-2 text-3xl font-black text-slate-400">
            {hiddenStaffCount}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            non visible{hiddenStaffCount > 1 ? 's' : ''} publiquement
          </p>
        </div>
      </div>

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

      {/* FORMULAIRE HISTOIRE */}
      {showHistoryForm && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">
                {editingHistoryId
                  ? "Modifier l'événement"
                  : "Ajouter un événement"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Cet événement apparaîtra dans la frise historique du site.
              </p>
            </div>

            <button
              type="button"
              onClick={resetHistoryForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Année
              </label>

              <input
                type="number"
                min="1900"
                max="2100"
                value={historyYear}
                onChange={(e) => setHistoryYear(e.target.value)}
                placeholder="2026"
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
                value={historyOrder}
                onChange={(e) => setHistoryOrder(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Titre
              </label>

              <input
                type="text"
                value={historyTitle}
                onChange={(e) => setHistoryTitle(e.target.value)}
                placeholder="Ex : Création du FC Plouha"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>

              <textarea
                rows={5}
                value={historyDescription}
                onChange={(e) => setHistoryDescription(e.target.value)}
                placeholder="Racontez cet événement..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={saveHistory}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold disabled:opacity-50"
            >
              <Save size={18} />
              {saving
                ? 'Enregistrement...'
                : editingHistoryId
                  ? 'Mettre à jour'
                  : "Ajouter l'événement"}
            </button>

            <button
              type="button"
              onClick={resetHistoryForm}
              className="px-6 rounded-xl bg-white/5 hover:bg-white/10 py-3.5 font-semibold"
            >
              Annuler
            </button>
          </div>
        </section>
      )}

      {/* FORMULAIRE STAFF */}
      {showStaffForm && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">
                {editingStaffId
                  ? 'Modifier le dirigeant'
                  : 'Ajouter un dirigeant'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Ces informations pourront être affichées sur la page publique du club.
              </p>
            </div>

            <button
              type="button"
              onClick={resetStaffForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom
              </label>

              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Prénom Nom"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Fonction
              </label>

              <input
                type="text"
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                placeholder="Président, secrétaire..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                E-mail
              </label>

              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="email@exemple.fr"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Téléphone
              </label>

              <input
                type="tel"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                placeholder="06..."
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
                value={staffOrder}
                onChange={(e) => setStaffOrder(e.target.value)}
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

                  const staffPhotoError = validateImageFile(file)

                  if (staffPhotoError) {
                    setStaffImage(null)
                    setStaffPreview('')
                    setStaffPhotoValidationError(staffPhotoError)
                    e.currentTarget.value = ''
                    return
                  }

                  setStaffPhotoValidationError('')
                  setStaffImage(file)
                  setStaffPreview(URL.createObjectURL(file))
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG ou WebP — {MAX_IMAGE_SIZE_LABEL} maximum.
              </p>

              {staffPhotoValidationError && (
                <div role="alert" className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300">
                  {staffPhotoValidationError}
                </div>
              )}
            </div>

            {staffPreview && (
              <div className="md:col-span-2">
                <div className="w-40 h-40 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <img
                    src={staffPreview}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={saveStaff}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold disabled:opacity-50"
            >
              <Save size={18} />
              {saving
                ? 'Enregistrement...'
                : editingStaffId
                  ? 'Mettre à jour'
                  : 'Ajouter le dirigeant'}
            </button>

            <button
              type="button"
              onClick={resetStaffForm}
              className="px-6 rounded-xl bg-white/5 hover:bg-white/10 py-3.5 font-semibold"
            >
              Annuler
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* HISTOIRE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <History className="text-[var(--club-yellow)]" size={21} />

              <div>
                <h2 className="font-bold">
                  Histoire du club
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {history.length} événement{history.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={openHistoryForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold text-sm"
              >
                <Plus size={17} />
                Ajouter
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Aucun événement enregistré.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-5 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 shrink-0 text-[var(--club-yellow)] font-black text-lg">
                      {item.year}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">
                            {item.title}
                          </h3>

                          {item.description && (
                            <p className="text-sm text-slate-500 mt-2">
                              {item.description}
                            </p>
                          )}

                          <p className="text-xs text-slate-600 mt-2">
                            Position : {item.display_order}
                          </p>
                        </div>

                        {(canUpdate || canDelete) && (
                          <div className="flex flex-wrap justify-end gap-2 shrink-0">
                            {canUpdate && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => moveHistory(item, 'up')}
                                  disabled={history[0]?.id === item.id}
                                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
                                  title="Monter"
                                >
                                  <ArrowUp size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => moveHistory(item, 'down')}
                                  disabled={history[history.length - 1]?.id === item.id}
                                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
                                  title="Descendre"
                                >
                                  <ArrowDown size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => editHistory(item)}
                                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                                  title="Modifier"
                                >
                                  <Pencil size={16} />
                                </button>
                              </>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteHistory(item)}
                                className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* STAFF */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="text-[var(--club-yellow)]" size={21} />

              <div>
                <h2 className="font-bold">
                  Bureau & dirigeants
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {staff.length} membre{staff.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={openStaffForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold text-sm"
              >
                <Plus size={17} />
                Ajouter
              </button>
            )}
          </div>

          {staff.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Aucun dirigeant enregistré.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className={`p-5 hover:bg-white/[0.02] transition ${
                    !member.active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">

                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={22}
                          className="text-slate-600"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {member.name}
                        </h3>

                        {!member.active && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                            Masqué
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 mt-1">
                        {member.role}
                      </p>

                      {(member.email || member.phone) && (
                        <p className="text-xs text-slate-600 mt-1">
                          {[member.email, member.phone]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 mt-1">
                        Position : {member.display_order}
                      </p>
                    </div>

                    {(canUpdate || canDelete) && (
                      <div className="flex flex-wrap justify-end gap-2 shrink-0">
                        {canUpdate && (
                          <>
                            <button
                              type="button"
                              onClick={() => moveStaff(member, 'up')}
                              disabled={staff[0]?.id === member.id}
                              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
                              title="Monter"
                            >
                              <ArrowUp size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => moveStaff(member, 'down')}
                              disabled={staff[staff.length - 1]?.id === member.id}
                              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
                              title="Descendre"
                            >
                              <ArrowDown size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleStaff(member)}
                              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                              title={member.active ? 'Masquer' : 'Afficher'}
                            >
                              {member.active ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>

                            {member.photo_url && (
                              <button
                                type="button"
                                onClick={() => removeStaffPhoto(member)}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"
                                title="Retirer la photo"
                              >
                                <ImageOff size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => editStaff(member)}
                              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                              title="Modifier"
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteStaff(member)}
                            className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
