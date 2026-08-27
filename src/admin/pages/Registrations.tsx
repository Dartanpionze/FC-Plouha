import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  CalendarDays,
  MessageSquare,
  Trash2,
  Save,
} from 'lucide-react'

type Registration = {
  id: number
  created_at: string
  first_name: string
  last_name: string
  birth_year: number | null
  category: string | null
  email: string | null
  phone: string | null
  request_type: string
  message: string | null
  status: string
  admin_notes: string | null
}

const statuses = [
  'Nouveau',
  'Contacté',
  'Validé',
  'Refusé',
]

function statusClasses(status: string) {
  switch (status) {
    case 'Nouveau':
      return 'bg-red-500/10 text-red-400'
    case 'Contacté':
      return 'bg-blue-500/10 text-blue-400'
    case 'Validé':
      return 'bg-green-500/10 text-green-400'
    case 'Refusé':
      return 'bg-slate-500/10 text-slate-400'
    default:
      return 'bg-white/5 text-slate-400'
  }
}

export default function Registrations() {
  const [registrations, setRegistrations] =
    useState<Registration[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('Tous')

  const [selected, setSelected] =
    useState<Registration | null>(null)

  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(error)
      setMessage(
        'Impossible de récupérer les demandes.',
      )
      setLoading(false)
      return
    }

    setRegistrations(data || [])
    setLoading(false)
  }

  const openRegistration = (
    registration: Registration,
  ) => {
    setSelected(registration)
    setNotes(registration.admin_notes || '')
    setMessage('')
  }

  const updateStatus = async (
    registration: Registration,
    status: string,
  ) => {
    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', registration.id)

    if (error) {
      console.error(error)
      setMessage(
        "Impossible de modifier le statut.",
      )
      return
    }

    if (selected?.id === registration.id) {
      setSelected({
        ...registration,
        status,
      })
    }

    fetchRegistrations()
  }

  const saveNotes = async () => {
    if (!selected) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('registrations')
      .update({
        admin_notes: notes || null,
      })
      .eq('id', selected.id)

    if (error) {
      console.error(error)
      setMessage(
        "Erreur lors de l'enregistrement des notes.",
      )
      setSaving(false)
      return
    }

    setSelected({
      ...selected,
      admin_notes: notes,
    })

    setMessage('Notes enregistrées.')
    setSaving(false)
    fetchRegistrations()
  }

  const deleteRegistration = async (
    registration: Registration,
  ) => {
    const confirmed = window.confirm(
      `Supprimer définitivement la demande de ${registration.first_name} ${registration.last_name} ?`,
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registration.id)

    if (error) {
      console.error(error)
      setMessage(
        'Erreur lors de la suppression.',
      )
      return
    }

    if (selected?.id === registration.id) {
      setSelected(null)
    }

    setMessage('Demande supprimée.')
    fetchRegistrations()
  }

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase()

    return registrations.filter(
      (registration) => {
        const matchesStatus =
          statusFilter === 'Tous' ||
          registration.status === statusFilter

        const matchesSearch =
          !query ||
          registration.first_name
            .toLowerCase()
            .includes(query) ||
          registration.last_name
            .toLowerCase()
            .includes(query) ||
          registration.email
            ?.toLowerCase()
            .includes(query) ||
          registration.phone
            ?.toLowerCase()
            .includes(query) ||
          registration.category
            ?.toLowerCase()
            .includes(query) ||
          registration.request_type
            .toLowerCase()
            .includes(query)

        return matchesStatus && matchesSearch
      },
    )
  }, [
    registrations,
    search,
    statusFilter,
  ])

  const newCount = registrations.filter(
    (item) => item.status === 'Nouveau',
  ).length

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion du club
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Inscriptions
          </h1>

          <p className="mt-2 text-slate-400">
            Gérez les demandes reçues depuis le site.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
          <div className="text-xs text-slate-500">
            Nouvelles demandes
          </div>

          <div className="text-2xl font-black text-[var(--club-yellow)]">
            {newCount}
          </div>
        </div>

      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">

        {/* LISTE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          <div className="p-5 border-b border-white/10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

            <div>
              <h2 className="font-semibold">
                Demandes reçues
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {registrations.length} demande
                {registrations.length > 1
                  ? 's'
                  : ''}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none"
              >
                <option value="Tous">
                  Tous les statuts
                </option>

                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Rechercher..."
                  className="w-full sm:w-64 rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-white/30"
                />
              </div>

            </div>

          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Chargement des demandes...
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus
                size={38}
                className="mx-auto text-slate-600 mb-3"
              />

              <p className="text-slate-500">
                Aucune demande trouvée.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">

              {filteredRegistrations.map(
                (registration) => (
                  <button
                    type="button"
                    key={registration.id}
                    onClick={() =>
                      openRegistration(registration)
                    }
                    className={`w-full p-5 text-left hover:bg-white/[0.03] transition ${
                      selected?.id ===
                      registration.id
                        ? 'bg-white/[0.05]'
                        : ''
                    }`}
                  >

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <UserPlus
                          size={20}
                          className="text-[var(--club-yellow)]"
                        />
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-semibold">
                            {registration.first_name}{' '}
                            {registration.last_name}
                          </h3>

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${statusClasses(
                              registration.status,
                            )}`}
                          >
                            {registration.status}
                          </span>

                        </div>

                        <p className="text-sm text-slate-400 mt-1">
                          {registration.request_type}
                          {registration.category
                            ? ` · ${registration.category}`
                            : ''}
                        </p>

                        <p className="text-xs text-slate-600 mt-2">
                          {new Date(
                            registration.created_at,
                          ).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </p>

                      </div>

                    </div>

                  </button>
                ),
              )}

            </div>
          )}

        </section>

        {/* DETAIL */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden h-fit xl:sticky xl:top-6">

          {!selected ? (
            <div className="p-10 text-center">
              <MessageSquare
                size={38}
                className="mx-auto text-slate-600 mb-3"
              />

              <p className="text-slate-500">
                Sélectionnez une demande pour afficher son détail.
              </p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-white/10">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-xs text-slate-500">
                      Demande #{selected.id}
                    </p>

                    <h2 className="text-xl font-bold mt-1">
                      {selected.first_name}{' '}
                      {selected.last_name}
                    </h2>

                    <p className="text-sm text-slate-400 mt-1">
                      {selected.request_type}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1.5 rounded-full ${statusClasses(
                      selected.status,
                    )}`}
                  >
                    {selected.status}
                  </span>

                </div>

              </div>

              <div className="p-5 space-y-6">

                {/* STATUT */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">
                    Statut
                  </label>

                  <select
                    value={selected.status}
                    onChange={(e) =>
                      updateStatus(
                        selected,
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INFOS */}
                <div className="space-y-3">

                  {selected.birth_year && (
                    <div className="flex gap-3 text-sm">
                      <CalendarDays
                        size={17}
                        className="text-[var(--club-yellow)] shrink-0"
                      />

                      <span className="text-slate-300">
                        Né(e) en{' '}
                        {selected.birth_year}
                      </span>
                    </div>
                  )}

                  {selected.category && (
                    <div className="text-sm">
                      <span className="text-slate-500">
                        Catégorie :
                      </span>{' '}
                      <span className="text-slate-300">
                        {selected.category}
                      </span>
                    </div>
                  )}

                  {selected.email && (
                    <a
                      href={`mailto:${selected.email}`}
                      className="flex gap-3 text-sm text-slate-300 hover:text-white"
                    >
                      <Mail
                        size={17}
                        className="text-[var(--club-yellow)] shrink-0"
                      />
                      {selected.email}
                    </a>
                  )}

                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone.replace(
                        /\s/g,
                        '',
                      )}`}
                      className="flex gap-3 text-sm text-slate-300 hover:text-white"
                    >
                      <Phone
                        size={17}
                        className="text-[var(--club-yellow)] shrink-0"
                      />
                      {selected.phone}
                    </a>
                  )}

                </div>

                {/* MESSAGE */}
                {selected.message && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Message
                    </label>

                    <div className="rounded-xl bg-slate-950 border border-white/10 p-4 text-sm text-slate-300 whitespace-pre-wrap">
                      {selected.message}
                    </div>
                  </div>
                )}

                {/* NOTES */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">
                    Notes internes
                  </label>

                  <textarea
                    rows={5}
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value)
                    }
                    placeholder="Notes visibles uniquement dans le CMS..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none resize-none placeholder:text-slate-600"
                  />

                  <button
                    type="button"
                    onClick={saveNotes}
                    disabled={saving}
                    className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3 font-bold disabled:opacity-50"
                  >
                    <Save size={17} />
                    {saving
                      ? 'Enregistrement...'
                      : 'Enregistrer les notes'}
                  </button>
                </div>

                {/* SUPPRESSION */}
                <button
                  type="button"
                  onClick={() =>
                    deleteRegistration(selected)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 font-semibold"
                >
                  <Trash2 size={17} />
                  Supprimer la demande
                </button>

              </div>
            </>
          )}

        </section>

      </div>

    </div>
  )
}
