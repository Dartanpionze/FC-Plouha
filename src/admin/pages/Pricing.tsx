import { useEffect, useMemo, useState } from 'react'
import {
  Euro,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAdminAccess } from '@/admin/hooks/useAdminAccess'

type RegistrationFee = {
  id: string
  title: string
  amount: number
  description: string | null
  season: string | null
  display_order: number
  active: boolean
  created_at: string
  updated_at: string
}

type FormState = {
  title: string
  amount: string
  description: string
  season: string
  displayOrder: string
  active: boolean
}

const emptyForm: FormState = {
  title: '',
  amount: '',
  description: '',
  season: '',
  displayOrder: '0',
  active: true,
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)

export default function Pricing() {
  const { can } = useAdminAccess()
  const canCreate = can('settings', 'create')
  const canUpdate = can('settings', 'update')
  const canDelete = can('settings', 'delete')

  const [fees, setFees] = useState<RegistrationFee[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [defaultSeason, setDefaultSeason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const editingFee = useMemo(
    () => fees.find((fee) => fee.id === editingId) ?? null,
    [editingId, fees],
  )

  const fetchData = async () => {
    setLoading(true)
    setMessage('')

    const [feesResult, settingsResult] = await Promise.all([
      supabase
        .from('registration_fees')
        .select('*')
        .order('display_order', { ascending: true })
        .order('title', { ascending: true }),
      supabase
        .from('club_settings')
        .select('season')
        .limit(1)
        .maybeSingle(),
    ])

    if (feesResult.error) {
      console.error(feesResult.error)
      setMessage('Impossible de charger les tarifs.')
    } else {
      setFees(
        (feesResult.data ?? []).map((fee) => ({
          ...fee,
          amount: Number(fee.amount),
        })) as RegistrationFee[],
      )
    }

    if (!settingsResult.error) {
      const season = settingsResult.data?.season || ''
      setDefaultSeason(season)

      if (!editingId) {
        setForm((current) => ({
          ...current,
          season: current.season || season,
        }))
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      season: defaultSeason,
    })
    setMessage('')
  }

  const startEdit = (fee: RegistrationFee) => {
    setEditingId(fee.id)
    setForm({
      title: fee.title,
      amount: String(fee.amount),
      description: fee.description || '',
      season: fee.season || '',
      displayOrder: String(fee.display_order),
      active: fee.active,
    })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveFee = async () => {
    const title = form.title.trim()
    const amount = Number(form.amount.replace(',', '.'))
    const displayOrder = Number(form.displayOrder || '0')

    if (!title) {
      setMessage("L'intitulé du tarif est obligatoire.")
      return
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setMessage('Le tarif doit être un montant positif ou égal à 0.')
      return
    }

    if (!Number.isInteger(displayOrder)) {
      setMessage("L'ordre d'affichage doit être un nombre entier.")
      return
    }

    if (editingId && !canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier les tarifs.")
      return
    }

    if (!editingId && !canCreate) {
      setMessage("Vous n'avez pas l'autorisation d'ajouter un tarif.")
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      title,
      amount,
      description: form.description.trim() || null,
      season: form.season.trim() || null,
      display_order: displayOrder,
      active: form.active,
      updated_at: new Date().toISOString(),
    }

    const result = editingId
      ? await supabase
          .from('registration_fees')
          .update(payload)
          .eq('id', editingId)
      : await supabase
          .from('registration_fees')
          .insert(payload)

    if (result.error) {
      console.error(result.error)
      setMessage(
        editingId
          ? 'Erreur lors de la modification du tarif.'
          : "Erreur lors de l'ajout du tarif.",
      )
      setSaving(false)
      return
    }

    await fetchData()
    resetForm()
    setMessage(
      editingId
        ? 'Tarif modifié avec succès.'
        : 'Tarif ajouté avec succès.',
    )
    setSaving(false)
  }

  const toggleActive = async (fee: RegistrationFee) => {
    if (!canUpdate) return

    const { error } = await supabase
      .from('registration_fees')
      .update({
        active: !fee.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fee.id)

    if (error) {
      console.error(error)
      setMessage("Impossible de modifier la visibilité du tarif.")
      return
    }

    setFees((current) =>
      current.map((item) =>
        item.id === fee.id
          ? { ...item, active: !item.active }
          : item,
      ),
    )
  }

  const deleteFee = async (fee: RegistrationFee) => {
    if (!canDelete) return

    const confirmed = window.confirm(
      `Supprimer définitivement le tarif « ${fee.title} » ?`,
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('registration_fees')
      .delete()
      .eq('id', fee.id)

    if (error) {
      console.error(error)
      setMessage('Impossible de supprimer le tarif.')
      return
    }

    setFees((current) => current.filter((item) => item.id !== fee.id))

    if (editingId === fee.id) {
      resetForm()
    }

    setMessage('Tarif supprimé.')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-slate-400 mb-1">Inscriptions</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tarifs des licences
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl">
            Gérez les tarifs affichés sur la page « Rejoindre le club ». Un
            tarif désactivé reste enregistré dans le CMS mais disparaît du site
            public.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchData()}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition"
        >
          <RefreshCw size={17} />
          Recharger
        </button>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--club-yellow)]/10 text-[var(--club-yellow)]">
                <Euro size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {editingFee ? 'Modifier le tarif' : 'Ajouter un tarif'}
                </h2>
                <p className="text-sm text-slate-500">
                  Exemple : Senior loisir, U18, licence dirigeant…
                </p>
              </div>
            </div>
          </div>

          {editingFee && (
            <button
              type="button"
              onClick={resetForm}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
              aria-label="Annuler la modification"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Intitulé *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Senior loisir"
              disabled={editingFee ? !canUpdate : !canCreate}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Tarif en euros *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="120"
                disabled={editingFee ? !canUpdate : !canCreate}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-12 text-white outline-none focus:border-white/30 disabled:opacity-60"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                €
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Saison</label>
            <input
              type="text"
              value={form.season}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  season: event.target.value,
                }))
              }
              placeholder="2026-2027"
              disabled={editingFee ? !canUpdate : !canCreate}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Ordre d'affichage
            </label>
            <input
              type="number"
              step="1"
              value={form.displayOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder: event.target.value,
                }))
              }
              disabled={editingFee ? !canUpdate : !canCreate}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Précision facultative
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Ex. : paiement en plusieurs fois possible, équipement inclus…"
              disabled={editingFee ? !canUpdate : !canCreate}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30 resize-none disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                active: !current.active,
              }))
            }
            disabled={editingFee ? !canUpdate : !canCreate}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
              form.active
                ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300'
                : 'border-white/10 bg-slate-950 text-slate-400'
            }`}
          >
            {form.active ? <Eye size={17} /> : <EyeOff size={17} />}
            {form.active ? 'Visible sur le site' : 'Masqué au public'}
          </button>

          {(editingFee ? canUpdate : canCreate) && (
            <button
              type="button"
              onClick={() => void saveFee()}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-5 py-3 font-bold text-[var(--club-navy-deep)] hover:opacity-90 disabled:opacity-50 transition"
            >
              {editingFee ? <Save size={18} /> : <Plus size={18} />}
              {saving
                ? 'Enregistrement...'
                : editingFee
                  ? 'Enregistrer le tarif'
                  : 'Ajouter le tarif'}
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-6 py-4">
          <div>
            <h2 className="font-bold text-lg">Tarifs enregistrés</h2>
            <p className="text-sm text-slate-500">
              {fees.length} tarif{fees.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-slate-400">Chargement des tarifs...</div>
        ) : fees.length === 0 ? (
          <div className="p-6 sm:p-10 text-center">
            <Euro size={32} className="mx-auto text-slate-600" />
            <p className="mt-3 font-semibold">Aucun tarif enregistré</p>
            <p className="mt-1 text-sm text-slate-500">
              Ajoutez le premier tarif avec le formulaire ci-dessus.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {fees.map((fee) => (
              <article
                key={fee.id}
                className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{fee.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        fee.active
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-white/[0.06] text-slate-500'
                      }`}
                    >
                      {fee.active ? 'PUBLIC' : 'MASQUÉ'}
                    </span>
                    {fee.season && (
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                        {fee.season}
                      </span>
                    )}
                  </div>

                  {fee.description && (
                    <p className="mt-2 text-sm text-slate-400">
                      {fee.description}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-600">
                    Ordre : {fee.display_order}
                  </p>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3">
                  <div className="text-2xl font-black text-[var(--club-yellow)] whitespace-nowrap">
                    {formatPrice(fee.amount)}
                  </div>

                  <div className="flex items-center gap-2">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => void toggleActive(fee)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
                        title={fee.active ? 'Masquer du site' : 'Publier sur le site'}
                      >
                        {fee.active ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    )}

                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => startEdit(fee)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
                        title="Modifier"
                      >
                        <Pencil size={17} />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void deleteFee(fee)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
