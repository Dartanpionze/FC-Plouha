import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'

type RequiredPermission = 'update' | 'delete'

function getBearerToken(req: any) {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

async function requireEmailPermission(
  req: any,
  requiredPermission: RequiredPermission,
) {
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
    .select('can_update, can_delete')
    .eq('user_id', callerId)
    .eq('module', 'emails')
    .maybeSingle()

  if (permissionError) {
    console.error('IMAP ACTION PERMISSION ERROR:', permissionError)
    return {
      ok: false as const,
      status: 500,
      error: "Impossible de vérifier les droits d'accès aux e-mails.",
    }
  }

  const allowed =
    requiredPermission === 'update'
      ? permission?.can_update === true
      : permission?.can_delete === true

  if (!allowed) {
    return {
      ok: false as const,
      status: 403,
      error:
        requiredPermission === 'delete'
          ? "Vous n'avez pas le droit de supprimer les e-mails."
          : "Vous n'avez pas le droit de modifier les e-mails.",
    }
  }

  return { ok: true as const }
}

function normalizeFolder(value: unknown) {
  const folder =
    typeof value === 'string' && value.trim() ? value.trim() : 'INBOX'
  if (folder.length > 250 || /[\r\n\0]/.test(folder)) throw new Error('INVALID_FOLDER')
  return folder
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
    auth: {
      user,
      pass,
    },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 25000,
  })
}

async function findTrashMailbox(client: ImapFlow) {
  const mailboxes = await client.list()

  const specialTrash = mailboxes.find(
    (mailbox) => mailbox.specialUse === '\\Trash',
  )

  if (specialTrash) return specialTrash.path

  const fallback = mailboxes.find((mailbox) => {
    const value = `${mailbox.path} ${mailbox.name}`.toLowerCase()
    return (
      value.includes('trash') ||
      value.includes('corbeille') ||
      value.includes('deleted')
    )
  })

  return fallback?.path ?? null
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const action = String(req.body?.action || '')
  const uid = Number(req.body?.uid)
  const folder = normalizeFolder(req.body?.folder)

  if (!Number.isInteger(uid) || uid <= 0) {
    return res.status(400).json({ error: "UID d'e-mail invalide." })
  }

  const isDeleteAction = action === 'trash' || action === 'delete_forever'
  const requiredPermission: RequiredPermission = isDeleteAction
    ? 'delete'
    : 'update'

  if (!['mark_read', 'mark_unread', 'trash', 'delete_forever'].includes(action)) {
    return res.status(400).json({ error: 'Action IMAP inconnue.' })
  }

  const access = await requireEmailPermission(req, requiredPermission)

  if (!access.ok) {
    return res.status(access.status).json({ error: access.error })
  }

  let client: ImapFlow

  try {
    client = createImapClient()
  } catch (error: any) {
    if (error?.message === 'IMAP_CONFIG_MISSING') {
      return res.status(500).json({
        error: 'Configuration IMAP OVH incomplète.',
      })
    }

    throw error
  }

  try {
    await client.connect()

    const lock = await client.getMailboxLock(folder)

    try {
      if (action === 'mark_read') {
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })

        return res.status(200).json({
          success: true,
          message: 'E-mail marqué comme lu.',
        })
      }

      if (action === 'mark_unread') {
        await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true })

        return res.status(200).json({
          success: true,
          message: 'E-mail marqué comme non lu.',
        })
      }

      if (action === 'delete_forever') {
        const mailboxes = await client.list()
        const currentMailbox = mailboxes.find((mailbox) => mailbox.path === folder)
        const isTrash =
          currentMailbox?.specialUse === '\\Trash' ||
          /trash|corbeille|deleted/i.test(
            `${currentMailbox?.path ?? ''} ${currentMailbox?.name ?? ''}`,
          )

        if (!isTrash) {
          return res.status(400).json({
            success: false,
            error: 'La suppression définitive est autorisée uniquement depuis la Corbeille.',
          })
        }

        await client.messageDelete(uid, { uid: true })
        return res.status(200).json({
          success: true,
          message: 'E-mail supprimé définitivement de la boîte OVH.',
        })
      }

      const trashMailbox = await findTrashMailbox(client)

      if (trashMailbox && trashMailbox !== folder) {
        await client.messageMove(uid, trashMailbox, { uid: true })

        return res.status(200).json({
          success: true,
          message: 'E-mail déplacé dans la corbeille OVH.',
          trashMailbox,
        })
      }

      // Fallback only if the server exposes no Trash folder at all.
      await client.messageDelete(uid, { uid: true })

      return res.status(200).json({
        success: true,
        message:
          "Aucun dossier Corbeille n'a été détecté : l'e-mail a été supprimé via IMAP.",
      })
    } finally {
      lock.release()
    }
  } catch (error: any) {
    console.error('OVH IMAP ACTION ERROR:', {
      name: error?.name,
      code: error?.code,
      responseCode: error?.responseCode,
      message: error?.message,
    })

    return res.status(502).json({
      success: false,
      error: "Impossible d'appliquer cette action à la boîte OVH.",
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
