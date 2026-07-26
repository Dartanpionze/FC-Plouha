import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('BODY:', req.body)

    const { name, email, subject, message } = req.body

    const result = await resend.emails.send({
      from: 'FC Plouha <onboarding@resend.dev>',
      to: 'lfludovic@gmail.com',
      subject: `[FC Plouha] ${subject}`,
      html: `
        <h2>Nouveau message depuis le site FC Plouha</h2>

        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Sujet :</strong> ${subject}</p>

        <p><strong>Message :</strong></p>
        <p>${message}</p>
      `,
    })

    console.log('RESEND RESULT:', result)

    return res.status(200).json({ 
      success: true,
      result
    })

  } catch (error) {
    console.error('RESEND ERROR:', error)

    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error
    })
  }
}
