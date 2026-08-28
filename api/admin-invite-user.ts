import { createClient } from '@supabase/supabase-js'

const modules = [
  'news',
  'club',
  'teams',
  'players',
  'matches',
  'gallery',
  'partners',
  'registrations',
  'settings',
] as const

type ModuleName = (typeof modules)[number]

type PermissionInput = {
  module?: unknown
  can_view?: unknown
  can_create?: unknown
  can_update?: unknown
  can_delete?: unknown
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value.replace(/\0/g, '').trim().slice(0, maxLength)
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getBearerToken(req: any) {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

function normalizePermissions(value: unknown) {
  const raw = Array.isArray(value) ? (value as PermissionInput[]) : []
  const byModule = new Map<string, PermissionInput>()

  for (const permission of raw) {
    if (typeof permission?.module === 'string') {
      byModule.set(permission.module, permission)
    }
  }

  return modules.map((module: ModuleName) => {
    const permission = byModule.get(module)
    const canCreate = permission?.can_create === true
    const canUpdate = permission?.can_update === true
    const canDelete = permission?.can_delete === true
    const canView =
      permission?.can_view === true || canCreate || canUpdate || canDelete

    return {
      module,
      can_view: canView,
      can_create: canCreate,
      can_update: canUpdate,
      can_delete: canDelete,
    }
  })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    console.error('Missing Supabase server configuration')
    return res.status(500).json({ error: 'Configuration serveur invalide.' })
  }

  const accessToken = getBearerToken(req)
  if (!accessToken) {
    return res.status(401).json({ error: 'Session administrateur requise.' })
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  try {
    const { data: authData, error: authError } =
      await adminClient.auth.getUser(accessToken)

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Session invalide ou expirée.' })
    }

    const { data: caller, error: callerError } = await adminClient
      .from('admin_users')
      .select('role, active')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (
      callerError ||
      !caller ||
      caller.role !== 'superadmin' ||
      caller.active !== true
    ) {
      return res.status(403).json({ error: 'Accès réservé au Superadmin.' })
    }

    const displayName = cleanText(req.body?.display_name, 120)
    const email = cleanText(req.body?.email, 254).toLowerCase()
    const permissions = normalizePermissions(req.body?.permissions)

    if (!displayName || !email) {
      return res.status(400).json({ error: 'Le nom et l’adresse e-mail sont obligatoires.' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Adresse e-mail invalide.' })
    }

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('admin_users')
      .select('user_id')
      .ilike('email', email)
      .maybeSingle()

    if (existingProfileError) {
      console.error('ADMIN USERS LOOKUP ERROR:', existingProfileError)
      return res.status(500).json({ error: 'Impossible de vérifier ce compte.' })
    }

    if (existingProfile) {
      return res.status(409).json({ error: 'Un compte CMS utilise déjà cette adresse e-mail.' })
    }

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName },
        redirectTo: 'https://fc-plouha.vercel.app/admin/accept-invite',
      })

    if (inviteError || !inviteData.user) {
      console.error('SUPABASE INVITE ERROR:', inviteError)
      return res.status(400).json({
        error: inviteError?.message?.toLowerCase().includes('already')
          ? 'Cette adresse possède déjà un compte Supabase Auth.'
          : "L'invitation n'a pas pu être envoyée.",
      })
    }

    const invitedUserId = inviteData.user.id

    const { error: profileError } = await adminClient
      .from('admin_users')
      .insert({
        user_id: invitedUserId,
        display_name: displayName,
        email,
        role: 'admin',
        active: true,
      })

    if (profileError) {
      console.error('ADMIN PROFILE CREATE ERROR:', profileError)
      await adminClient.auth.admin.deleteUser(invitedUserId).catch(() => undefined)
      return res.status(500).json({ error: 'Impossible de créer le profil CMS.' })
    }

    const permissionRows = permissions.map((permission) => ({
      user_id: invitedUserId,
      ...permission,
    }))

    const { error: permissionsError } = await adminClient
      .from('admin_permissions')
      .insert(permissionRows)

    if (permissionsError) {
      console.error('ADMIN PERMISSIONS CREATE ERROR:', permissionsError)
      await adminClient.from('admin_users').delete().eq('user_id', invitedUserId)
      await adminClient.auth.admin.deleteUser(invitedUserId).catch(() => undefined)
      return res.status(500).json({ error: 'Impossible de créer les permissions du compte.' })
    }

    return res.status(200).json({
      success: true,
      user_id: invitedUserId,
    })
  } catch (error) {
    console.error('ADMIN INVITE API ERROR:', error)
    return res.status(500).json({ error: 'Erreur serveur.' })
  }
}
