import { useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  CalendarX2,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAdminAccess } from '@/admin/hooks/useAdminAccess'
import { weekdayLabels, type TrainingException, type TrainingSlot } from '@/lib/trainings'

type Team = {
  id: number
  name: string
  category: string | null
  active: boolean
}

type SlotForm = {
  teamId: string
  weekday: string
  startTime: string
  endTime: string
  location: string
  coach: string
  startDate: string
  endDate: string
  active: boolean
}

type ExceptionForm = {
  slotId: string
  originalDate: string
  status: 'cancelled' | 'modified'
  replacementDate: string
  replacementStartTime: string
  replacementEndTime: string
  replacementLocation: string
  note: string
}

const emptySlotForm: SlotForm = {
  teamId: '',
  weekday: '2',
  startTime: '19:00',
  endTime: '',
  location: '',
  coach: '',
  startDate: '',
  endDate: '',
  active: true,
}

const emptyExceptionForm: ExceptionForm = {
  slotId: '',
  originalDate: '',
  status: 'cancelled',
  replacementDate: '',
  replacementStartTime: '',
  replacementEndTime: '',
  replacementLocation: '',
  note: '',
}

const formatDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const timeLabel = (value: string | null) => (value ? value.slice(0, 5) : '')

export default function Trainings() {
  const { can } = useAdminAccess()
  const canCreate = can('teams', 'create')
  const canUpdate = can('teams', 'update')
  const canDelete = can('teams', 'delete')

  const [teams, setTeams] = useState<Team[]>([])
  const [slots, setSlots] = useState<TrainingSlot[]>([])
  const [exceptions, setExceptions] = useState<TrainingException[]>([])
  const [slotForm, setSlotForm] = useState<SlotForm>(emptySlotForm)
  const [exceptionForm, setExceptionForm] = useState<ExceptionForm>(emptyExceptionForm)
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null)
  const [editingExceptionId, setEditingExceptionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const slotById = useMemo(
    () => new Map(slots.map((slot) => [slot.id, slot])),
    [slots],
  )

  const fetchData = async () => {
    setLoading(true)
    setMessage('')

    const [teamsResult, slotsResult, exceptionsResult] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, category, active')
        .order('name', { ascending: true }),
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
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase
        .from('training_exceptions')
        .select('*')
        .order('original_date', { ascending: false }),
    ])

    if (teamsResult.error || slotsResult.error || exceptionsResult.error) {
      console.error(teamsResult.error || slotsResult.error || exceptionsResult.error)
      setMessage("Impossible de charger la gestion des entraînements. Vérifie que le SQL a bien été exécuté.")
    }

    setTeams((teamsResult.data || []) as Team[])
    setSlots(
      ((slotsResult.data || []) as any[]).map((slot) => ({
        ...slot,
        teams: Array.isArray(slot.teams) ? slot.teams[0] ?? null : slot.teams,
      })) as TrainingSlot[],
    )
    setExceptions((exceptionsResult.data || []) as TrainingException[])
    setLoading(false)
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const resetSlotForm = () => {
    setEditingSlotId(null)
    setSlotForm(emptySlotForm)
  }

  const resetExceptionForm = () => {
    setEditingExceptionId(null)
    setExceptionForm(emptyExceptionForm)
  }

  const editSlot = (slot: TrainingSlot) => {
    setEditingSlotId(slot.id)
    setSlotForm({
      teamId: String(slot.team_id),
      weekday: String(slot.weekday),
      startTime: timeLabel(slot.start_time),
      endTime: timeLabel(slot.end_time),
      location: slot.location || '',
      coach: slot.coach || '',
      startDate: slot.start_date || '',
      endDate: slot.end_date || '',
      active: slot.active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveSlot = async () => {
    if (!slotForm.teamId || !slotForm.weekday || !slotForm.startTime) {
      setMessage("L'équipe, le jour et l'heure de début sont obligatoires.")
      return
    }

    if (editingSlotId ? !canUpdate : !canCreate) {
      setMessage("Vous n'avez pas l'autorisation nécessaire.")
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      team_id: Number(slotForm.teamId),
      weekday: Number(slotForm.weekday),
      start_time: slotForm.startTime,
      end_time: slotForm.endTime || null,
      location: slotForm.location.trim() || null,
      coach: slotForm.coach.trim() || null,
      start_date: slotForm.startDate || null,
      end_date: slotForm.endDate || null,
      active: slotForm.active,
      updated_at: new Date().toISOString(),
    }

    const result = editingSlotId
      ? await supabase.from('training_slots').update(payload).eq('id', editingSlotId)
      : await supabase.from('training_slots').insert(payload)

    if (result.error) {
      console.error(result.error)
      setMessage("Impossible d'enregistrer ce créneau.")
    } else {
      resetSlotForm()
      setMessage(editingSlotId ? 'Créneau modifié.' : 'Créneau ajouté.')
      await fetchData()
    }

    setSaving(false)
  }

  const deleteSlot = async (id: number) => {
    if (!canDelete) return
    if (!window.confirm('Supprimer ce créneau récurrent et ses exceptions ?')) return

    const { error } = await supabase.from('training_slots').delete().eq('id', id)
    if (error) {
      console.error(error)
      setMessage('Impossible de supprimer ce créneau.')
      return
    }

    await fetchData()
  }

  const editException = (exception: TrainingException) => {
    setEditingExceptionId(exception.id)
    setExceptionForm({
      slotId: String(exception.training_slot_id),
      originalDate: exception.original_date,
      status: exception.status,
      replacementDate: exception.replacement_date || '',
      replacementStartTime: timeLabel(exception.replacement_start_time),
      replacementEndTime: timeLabel(exception.replacement_end_time),
      replacementLocation: exception.replacement_location || '',
      note: exception.note || '',
    })
  }

  const saveException = async () => {
    if (!exceptionForm.slotId || !exceptionForm.originalDate) {
      setMessage('Choisis un créneau et la date normalement prévue.')
      return
    }

    if (editingExceptionId ? !canUpdate : !canCreate) {
      setMessage("Vous n'avez pas l'autorisation nécessaire.")
      return
    }

    setSaving(true)
    setMessage('')

    const modified = exceptionForm.status === 'modified'
    const payload = {
      training_slot_id: Number(exceptionForm.slotId),
      original_date: exceptionForm.originalDate,
      status: exceptionForm.status,
      replacement_date: modified ? exceptionForm.replacementDate || null : null,
      replacement_start_time: modified ? exceptionForm.replacementStartTime || null : null,
      replacement_end_time: modified ? exceptionForm.replacementEndTime || null : null,
      replacement_location: modified ? exceptionForm.replacementLocation.trim() || null : null,
      note: exceptionForm.note.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const result = editingExceptionId
      ? await supabase.from('training_exceptions').update(payload).eq('id', editingExceptionId)
      : await supabase.from('training_exceptions').upsert(payload, {
          onConflict: 'training_slot_id,original_date',
        })

    if (result.error) {
      console.error(result.error)
      setMessage("Impossible d'enregistrer cette exception.")
    } else {
      resetExceptionForm()
      setMessage('Exception enregistrée.')
      await fetchData()
    }

    setSaving(false)
  }

  const deleteException = async (id: number) => {
    if (!canDelete) return
    if (!window.confirm('Supprimer cette exception ? La séance redeviendra normale.')) return

    const { error } = await supabase.from('training_exceptions').delete().eq('id', id)
    if (error) {
      console.error(error)
      setMessage("Impossible de supprimer l'exception.")
      return
    }

    await fetchData()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[var(--club-yellow)] text-sm font-semibold mb-2">
            <CalendarClock size={18} />
            Planning sportif
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Entraînements</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Crée les créneaux hebdomadaires une seule fois. Le site calcule ensuite automatiquement la prochaine séance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.08] transition"
        >
          <RefreshCw size={17} /> Actualiser
        </button>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-bold text-lg">{editingSlotId ? 'Modifier le créneau' : 'Ajouter un créneau récurrent'}</h2>
            <p className="text-sm text-slate-500 mt-1">Exemple : Seniors · mardi · 19h00 · Stade de Plouha.</p>
          </div>
          {editingSlotId && (
            <button type="button" onClick={resetSlotForm} className="text-slate-400 hover:text-white"><X size={20} /></button>
          )}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="text-sm font-semibold">Équipe
            <select value={slotForm.teamId} onChange={(e) => setSlotForm((v) => ({ ...v, teamId: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
              <option value="">Choisir...</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}{team.category ? ` — ${team.category}` : ''}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Jour
            <select value={slotForm.weekday} onChange={(e) => setSlotForm((v) => ({ ...v, weekday: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
              {Object.entries(weekdayLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Début
            <input type="time" value={slotForm.startTime} onChange={(e) => setSlotForm((v) => ({ ...v, startTime: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
          <label className="text-sm font-semibold">Fin <span className="text-slate-500 font-normal">(facultatif)</span>
            <input type="time" value={slotForm.endTime} onChange={(e) => setSlotForm((v) => ({ ...v, endTime: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
          <label className="text-sm font-semibold xl:col-span-2">Lieu
            <input value={slotForm.location} onChange={(e) => setSlotForm((v) => ({ ...v, location: e.target.value }))} placeholder="Terrain des sports, Plouha" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
          <label className="text-sm font-semibold xl:col-span-2">Responsable / éducateur
            <input value={slotForm.coach} onChange={(e) => setSlotForm((v) => ({ ...v, coach: e.target.value }))} placeholder="Facultatif" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
          <label className="text-sm font-semibold">À partir du
            <input type="date" value={slotForm.startDate} onChange={(e) => setSlotForm((v) => ({ ...v, startDate: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
          <label className="text-sm font-semibold">Jusqu'au
            <input type="date" value={slotForm.endDate} onChange={(e) => setSlotForm((v) => ({ ...v, endDate: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
          <div className="xl:col-span-2 flex items-end">
            <button type="button" onClick={() => setSlotForm((v) => ({ ...v, active: !v.active }))} className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${slotForm.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-slate-950 text-slate-400'}`}>
              {slotForm.active ? 'Créneau actif et visible' : 'Créneau désactivé'}
            </button>
          </div>
        </div>

        {(editingSlotId ? canUpdate : canCreate) && (
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={() => void saveSlot()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--club-yellow)] px-5 py-3 font-bold text-[var(--club-navy-deep)] disabled:opacity-50">
              {editingSlotId ? <Save size={18} /> : <Plus size={18} />}
              {editingSlotId ? 'Enregistrer les modifications' : 'Ajouter le créneau'}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden mb-8">
        <div className="px-5 sm:px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-lg">Créneaux hebdomadaires</h2>
          <p className="text-sm text-slate-500">{slots.length} créneau{slots.length > 1 ? 'x' : ''}</p>
        </div>
        {loading ? (
          <div className="p-6 text-slate-400">Chargement...</div>
        ) : slots.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Aucun entraînement enregistré.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {slots.map((slot) => (
              <article key={slot.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{slot.teams?.name || `Équipe #${slot.team_id}`}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${slot.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/[0.06] text-slate-500'}`}>{slot.active ? 'ACTIF' : 'MASQUÉ'}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2"><CalendarClock size={15} />{weekdayLabels[slot.weekday]}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 size={15} />{timeLabel(slot.start_time)}{slot.end_time ? ` – ${timeLabel(slot.end_time)}` : ''}</span>
                    {slot.location && <span className="inline-flex items-center gap-2"><MapPin size={15} />{slot.location}</span>}
                  </div>
                  {(slot.start_date || slot.end_date || slot.coach) && <p className="mt-2 text-xs text-slate-500">{slot.start_date ? `Du ${formatDate(slot.start_date)}` : 'Sans date de début'}{slot.end_date ? ` au ${formatDate(slot.end_date)}` : ''}{slot.coach ? ` · ${slot.coach}` : ''}</p>}
                </div>
                <div className="flex gap-2">
                  {canUpdate && <button type="button" onClick={() => editSlot(slot)} className="rounded-xl border border-white/10 p-2.5 text-slate-300 hover:bg-white/[0.06]" title="Modifier"><Pencil size={17} /></button>}
                  {canDelete && <button type="button" onClick={() => void deleteSlot(slot.id)} className="rounded-xl border border-red-500/20 p-2.5 text-red-300 hover:bg-red-500/10" title="Supprimer"><Trash2 size={17} /></button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2"><CalendarX2 size={18} className="text-[var(--club-yellow)]" /><h2 className="font-bold text-lg">Exception ponctuelle</h2></div>
            <p className="mt-1 text-sm text-slate-500">Annule une séance précise ou déplace-la sans modifier le créneau hebdomadaire.</p>
          </div>
          {editingExceptionId && <button type="button" onClick={resetExceptionForm} className="text-slate-400 hover:text-white"><X size={20} /></button>}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="text-sm font-semibold xl:col-span-2">Créneau concerné
            <select value={exceptionForm.slotId} onChange={(e) => setExceptionForm((v) => ({ ...v, slotId: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
              <option value="">Choisir...</option>
              {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.teams?.name || 'Équipe'} — {weekdayLabels[slot.weekday]} {timeLabel(slot.start_time)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Date normalement prévue
            <input type="date" value={exceptionForm.originalDate} onChange={(e) => setExceptionForm((v) => ({ ...v, originalDate: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
          <label className="text-sm font-semibold">Action
            <select value={exceptionForm.status} onChange={(e) => setExceptionForm((v) => ({ ...v, status: e.target.value as 'cancelled' | 'modified' }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
              <option value="cancelled">Séance annulée</option>
              <option value="modified">Séance déplacée / modifiée</option>
            </select>
          </label>

          {exceptionForm.status === 'modified' && <>
            <label className="text-sm font-semibold">Nouvelle date
              <input type="date" value={exceptionForm.replacementDate} onChange={(e) => setExceptionForm((v) => ({ ...v, replacementDate: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
            </label>
            <label className="text-sm font-semibold">Nouvelle heure
              <input type="time" value={exceptionForm.replacementStartTime} onChange={(e) => setExceptionForm((v) => ({ ...v, replacementStartTime: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
            </label>
            <label className="text-sm font-semibold">Nouvelle heure de fin
              <input type="time" value={exceptionForm.replacementEndTime} onChange={(e) => setExceptionForm((v) => ({ ...v, replacementEndTime: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
            </label>
            <label className="text-sm font-semibold">Nouveau lieu
              <input value={exceptionForm.replacementLocation} onChange={(e) => setExceptionForm((v) => ({ ...v, replacementLocation: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
            </label>
          </>}

          <label className="text-sm font-semibold xl:col-span-4">Note publique facultative
            <input value={exceptionForm.note} onChange={(e) => setExceptionForm((v) => ({ ...v, note: e.target.value }))} placeholder="Ex. : terrain indisponible" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white" />
          </label>
        </div>

        {(editingExceptionId ? canUpdate : canCreate) && (
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={() => void saveException()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[var(--club-yellow)] px-5 py-3 font-bold text-[var(--club-navy-deep)] disabled:opacity-50">
              <Save size={18} /> Enregistrer l'exception
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-lg">Exceptions enregistrées</h2>
        </div>
        {exceptions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucune annulation ou modification ponctuelle.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {exceptions.map((exception) => {
              const slot = slotById.get(exception.training_slot_id)
              return (
                <article key={exception.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{slot?.teams?.name || 'Équipe'}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${exception.status === 'cancelled' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>
                        {exception.status === 'cancelled' ? 'ANNULÉE' : 'MODIFIÉE'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">Séance du {formatDate(exception.original_date)}</p>
                    {exception.status === 'modified' && <p className="mt-1 text-sm text-slate-300">→ {exception.replacement_date ? formatDate(exception.replacement_date) : 'même date'}{exception.replacement_start_time ? ` à ${timeLabel(exception.replacement_start_time)}` : ''}{exception.replacement_location ? ` · ${exception.replacement_location}` : ''}</p>}
                    {exception.note && <p className="mt-1 text-xs text-slate-500">{exception.note}</p>}
                  </div>
                  <div className="flex gap-2">
                    {canUpdate && <button type="button" onClick={() => editException(exception)} className="rounded-xl border border-white/10 p-2.5 text-slate-300 hover:bg-white/[0.06]"><Pencil size={17} /></button>}
                    {canDelete && <button type="button" onClick={() => void deleteException(exception.id)} className="rounded-xl border border-red-500/20 p-2.5 text-red-300 hover:bg-red-500/10"><Trash2 size={17} /></button>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
