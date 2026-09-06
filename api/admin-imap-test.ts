import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'

function getBearerToken(req: any) {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

async function requireEmailAdmin(req: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    return {
      ok: false as const,
      status: 500,
      error: 'Configuration Supabase serveur incomplète.',
    }
  }

  const accessToken = getBearerToken(req)

  if (!accessToken) {
    return {
      ok: false as const,
      status: 401,
      error: 'Session administrateur requise.',
    }
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const { data: authData, error: authError } =
    await adminClient.auth.getUser(accessToken)

  if (authError || !authData.user) {
    return {
      ok: false as const,
      status: 401,
      error: 'Session invalide ou expirée.',
    }
  }

  const callerId = authData.user.id

  const { data: caller, error: callerError } = await adminClient
    .from('admin_users')
    .select('role, active')
    .eq('user_id', callerId)
    .maybeSingle()

  if (callerError || !caller || caller.active !== true) {
    return {
      ok: false as const,
      status: 403,
      error: 'Accès administrateur refusé.',
    }
  }

  if (caller.role === 'superadmin') {
    return { ok: true as const }
  }

  const { data: permission, error: permissionError } = await adminClient
    .from('admin_permissions')
    .select('can_view')
    .eq('user_id', callerId)
    .eq('module', 'emails')
    .maybeSingle()

  if (permissionError) {
    console.error('IMAP TEST PERMISSION ERROR:', permissionError)

    return {
      ok: false as const,
      status: 500,
      error: "Impossible de vérifier le droit d'accès aux e-mails.",
    }
  }

  if (permission?.can_view !== true) {
    return {
      ok: false as const,
      status: 403,
      error: "Vous n'avez pas le droit de consulter les e-mails.",
    }
  }

  return { ok: true as const }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const adminAccess = await requireEmailAdmin(req)

  if (!adminAccess.ok) {
    return res.status(adminAccess.status).json({ error: adminAccess.error })
  }

  const host = process.env.OVH_IMAP_HOST
  const user = process.env.OVH_IMAP_USER
  const pass = process.env.OVH_IMAP_PASSWORD

  if (!host || !user || !pass) {
    return res.status(500).json({
      error:
        'Configuration IMAP incomplète. Vérifie OVH_IMAP_HOST, OVH_IMAP_USER et OVH_IMAP_PASSWORD dans Vercel.',
    })
  }

  const client = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: {
      user,
      pass,
    },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  })

  try {
    await client.connect()

    const mailboxes = await client.list()

    const inboxStatus = await client.status('INBOX', {
      messages: true,
      unseen: true,
      uidNext: true,
      uidValidity: true,
    })

    return res.status(200).json({
      success: true,
      message: 'Connexion IMAP OVH réussie.',
      account: user,
      server: host,
      inbox: {
        messages: inboxStatus.messages ?? 0,
        unread: inboxStatus.unseen ?? 0,
      },
      folders: mailboxes.map((mailbox) => ({
        path: mailbox.path,
        name: mailbox.name,
        specialUse: mailbox.specialUse ?? null,
      })),
      readOnlyTest: true,
    })
  } catch (error: any) {
    console.error('OVH IMAP TEST ERROR:', {
      name: error?.name,
      code: error?.code,
      responseCode: error?.responseCode,
      message: error?.message,
    })

    const code = String(error?.code || '')
    const responseCode = String(error?.responseCode || '')
    const message = String(error?.message || '')

    let publicMessage =
      "Impossible de se connecter à la boîte OVH en IMAP."

    if (
      code === 'EAUTH' ||
      responseCode.toUpperCase().includes('AUTH') ||
      message.toLowerCase().includes('authentication') ||
      message.toLowerCase().includes('login')
    ) {
      publicMessage =
        "OVH a refusé l'authentification IMAP. Vérifie l'adresse e-mail et le mot de passe enregistrés dans Vercel."
    } else if (
      code === 'ETIMEDOUT' ||
      code === 'ESOCKET' ||
      message.toLowerCase().includes('timeout')
    ) {
      publicMessage =
        "La connexion au serveur IMAP OVH a expiré. Les identifiants n'ont pas été modifiés."
    }

    return res.status(502).json({
      success: false,
      error: publicMessage,
    })
  } finally {
    try {
      if (client.usable) {
        await client.logout()
      } else {
        client.close()
      }
    } catch {
      try {
        client.close()
      } catch {
        // Rien à faire : la connexion est déjà fermée.
      }
    }
  }
}
