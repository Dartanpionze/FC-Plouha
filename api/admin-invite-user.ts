import { createClient } from '@supabase/supabase-js'

const FROM_EMAIL = 'FC Plouha <contact@fcplouha.fr>'

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; error?: string; retryAfter?: number }

async function checkAdminRateLimit(
  adminClient: any,
  userId: string,
  action: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMs).toISOString()

  const { count, error: countError } = await adminClient
    .from('admin_api_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart)

  if (countError) {
    console.error('ADMIN RATE LIMIT READ ERROR:', countError)
    return { allowed: false, error: 'Impossible de vérifier la limite de sécurité.' }
  }

  if ((count ?? 0) >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) }
  }

  const { error: insertError } = await adminClient
    .from('admin_api_attempts')
    .insert({ user_id: userId, action })

  if (insertError) {
    console.error('ADMIN RATE LIMIT WRITE ERROR:', insertError)
    return { allowed: false, error: 'Impossible d’appliquer la limite de sécurité.' }
  }

  return { allowed: true }
}

function sendRateLimitError(
  res: any,
  result: Exclude<RateLimitResult, { allowed: true }>,
  publicMessage: string,
) {
  res.setHeader('Cache-Control', 'no-store')

  if (result.retryAfter) {
    res.setHeader('Retry-After', String(result.retryAfter))
    return res.status(429).json({ error: publicMessage })
  }

  return res.status(500).json({
    error: result.error || 'Vérification de sécurité indisponible.',
  })
}

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
  'emails',
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
  const resendApiKey = process.env.RESEND_API_KEY

  if (!supabaseUrl || !secretKey || !resendApiKey) {
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

    const rateLimit = await checkAdminRateLimit(
      adminClient,
      authData.user.id,
      'invite_user',
      5,
      60 * 60 * 1000,
    )

    if (!rateLimit.allowed) {
      return sendRateLimitError(
        res,
        rateLimit,
        'Trop d’invitations ont été envoyées. Réessayez dans une heure.',
      )
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
      await adminClient.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          data: { display_name: displayName },
          redirectTo: 'https://fcplouha.fr/admin/accept-invite',
        },
      })

    const hashedToken = inviteData?.properties?.hashed_token

    if (inviteError || !inviteData?.user || !hashedToken) {
      console.error('SUPABASE INVITE ERROR:', inviteError)
      return res.status(400).json({
        error: inviteError?.message?.toLowerCase().includes('already')
          ? 'Cette adresse possède déjà un compte Supabase Auth.'
          : "L'invitation n'a pas pu être envoyée.",
      })
    }

    const invitedUserId = inviteData.user.id
    const invitationUrl =
      `https://fcplouha.fr/admin/accept-invite` +
      `#token_hash=${encodeURIComponent(hashedToken)}&type=invite`

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

    const safeDisplayName = escapeHtml(displayName)
    const safeInvitationUrl = escapeHtml(invitationUrl)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        reply_to: 'contact@fcplouha.fr',
        subject: 'Invitation au CMS du FC Plouha',
        html: `
          <div style="margin:0;padding:32px 16px;background:#f4f6f8;font-family:Arial,sans-serif;color:#071d39">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 24px rgba(7,29,57,.08)">
              <h1 style="margin:0 0 20px;font-size:26px;color:#071d39">Bienvenue dans le CMS du FC Plouha</h1>
              <p style="margin:0 0 16px;line-height:1.6">Bonjour ${safeDisplayName},</p>
              <p style="margin:0 0 24px;line-height:1.6">Vous avez été invité(e) à rejoindre l’espace d’administration du Football Club Plouha.</p>
              <p style="margin:0 0 28px;text-align:center">
                <a href="${safeInvitationUrl}" style="display:inline-block;background:#facc15;color:#071d39;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px">Activer mon compte</a>
              </p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#64748b">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :</p>
              <p style="margin:0;overflow-wrap:anywhere;font-size:12px;line-height:1.5;color:#475569">${safeInvitationUrl}</p>
              <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94a3b8">Si vous n’attendiez pas cette invitation, vous pouvez ignorer cet e-mail.</p>
            </div>
          </div>
        `,
        text: `Bonjour ${displayName},\n\nVous avez été invité(e) à rejoindre le CMS du FC Plouha.\n\nActivez votre compte : ${invitationUrl}\n\nSi vous n’attendiez pas cette invitation, ignorez cet e-mail.`,
      }),
    })

    const emailResult = await emailResponse.json().catch(() => null)

    if (!emailResponse.ok || !emailResult?.id) {
      console.error('ADMIN INVITE EMAIL ERROR:', emailResult)
      await adminClient
        .from('admin_permissions')
        .delete()
        .eq('user_id', invitedUserId)
      await adminClient.from('admin_users').delete().eq('user_id', invitedUserId)
      await adminClient.auth.admin.deleteUser(invitedUserId).catch(() => undefined)

      return res.status(502).json({
        error: "Le compte n'a pas été créé car l'e-mail d'invitation n'a pas pu être envoyé.",
      })
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
