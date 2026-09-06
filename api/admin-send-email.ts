import { createClient } from '@supabase/supabase-js'

const FROM_EMAIL = 'FC Plouha <contact@fcplouha.fr>'
const REPLY_TO_EMAIL = 'contact@fcplouha.fr'

function getBearerToken(req: any) {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
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
    console.error('Missing server email configuration')
    return res.status(500).json({
      error: "La configuration d'envoi du serveur est incomplète.",
    })
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

    const callerId = authData.user.id

    const { data: caller, error: callerError } = await adminClient
      .from('admin_users')
      .select('role, active')
      .eq('user_id', callerId)
      .maybeSingle()

    if (callerError || !caller || caller.active !== true) {
      return res.status(403).json({ error: 'Accès administrateur refusé.' })
    }

    let canSend = caller.role === 'superadmin'

    if (!canSend) {
      const { data: permission, error: permissionError } = await adminClient
        .from('admin_permissions')
        .select('can_create')
        .eq('user_id', callerId)
        .eq('module', 'emails')
        .maybeSingle()

      if (permissionError) {
        console.error('EMAIL PERMISSION ERROR:', permissionError)
        return res.status(500).json({
          error: "Impossible de vérifier le droit d'envoi.",
        })
      }

      canSend = permission?.can_create === true
    }

    if (!canSend) {
      return res.status(403).json({
        error: "Vous n'avez pas le droit d'envoyer des e-mails.",
      })
    }

    const requestedThreadId = cleanText(req.body?.thread_id, 64)
    const requestedTo = cleanText(req.body?.to, 320).toLowerCase()
    const requestedName = cleanText(req.body?.contact_name, 160)
    const requestedSubject = cleanText(req.body?.subject, 200)
    const requestedBody = cleanText(req.body?.body, 20000)

    const registrationValue = req.body?.registration_id
    const registrationId =
      typeof registrationValue === 'number' &&
      Number.isInteger(registrationValue) &&
      registrationValue > 0
        ? registrationValue
        : null

    if (!requestedSubject) {
      return res.status(400).json({ error: "L'objet de l'e-mail est obligatoire." })
    }

    if (!requestedBody) {
      return res.status(400).json({ error: 'Le message est vide.' })
    }

    let threadId = ''
    let recipient = requestedTo
    let contactName = requestedName
    let threadRegistrationId = registrationId

    if (requestedThreadId) {
      if (!isUuid(requestedThreadId)) {
        return res.status(400).json({ error: 'Conversation invalide.' })
      }

      const { data: existingThread, error: threadError } = await adminClient
        .from('email_threads')
        .select('id, contact_email, contact_name, registration_id')
        .eq('id', requestedThreadId)
        .maybeSingle()

      if (threadError) {
        console.error('EMAIL THREAD LOOKUP ERROR:', threadError)
        return res.status(500).json({
          error: 'Impossible de retrouver cette conversation.',
        })
      }

      if (!existingThread) {
        return res.status(404).json({ error: 'Conversation introuvable.' })
      }

      threadId = existingThread.id
      recipient = existingThread.contact_email
      contactName = existingThread.contact_name || requestedName
      threadRegistrationId = existingThread.registration_id || registrationId
    }

    if (!isEmail(recipient)) {
      return res.status(400).json({ error: 'Adresse e-mail destinataire invalide.' })
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [recipient],
        reply_to: REPLY_TO_EMAIL,
        subject: requestedSubject,
        text: requestedBody,
      }),
    })

    const resendData = await resendResponse.json().catch(() => null)

    if (!resendResponse.ok || !resendData?.id) {
      console.error('RESEND SEND ERROR:', resendResponse.status, resendData)
      return res.status(502).json({
        error:
          resendData?.message ||
          "Le service d'envoi a refusé le message. Réessaie dans quelques instants.",
      })
    }

    let outboundMessageId: string | null = null

    try {
      const sentEmailResponse = await fetch(
        `https://api.resend.com/emails/${encodeURIComponent(resendData.id)}`,
        {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
        },
      )

      const sentEmailData = await sentEmailResponse.json().catch(() => null)

      if (
        sentEmailResponse.ok &&
        typeof sentEmailData?.message_id === 'string' &&
        sentEmailData.message_id.trim()
      ) {
        outboundMessageId = sentEmailData.message_id.trim()
      }
    } catch (messageIdError) {
      console.error('RESEND MESSAGE-ID LOOKUP ERROR:', messageIdError)
    }

    const now = new Date().toISOString()

    if (!threadId) {
      const { data: newThread, error: createThreadError } = await adminClient
        .from('email_threads')
        .insert({
          subject: requestedSubject,
          contact_email: recipient,
          contact_name: contactName || null,
          registration_id: threadRegistrationId,
          last_message_at: now,
          unread_count: 0,
          archived: false,
          updated_at: now,
        })
        .select('id')
        .single()

      if (createThreadError || !newThread) {
        console.error('EMAIL THREAD CREATE ERROR:', createThreadError)
        return res.status(200).json({
          success: true,
          sent: true,
          storage_warning:
            "L'e-mail a bien été envoyé, mais la conversation n'a pas pu être enregistrée dans le CMS.",
          provider_email_id: resendData.id,
        })
      }

      threadId = newThread.id
    } else {
      const { error: updateThreadError } = await adminClient
        .from('email_threads')
        .update({
          subject: requestedSubject,
          last_message_at: now,
          archived: false,
          updated_at: now,
        })
        .eq('id', threadId)

      if (updateThreadError) {
        console.error('EMAIL THREAD UPDATE ERROR:', updateThreadError)
      }
    }

    const { error: messageError } = await adminClient
      .from('email_messages')
      .insert({
        thread_id: threadId,
        direction: 'outbound',
        from_email: 'contact@fcplouha.fr',
        to_email: recipient,
        subject: requestedSubject,
        body_text: requestedBody,
        provider: 'resend',
        provider_email_id: resendData.id,
        message_id: outboundMessageId,
        status: 'sent',
        sent_at: now,
        created_by: callerId,
      })

    if (messageError) {
      console.error('EMAIL MESSAGE STORE ERROR:', messageError)
      return res.status(200).json({
        success: true,
        sent: true,
        thread_id: threadId,
        storage_warning:
          "L'e-mail a bien été envoyé, mais sa copie n'a pas pu être enregistrée dans l'historique.",
        provider_email_id: resendData.id,
      })
    }

    return res.status(200).json({
      success: true,
      sent: true,
      thread_id: threadId,
      provider_email_id: resendData.id,
    })
  } catch (error) {
    console.error('ADMIN SEND EMAIL API ERROR:', error)
    return res.status(500).json({ error: 'Erreur serveur pendant l’envoi.' })
  }
}
