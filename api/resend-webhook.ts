import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const INBOUND_ADDRESS = 'contact@fslodo.resend.app'

function getHeader(req: any, name: string) {
  const value = req.headers?.[name]
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
}

function verifySvixSignature(
  payload: string,
  id: string,
  timestamp: string,
  signatureHeader: string,
  secret: string,
) {
  if (!id || !timestamp || !signatureHeader || !secret.startsWith('whsec_')) {
    return false
  }

  const timestampNumber = Number(timestamp)
  if (!Number.isFinite(timestampNumber)) return false

  // Reject requests older than 5 minutes to limit replay attacks.
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestampNumber) > 300) return false

  let secretBytes: Buffer
  try {
    secretBytes = Buffer.from(secret.slice('whsec_'.length), 'base64')
  } catch {
    return false
  }

  const signedContent = `${id}.${timestamp}.${payload}`
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  const signatures = signatureHeader
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const commaIndex = part.indexOf(',')
      return commaIndex >= 0 ? part.slice(commaIndex + 1) : part
    })

  return signatures.some((signature) => {
    try {
      const actualBuffer = Buffer.from(signature)
      const expectedBuffer = Buffer.from(expected)
      return (
        actualBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(actualBuffer, expectedBuffer)
      )
    } catch {
      return false
    }
  })
}

async function readRawBody(req: any) {
  if (typeof req.body === 'string') return req.body

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8')
  }

  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString('utf8')
}

function parseMailbox(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^(?:"?([^"<]+)"?\s*)?<([^>]+)>$/)

  if (match) {
    return {
      name: (match[1] || '').trim(),
      email: (match[2] || '').trim().toLowerCase(),
    }
  }

  return {
    name: '',
    email: trimmed.toLowerCase(),
  }
}

function normalizeSubject(value: string) {
  return value
    .replace(/^(\s*(re|fw|fwd)\s*:\s*)+/gi, '')
    .trim()
    .toLowerCase()
}

function extractReferenceIds(value: unknown) {
  if (typeof value !== 'string') return []
  return value.match(/<[^>]+>/g) ?? []
}

async function fetchReceivedEmail(emailId: string, apiKey: string) {
  const response = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  )

  const data = await response.json().catch(() => null)

  if (!response.ok || !data) {
    throw new Error(
      data?.message || `Impossible de récupérer l'e-mail reçu (${response.status}).`,
    )
  }

  return data
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  if (!supabaseUrl || !secretKey || !resendApiKey || !webhookSecret) {
    console.error('Missing inbound email configuration')
    return res.status(500).json({ error: 'Inbound email configuration incomplete' })
  }

  try {
    const payload = await readRawBody(req)
    const svixId = getHeader(req, 'svix-id')
    const svixTimestamp = getHeader(req, 'svix-timestamp')
    const svixSignature = getHeader(req, 'svix-signature')

    if (
      !verifySvixSignature(
        payload,
        svixId,
        svixTimestamp,
        svixSignature,
        webhookSecret,
      )
    ) {
      return res.status(401).json({ error: 'Invalid webhook signature' })
    }

    const event = JSON.parse(payload)

    if (event?.type !== 'email.received') {
      return res.status(200).json({ received: true, ignored: true })
    }

    const emailId =
      typeof event?.data?.email_id === 'string' ? event.data.email_id : ''

    if (!emailId) {
      return res.status(400).json({ error: 'Missing email_id' })
    }

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Idempotency: Resend may retry webhook deliveries.
    const { data: existingMessage, error: existingError } = await adminClient
      .from('email_messages')
      .select('id')
      .eq('provider', 'resend')
      .eq('provider_email_id', emailId)
      .maybeSingle()

    if (existingError) {
      console.error('INBOUND IDEMPOTENCY LOOKUP ERROR:', existingError)
      return res.status(500).json({ error: 'Database lookup failed' })
    }

    if (existingMessage) {
      return res.status(200).json({ received: true, duplicate: true })
    }

    const email = await fetchReceivedEmail(emailId, resendApiKey)

    const sender = parseMailbox(String(email.from || event.data.from || ''))
    if (!sender.email) {
      return res.status(400).json({ error: 'Sender address missing' })
    }

    const subject = String(email.subject || event.data.subject || '(Sans objet)')
      .trim()
      .slice(0, 500)

    const headers =
      email.headers && typeof email.headers === 'object' ? email.headers : {}

    const inReplyTo =
      typeof headers['in-reply-to'] === 'string' ? headers['in-reply-to'] : ''

    const referencesHeader =
      typeof headers.references === 'string' ? headers.references : ''

    const referenceIds = Array.from(
      new Set([
        ...extractReferenceIds(inReplyTo),
        ...extractReferenceIds(referencesHeader),
      ]),
    )

    let threadId = ''

    // Best match: In-Reply-To / References -> exact Message-ID of an outbound message.
    if (referenceIds.length > 0) {
      const { data: referencedMessages, error: referenceError } = await adminClient
        .from('email_messages')
        .select('thread_id, message_id, created_at')
        .in('message_id', referenceIds)
        .order('created_at', { ascending: false })
        .limit(1)

      if (referenceError) {
        console.error('INBOUND REFERENCE LOOKUP ERROR:', referenceError)
      } else if (referencedMessages?.[0]?.thread_id) {
        threadId = referencedMessages[0].thread_id
      }
    }

    // Fallback: same correspondent + same normalized subject.
    if (!threadId) {
      const { data: candidateThreads, error: candidateError } = await adminClient
        .from('email_threads')
        .select('id, subject, last_message_at')
        .ilike('contact_email', sender.email)
        .order('last_message_at', { ascending: false })
        .limit(20)

      if (candidateError) {
        console.error('INBOUND THREAD FALLBACK ERROR:', candidateError)
      } else {
        const normalizedIncomingSubject = normalizeSubject(subject)
        const subjectMatch = (candidateThreads ?? []).find(
          (thread: { subject: string }) =>
            normalizeSubject(thread.subject || '') === normalizedIncomingSubject,
        )

        threadId = subjectMatch?.id || candidateThreads?.[0]?.id || ''
      }
    }

    const now = new Date().toISOString()
    const receivedAt =
      typeof email.created_at === 'string'
        ? email.created_at
        : typeof event.data.created_at === 'string'
          ? event.data.created_at
          : now

    if (!threadId) {
      const { data: newThread, error: threadError } = await adminClient
        .from('email_threads')
        .insert({
          subject,
          contact_email: sender.email,
          contact_name: sender.name || null,
          last_message_at: receivedAt,
          unread_count: 1,
          archived: false,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single()

      if (threadError || !newThread) {
        console.error('INBOUND THREAD CREATE ERROR:', threadError)
        return res.status(500).json({ error: 'Unable to create email thread' })
      }

      threadId = newThread.id
    } else {
      const { data: currentThread, error: currentThreadError } = await adminClient
        .from('email_threads')
        .select('unread_count')
        .eq('id', threadId)
        .single()

      if (currentThreadError) {
        console.error('INBOUND THREAD READ ERROR:', currentThreadError)
      }

      const nextUnread = Math.max(0, Number(currentThread?.unread_count || 0)) + 1

      const { error: updateThreadError } = await adminClient
        .from('email_threads')
        .update({
          subject,
          contact_email: sender.email,
          contact_name: sender.name || null,
          last_message_at: receivedAt,
          unread_count: nextUnread,
          archived: false,
          updated_at: now,
        })
        .eq('id', threadId)

      if (updateThreadError) {
        console.error('INBOUND THREAD UPDATE ERROR:', updateThreadError)
      }
    }

    const destination =
      Array.isArray(email.to) && email.to.length > 0
        ? String(email.to[0])
        : INBOUND_ADDRESS

    const { error: messageError } = await adminClient
      .from('email_messages')
      .insert({
        thread_id: threadId,
        direction: 'inbound',
        from_email: sender.email,
        to_email: destination,
        subject,
        body_text:
          typeof email.text === 'string' && email.text.trim()
            ? email.text
            : '(Cet e-mail ne contient pas de version texte.)',
        body_html: typeof email.html === 'string' ? email.html : null,
        provider: 'resend',
        provider_email_id: emailId,
        message_id:
          typeof email.message_id === 'string'
            ? email.message_id
            : typeof event.data.message_id === 'string'
              ? event.data.message_id
              : null,
        in_reply_to: inReplyTo || null,
        references_header: referencesHeader || null,
        status: 'received',
        read_at: null,
        received_at: receivedAt,
        created_at: now,
      })

    if (messageError) {
      // A duplicate provider_email_id means a concurrent webhook attempt won the race.
      if (messageError.code === '23505') {
        return res.status(200).json({ received: true, duplicate: true })
      }

      console.error('INBOUND MESSAGE INSERT ERROR:', messageError)
      return res.status(500).json({ error: 'Unable to store received email' })
    }

    return res.status(200).json({
      received: true,
      stored: true,
      thread_id: threadId,
    })
  } catch (error) {
    console.error('RESEND WEBHOOK ERROR:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
