import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { createClient } from '@supabase/supabase-js'

function getBearerToken(req: any) {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

async function requireEmailView(req: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    return { ok: false as const, status: 500, error: 'Configuration serveur incomplète.' }
  }

  const token = getBearerToken(req)
  if (!token) {
    return { ok: false as const, status: 401, error: 'Session administrateur requise.' }
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const { data: authData, error: authError } = await adminClient.auth.getUser(token)

  if (authError || !authData.user) {
    return { ok: false as const, status: 401, error: 'Session invalide ou expirée.' }
  }

  const callerId = authData.user.id

  const { data: caller } = await adminClient
    .from('admin_users')
    .select('role, active')
    .eq('user_id', callerId)
    .maybeSingle()

  if (!caller || caller.active !== true) {
    return { ok: false as const, status: 403, error: 'Accès administrateur refusé.' }
  }

  if (caller.role === 'superadmin') {
    return { ok: true as const }
  }

  const { data: permission } = await adminClient
    .from('admin_permissions')
    .select('can_view')
    .eq('user_id', callerId)
    .eq('module', 'emails')
    .maybeSingle()

  if (permission?.can_view !== true) {
    return {
      ok: false as const,
      status: 403,
      error: "Vous n'avez pas le droit de consulter les e-mails.",
    }
  }

  return { ok: true as const }
}

function createImapClient() {
  const host = process.env.OVH_IMAP_HOST
  const user = process.env.OVH_IMAP_USER
  const pass = process.env.OVH_IMAP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error('IMAP_CONFIG_MISSING')
  }

  return new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 25000,
  })
}

function safeFilename(value: string) {
  return value.replace(/[\r\n"]/g, '_').slice(0, 180) || 'piece-jointe'
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const access = await requireEmailView(req)

  if (!access.ok) {
    return res.status(access.status).json({ error: access.error })
  }

  const uid = Number(req.query?.uid)
  const index = Number(req.query?.index)

  if (!Number.isInteger(uid) || uid <= 0 || !Number.isInteger(index) || index < 0) {
    return res.status(400).json({ error: 'Paramètres de pièce jointe invalides.' })
  }

  let client: ImapFlow

  try {
    client = createImapClient()
  } catch {
    return res.status(500).json({ error: 'Configuration IMAP OVH incomplète.' })
  }

  try {
    await client.connect()

    const lock = await client.getMailboxLock('INBOX', { readOnly: true })

    try {
      const message = await client.fetchOne(
        uid,
        { source: true, uid: true },
        { uid: true },
      )

      if (message === false || !message.source) {
        return res.status(404).json({ error: 'E-mail introuvable.' })
      }

      const parsed = await simpleParser(message.source)
      const attachment = parsed.attachments[index]

      if (!attachment) {
        return res.status(404).json({ error: 'Pièce jointe introuvable.' })
      }

      const filename = safeFilename(attachment.filename || `piece-jointe-${index + 1}`)

      res.setHeader(
        'Content-Type',
        attachment.contentType || 'application/octet-stream',
      )
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      )
      res.setHeader('Cache-Control', 'private, no-store')

      return res.status(200).send(attachment.content)
    } finally {
      lock.release()
    }
  } catch (error: any) {
    console.error('OVH IMAP ATTACHMENT ERROR:', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    })

    return res.status(502).json({
      error: 'Impossible de télécharger cette pièce jointe.',
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
        // Connexion déjà fermée.
      }
    }
  }
}
