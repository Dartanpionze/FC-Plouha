import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const allowedSubjects = new Set([
  'Bénévolat',
  'Partenariat / sponsoring',
  'Autre demande',
])

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''

  return value
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLength)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')

    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing')

    return res.status(500).json({
      error: 'Configuration serveur invalide.',
    })
  }

  try {
    const name = cleanText(req.body?.name, 100)
    const email = cleanText(req.body?.email, 254)
    const subject = cleanText(req.body?.subject, 100)
    const message = cleanText(req.body?.message, 5000)

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Tous les champs sont obligatoires.',
      })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Adresse e-mail invalide.',
      })
    }

    if (!allowedSubjects.has(subject)) {
      return res.status(400).json({
        error: 'Sujet invalide.',
      })
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeSubject = escapeHtml(subject)
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

    const to =
      process.env.CONTACT_TO_EMAIL ||
      'dartanpion@gmail.com'

    const { error } = await resend.emails.send({
      from: 'FC Plouha <onboarding@resend.dev>',
      to,
      replyTo: email,
      subject: `[FC Plouha] ${subject}`,
      html: `
        <h2>Nouveau message depuis le site FC Plouha</h2>

        <p><strong>Nom :</strong> ${safeName}</p>
        <p><strong>Email :</strong> ${safeEmail}</p>
        <p><strong>Sujet :</strong> ${safeSubject}</p>

        <p><strong>Message :</strong></p>
        <p>${safeMessage}</p>
      `,
    })

    if (error) {
      console.error('RESEND ERROR:', error)

      return res.status(502).json({
        error: "Le message n'a pas pu être envoyé.",
      })
    }

    return res.status(200).json({
      success: true,
    })
  } catch (error) {
    console.error('CONTACT API ERROR:', error)

    return res.status(500).json({
      error: 'Erreur serveur.',
    })
  }
}
