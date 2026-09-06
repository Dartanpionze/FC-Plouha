import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
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
    console.error('IMAP PERMISSION ERROR:', permissionError)
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

function normalizeFolder(value: unknown) {
  const folder =
    typeof value === 'string' && value.trim() ? value.trim() : 'INBOX'
  if (folder.length > 250 || /[\r\n\0]/.test(folder)) {
    throw new Error('INVALID_FOLDER')
  }
  return folder
}

function folderLabel(path: string, specialUse?: string | null) {
  if (path.toUpperCase() === 'INBOX') return 'Boîte de réception'
  if (specialUse === '\\Trash') return 'Corbeille'
  if (specialUse === '\\Junk') return 'Indésirables'
  if (specialUse === '\\Sent') return 'Envoyés OVH'
  if (specialUse === '\\Drafts') return 'Brouillons'
  if (specialUse === '\\Archive') return 'Archives OVH'
  return path
}

function createImapClient() {
  const host = process.env.OVH_IMAP_HOST
  const user = process.env.OVH_IMAP_USER
  const pass = process.env.OVH_IMAP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error('IMAP_CONFIG_MISSING')
  }

  return {
    user,
    client: new ImapFlow({
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
    }),
  }
}

function formatAddress(address: any) {
  if (!address) return { name: '', email: '' }

  return {
    name: typeof address.name === 'string' ? address.name : '',
    email:
      typeof address.address === 'string'
        ? address.address.toLowerCase()
        : '',
  }
}

function addressValues(value: any) {
  if (!value) return []

  const objects = Array.isArray(value) ? value : [value]

  return objects.flatMap((object: any) =>
    Array.isArray(object?.value) ? object.value : [],
  )
}

function toIsoString(value: string | Date | undefined | null) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function serializeFlags(flags: Set<string> | undefined) {
  return flags ? Array.from(flags) : []
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

  let imap

  try {
    imap = createImapClient()
  } catch (error: any) {
    if (error?.message === 'IMAP_CONFIG_MISSING') {
      return res.status(500).json({
        error:
          'Configuration IMAP incomplète. Vérifie les variables OVH_IMAP_* dans Vercel.',
      })
    }

    throw error
  }

  const { client, user } = imap

  try {
    await client.connect()

    const uidParam =
      typeof req.query?.uid === 'string' ? Number(req.query.uid) : null

    const requestedFolder = normalizeFolder(req.query?.folder)
    const mailboxes = await client.list()
    const selectedMailbox = mailboxes.find(
      (mailbox) => mailbox.path === requestedFolder,
    )

    if (!selectedMailbox) {
      return res.status(404).json({
        success: false,
        error: 'Dossier OVH introuvable.',
      })
    }

    const folders = mailboxes
      .filter((mailbox) => mailbox.selectable !== false)
      .map((mailbox) => ({
        path: mailbox.path,
        name: mailbox.name,
        label: folderLabel(mailbox.path, mailbox.specialUse),
        specialUse: mailbox.specialUse ?? null,
      }))

    const lock = await client.getMailboxLock(requestedFolder, { readOnly: true })

    try {
      if (uidParam && Number.isInteger(uidParam) && uidParam > 0) {
        const message = await client.fetchOne(
          uidParam,
          {
            uid: true,
            envelope: true,
            flags: true,
            internalDate: true,
            size: true,
            source: true,
          },
          { uid: true },
        )

        if (!message || !message.source) {
          return res.status(404).json({ error: 'E-mail introuvable dans la boîte OVH.' })
        }

        const parsed = await simpleParser(message.source)
        const sender = formatAddress(addressValues(parsed.from)[0])
        const recipients = addressValues(parsed.to).map(formatAddress)
        const cc = addressValues(parsed.cc).map(formatAddress)

        let bodyText =
          typeof parsed.text === 'string' ? parsed.text.trim() : ''

        if (!bodyText && typeof parsed.html === 'string') {
          bodyText = stripHtml(parsed.html)
        }

        return res.status(200).json({
          success: true,
          folder: requestedFolder,
          folders,
          message: {
            uid: message.uid,
            subject: parsed.subject || message.envelope?.subject || '(Sans objet)',
            from: sender,
            to: recipients,
            cc,
            date:
              toIsoString(parsed.date) ||
              toIsoString(message.internalDate) ||
              new Date().toISOString(),
            messageId: parsed.messageId || message.envelope?.messageId || null,
            inReplyTo: parsed.inReplyTo || message.envelope?.inReplyTo || null,
            flags: serializeFlags(message.flags),
            seen: Boolean(message.flags?.has('\\Seen')),
            size: message.size || 0,
            text: bodyText || '(Message sans contenu texte lisible.)',
            attachments: parsed.attachments.map((attachment) => ({
              filename: attachment.filename || 'pièce-jointe',
              contentType: attachment.contentType || 'application/octet-stream',
              size: attachment.size || attachment.content?.length || 0,
            })),
          },
          readOnly: true,
        })
      }

      const exists = client.mailbox ? client.mailbox.exists : 0

      if (exists === 0) {
        return res.status(200).json({
          success: true,
          account: user,
          folder: requestedFolder,
          folders,
          messages: [],
          total: 0,
          unread: 0,
          readOnly: true,
        })
      }

      const startSequence = Math.max(1, exists - 99)
      const fetched = await client.fetchAll(
        `${startSequence}:*`,
        {
          uid: true,
          envelope: true,
          flags: true,
          internalDate: true,
          size: true,
        },
      )

      const status = await client.status(requestedFolder, {
        messages: true,
        unseen: true,
      })

      const messages = fetched
        .map((message) => {
          const sender = formatAddress(message.envelope?.from?.[0])

          return {
            uid: message.uid,
            subject: message.envelope?.subject || '(Sans objet)',
            from: sender,
            date:
              toIsoString(message.internalDate) ||
              toIsoString(message.envelope?.date) ||
              new Date().toISOString(),
            messageId: message.envelope?.messageId || null,
            inReplyTo: message.envelope?.inReplyTo || null,
            flags: serializeFlags(message.flags),
            seen: Boolean(message.flags?.has('\\Seen')),
            size: message.size || 0,
          }
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return res.status(200).json({
        success: true,
        account: user,
        folder: requestedFolder,
        folders,
        messages,
        total: status.messages ?? messages.length,
        unread: status.unseen ?? messages.filter((message) => !message.seen).length,
        readOnly: true,
      })
    } finally {
      lock.release()
    }
  } catch (error: any) {
    console.error('OVH IMAP INBOX ERROR:', {
      name: error?.name,
      code: error?.code,
      responseCode: error?.responseCode,
      message: error?.message,
    })

    return res.status(502).json({
      success: false,
      error:
        "Impossible de lire la boîte de réception OVH. L'envoi depuis le CMS reste disponible.",
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
