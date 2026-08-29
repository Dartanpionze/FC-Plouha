import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, Power, RefreshCw, Save, ShieldCheck, Trash2, UserPlus, UserRound, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AdminModule } from '@/lib/adminPermissions'

type AdminUser = {
  user_id: string
  display_name: string | null
  email: string
  role: 'superadmin' | 'admin'
  active: boolean
  created_at: string
}

type PermissionRow = {
  id?: number
  user_id: string
  module: AdminModule
  can_view: boolean
  can_create: boolean
  can_update: boolean
  can_delete: boolean
}

type InvitePermission = Omit<PermissionRow, 'id' | 'user_id'>

type PermissionAction =
  | 'can_view'
  | 'can_create'
  | 'can_update'
  | 'can_delete'

const modules: Array<{ key: AdminModule; label: string }> = [
  { key: 'news', label: 'Actualités' },
  { key: 'club', label: 'Club' },
  { key: 'teams', label: 'Équipes' },
  { key: 'players', label: 'Joueurs' },
  { key: 'matches', label: 'Matchs' },
  { key: 'gallery', label: 'Galerie' },
  { key: 'partners', label: 'Partenaires' },
  { key: 'registrations', label: 'Inscriptions' },
  { key: 'settings', label: 'Paramètres' },
]

function emptyPermissions(userId: string): PermissionRow[] {
  return modules.map(({ key }) => ({
    user_id: userId,
    module: key,
    can_view: false,
    can_create: false,
    can_update: false,
    can_delete: false,
  }))
}

function emptyInvitePermissions(): InvitePermission[] {
  return modules.map(({ key }) => ({
    module: key,
    can_view: false,
    can_create: false,
    can_update: false,
    can_delete: false,
  }))
}

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [managingUser, setManagingUser] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermissions, setInvitePermissions] = useState<InvitePermission[]>(emptyInvitePermissions)
  const [inviting, setInviting] = useState(false)

  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) ?? null,
    [users, selectedUserId],
  )

  const loadUsers = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id, display_name, email, role, active, created_at')
      .order('role', { ascending: false })
      .order('display_name', { ascending: true })

    if (error) {
      console.error(error)
      setErrorMessage('Impossible de charger les utilisateurs du CMS.')
      setLoading(false)
      return
    }

    const loadedUsers = (data ?? []) as AdminUser[]
    setUsers(loadedUsers)

    setSelectedUserId((current) => {
      if (current && loadedUsers.some((user) => user.user_id === current)) {
        return current
      }
      return loadedUsers[0]?.user_id ?? ''
    })

    setLoading(false)
  }

  const loadPermissions = async (userId: string) => {
    if (!userId) {
      setPermissions([])
      return
    }

    const { data, error } = await supabase
      .from('admin_permissions')
      .select('id, user_id, module, can_view, can_create, can_update, can_delete')
      .eq('user_id', userId)
      .order('module')

    if (error) {
      console.error(error)
      setErrorMessage('Impossible de charger les permissions de cet utilisateur.')
      return
    }

    const byModule = new Map(
      ((data ?? []) as PermissionRow[]).map((permission) => [
        permission.module,
        permission,
      ]),
    )

    setPermissions(
      emptyPermissions(userId).map(
        (permission) => byModule.get(permission.module) ?? permission,
      ),
    )
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    setMessage('')
    setErrorMessage('')
    loadPermissions(selectedUserId)
  }, [selectedUserId])

  const togglePermission = (
    module: AdminModule,
    action: PermissionAction,
  ) => {
    if (selectedUser?.role === 'superadmin') return

    setPermissions((current) =>
      current.map((permission) => {
        if (permission.module !== module) return permission

        const next = {
          ...permission,
          [action]: !permission[action],
        }

        if (action !== 'can_view' && next[action]) {
          next.can_view = true
        }

        if (action === 'can_view' && !next.can_view) {
          next.can_create = false
          next.can_update = false
          next.can_delete = false
        }

        return next
      }),
    )
  }

  const toggleInvitePermission = (
    module: AdminModule,
    action: PermissionAction,
  ) => {
    setInvitePermissions((current) =>
      current.map((permission) => {
        if (permission.module !== module) return permission

        const next = {
          ...permission,
          [action]: !permission[action],
        }

        if (action !== 'can_view' && next[action]) {
          next.can_view = true
        }

        if (action === 'can_view' && !next.can_view) {
          next.can_create = false
          next.can_update = false
          next.can_delete = false
        }

        return next
      }),
    )
  }

  const savePermissions = async () => {
    if (!selectedUser || selectedUser.role === 'superadmin') return

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const payload = permissions.map(({ id: _id, ...permission }) => permission)

    const { error } = await supabase
      .from('admin_permissions')
      .upsert(payload, { onConflict: 'user_id,module' })

    if (error) {
      console.error(error)
      setErrorMessage('Impossible d’enregistrer les permissions.')
      setSaving(false)
      return
    }

    await loadPermissions(selectedUser.user_id)
    setMessage('Permissions enregistrées.')
    setSaving(false)
  }

  const callManageUserApi = async (payload: Record<string, unknown>) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (sessionError || !accessToken) {
      throw new Error('Votre session a expiré. Reconnectez-vous.')
    }

    const response = await fetch('/api/admin-manage-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const result = (await response.json()) as { error?: string }

    if (!response.ok) {
      throw new Error(result.error || 'Impossible de modifier ce compte.')
    }
  }

  const toggleUserActive = async () => {
    if (!selectedUser || selectedUser.role === 'superadmin') return

    const nextActive = !selectedUser.active
    const label = nextActive ? 'réactiver' : 'désactiver'

    if (!window.confirm(`Voulez-vous vraiment ${label} le compte de ${selectedUser.display_name || selectedUser.email} ?`)) {
      return
    }

    setManagingUser(true)
    setMessage('')
    setErrorMessage('')

    try {
      await callManageUserApi({
        action: 'set-active',
        user_id: selectedUser.user_id,
        active: nextActive,
      })

      await loadUsers()
      setMessage(nextActive ? 'Compte réactivé.' : 'Compte désactivé.')
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de modifier l'état du compte.",
      )
    } finally {
      setManagingUser(false)
    }
  }

  const deleteUser = async () => {
    if (!selectedUser || selectedUser.role === 'superadmin') return

    const label = selectedUser.display_name || selectedUser.email
    const confirmed = window.confirm(
      `Supprimer définitivement le compte CMS de ${label} ?

Cette action supprime aussi son compte de connexion Supabase Auth et ne peut pas être annulée.`,
    )

    if (!confirmed) return

    setManagingUser(true)
    setMessage('')
    setErrorMessage('')

    try {
      const deletedUserId = selectedUser.user_id

      await callManageUserApi({
        action: 'delete',
        user_id: deletedUserId,
      })

      setSelectedUserId('')
      setPermissions([])
      await loadUsers()
      setMessage('Compte administrateur supprimé définitivement.')
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Impossible de supprimer ce compte.',
      )
    } finally {
      setManagingUser(false)
    }
  }

  const closeInvite = () => {
    if (inviting) return
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInvitePermissions(emptyInvitePermissions())
  }

  const inviteUser = async (event: FormEvent) => {
    event.preventDefault()
    setInviting(true)
    setMessage('')
    setErrorMessage('')

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (sessionError || !accessToken) {
      setErrorMessage('Votre session a expiré. Reconnectez-vous avant d’inviter un utilisateur.')
      setInviting(false)
      return
    }

    try {
      const response = await fetch('/api/admin-invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          display_name: inviteName,
          email: inviteEmail,
          permissions: invitePermissions,
        }),
      })

      const result = (await response.json()) as { error?: string; user_id?: string }

      if (!response.ok || !result.user_id) {
        setErrorMessage(result.error || "L'invitation n'a pas pu être envoyée.")
        setInviting(false)
        return
      }

      const invitedUserId = result.user_id
      await loadUsers()
      setSelectedUserId(invitedUserId)
      setInviteOpen(false)
      setInviteName('')
      setInviteEmail('')
      setInvitePermissions(emptyInvitePermissions())
      setMessage('Invitation envoyée. Le compte apparaît maintenant dans la liste.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de contacter le serveur d’invitation.')
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-slate-400">
        Chargement des utilisateurs...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--club-yellow)] text-sm font-semibold">
            <ShieldCheck size={18} />
            Super administration
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black">Utilisateurs du CMS</h2>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-3xl">
            Invitez les membres du bureau et choisissez précisément les rubriques qu’ils peuvent gérer.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] transition"
          >
            <RefreshCw size={17} />
            Actualiser
          </button>

          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-4 py-2.5 text-sm font-black text-slate-950 transition hover:brightness-105"
          >
            <UserPlus size={17} />
            Inviter un utilisateur
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5">
            <h3 className="font-bold">Comptes autorisés</h3>
            <p className="mt-1 text-xs text-slate-500">
              {users.length} compte{users.length > 1 ? 's' : ''} CMS
            </p>
          </div>

          <div className="p-2 space-y-1">
            {users.map((user) => {
              const selected = user.user_id === selectedUserId
              return (
                <button
                  type="button"
                  key={user.user_id}
                  onClick={() => setSelectedUserId(user.user_id)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    selected
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <UserRound size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold">
                          {user.display_name || user.email}
                        </p>
                        {!user.active && (
                          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
                            Inactif
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--club-yellow)]">
                        {user.role === 'superadmin' ? 'Superadmin' : 'Administrateur'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
          {!selectedUser ? (
            <div className="p-8 text-center text-slate-400">
              Aucun utilisateur sélectionné.
            </div>
          ) : (
            <>
              <div className="border-b border-white/10 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {selectedUser.display_name || selectedUser.email}
                    </h3>
                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      selectedUser.active
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-red-500/15 text-red-300'
                    }`}>
                      {selectedUser.active ? 'Actif' : 'Inactif'}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                      {selectedUser.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </span>
                  </div>
                  {selectedUser.role === 'admin' && (
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={toggleUserActive}
                        disabled={managingUser}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          selectedUser.active
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
                            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                        }`}
                      >
                        <Power size={15} />
                        {selectedUser.active ? 'Désactiver' : 'Réactiver'}
                      </button>

                      <button
                        type="button"
                        onClick={deleteUser}
                        disabled={managingUser}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selectedUser.role === 'superadmin' ? (
                <div className="p-5 sm:p-6">
                  <div className="rounded-2xl border border-[var(--club-yellow)]/20 bg-[var(--club-yellow)]/5 p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 shrink-0 text-[var(--club-yellow)]" size={21} />
                      <div>
                        <h4 className="font-bold">Compte Superadmin</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Ce compte possède automatiquement tous les droits. Ses permissions ne sont pas modifiables dans cette grille.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 text-left">Rubrique</th>
                          <th className="px-3 py-3 text-center">Voir</th>
                          <th className="px-3 py-3 text-center">Créer</th>
                          <th className="px-3 py-3 text-center">Modifier</th>
                          <th className="px-3 py-3 text-center">Supprimer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {modules.map(({ key, label }) => {
                          const permission = permissions.find((item) => item.module === key)
                          if (!permission) return null

                          return (
                            <tr key={key} className="hover:bg-white/[0.02]">
                              <td className="px-5 py-3.5 font-semibold text-slate-200">{label}</td>
                              {(['can_view', 'can_create', 'can_update', 'can_delete'] as PermissionAction[]).map((action) => {
                                const checked = permission[action]
                                return (
                                  <td key={action} className="px-3 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => togglePermission(key, action)}
                                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                        checked
                                          ? 'border-[var(--club-yellow)]/40 bg-[var(--club-yellow)] text-slate-950'
                                          : 'border-white/10 bg-white/[0.03] text-transparent hover:bg-white/[0.07]'
                                      }`}
                                      aria-label={`${checked ? 'Retirer' : 'Ajouter'} la permission ${action} pour ${label}`}
                                      aria-pressed={checked}
                                    >
                                      <Check size={16} strokeWidth={3} />
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end border-t border-white/10 p-4 sm:p-5">
                    <button
                      type="button"
                      onClick={savePermissions}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-4 py-2.5 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={17} />
                      {saving ? 'Enregistrement...' : 'Enregistrer les droits'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/80 px-3 py-6 backdrop-blur-sm sm:px-6 sm:py-10">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <form onSubmit={inviteUser}>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                <div>
                  <div className="flex items-center gap-2 text-[var(--club-yellow)] text-sm font-semibold">
                    <UserPlus size={18} />
                    Nouvel accès CMS
                  </div>
                  <h3 className="mt-1 text-xl font-black">Inviter un utilisateur</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Il recevra un e-mail pour définir son mot de passe.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeInvite}
                  disabled={inviting}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-4 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-200">Nom affiché</label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(event) => setInviteName(event.target.value)}
                      maxLength={120}
                      required
                      placeholder="Ex. Jean Dupont"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-[var(--club-yellow)]/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-200">Adresse e-mail</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      maxLength={254}
                      required
                      placeholder="membre@exemple.fr"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-[var(--club-yellow)]/50"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">Droits initiaux</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Cocher Créer, Modifier ou Supprimer active automatiquement Voir.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 text-left">Rubrique</th>
                        <th className="px-3 py-3 text-center">Voir</th>
                        <th className="px-3 py-3 text-center">Créer</th>
                        <th className="px-3 py-3 text-center">Modifier</th>
                        <th className="px-3 py-3 text-center">Supprimer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {modules.map(({ key, label }) => {
                        const permission = invitePermissions.find((item) => item.module === key)
                        if (!permission) return null

                        return (
                          <tr key={key}>
                            <td className="px-5 py-3.5 font-semibold text-slate-200">{label}</td>
                            {(['can_view', 'can_create', 'can_update', 'can_delete'] as PermissionAction[]).map((action) => {
                              const checked = permission[action]
                              return (
                                <td key={action} className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleInvitePermission(key, action)}
                                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                      checked
                                        ? 'border-[var(--club-yellow)]/40 bg-[var(--club-yellow)] text-slate-950'
                                        : 'border-white/10 bg-white/[0.03] text-transparent hover:bg-white/[0.07]'
                                    }`}
                                    aria-label={`${checked ? 'Retirer' : 'Ajouter'} la permission ${action} pour ${label}`}
                                    aria-pressed={checked}
                                  >
                                    <Check size={16} strokeWidth={3} />
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closeInvite}
                  disabled={inviting}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.05] disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-4 py-2.5 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus size={17} />
                  {inviting ? 'Envoi...' : "Envoyer l'invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
