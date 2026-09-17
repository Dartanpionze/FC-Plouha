import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000
const MIN_FORM_FILL_TIME_MS = 1500

const CONTACT_SUBJECTS = new Set([
  'Inscription',
  'Benevolat',
  'Partenariat',
  'Autre',
])

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value.replace(/\0/g, '').trim().slice(0, maxLength)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string) {
  return /^[+()\d.\s-]{5,30}$/.test(value)
}

function getHeader(req: any, name: string) {
  const value = req.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : typeof value === 'string' ? value : ''
}

function getClientIp(req: any) {
  const forwarded = getHeader(req, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || ''
  return getHeader(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown'
}

function isAllowedOrigin(req: any) {
  const origin = getHeader(req, 'origin')
  if (!origin) return false

  const allowedOrigins = new Set([
    'https://fcplouha.fr',
    'https://www.fcplouha.fr',
  ])

  if (process.env.VERCEL_URL) {
    allowedOrigins.add(`https://${process.env.VERCEL_URL}`)
  }

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000')
    allowedOrigins.add('http://localhost:5173')
  }

  return allowedOrigins.has(origin)
}

function calculateAge(birthDate: Date) {
  const today = new Date()
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear()
  const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1
  }

  return age
}

function sendError(res: any, status: number, error: string) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json({ success: false, error })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendError(res, 405, 'Method not allowed')
  }

  if (!isAllowedOrigin(req)) {
    return sendError(res, 403, 'Origine de la demande refusée.')
  }

  const contentType = getHeader(req, 'content-type')
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return sendError(res, 415, 'Format de requête invalide.')
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  const rateLimitSalt = process.env.RATE_LIMIT_SALT || process.env.CRON_SECRET

  if (!supabaseUrl || !secretKey || !rateLimitSalt) {
    console.error('Missing public registration API configuration')
    return sendError(res, 500, 'Le formulaire est temporairement indisponible.')
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const honeypot = cleanText(body.website, 200)

  if (honeypot) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ success: true })
  }

  const formStartedAt = Number(body.form_started_at)
  const formAge = Date.now() - formStartedAt

  if (
    !Number.isFinite(formStartedAt) ||
    formAge < MIN_FORM_FILL_TIME_MS ||
    formAge > MAX_FORM_AGE_MS
  ) {
    return sendError(res, 429, 'Le formulaire a expiré. Rechargez la page puis réessayez.')
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const ipHash = createHash('sha256')
    .update(`${rateLimitSalt}:${getClientIp(req)}`)
    .digest('hex')

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

  const { count, error: rateReadError } = await adminClient
    .from('public_submission_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', windowStart)

  if (rateReadError) {
    console.error('PUBLIC FORM RATE LIMIT READ ERROR:', rateReadError)
    return sendError(res, 500, 'Le formulaire est temporairement indisponible.')
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader('Retry-After', String(RATE_LIMIT_WINDOW_MS / 1000))
    return sendError(
      res,
      429,
      'Trop de demandes ont été envoyées. Merci de réessayer dans 15 minutes.',
    )
  }

  const firstName = cleanText(body.first_name, 100)
  const lastName = cleanText(body.last_name, 100)
  const email = cleanText(body.email, 254).toLowerCase()
  const phone = cleanText(body.phone, 30)
  const message = cleanText(body.message, 4000)
  const category = cleanText(body.category, 120)

  if (!firstName || !lastName || !email) {
    return sendError(res, 400, 'Merci de compléter tous les champs obligatoires.')
  }

  if (!isValidEmail(email)) {
    return sendError(res, 400, 'Adresse e-mail invalide.')
  }

  if (phone && !isValidPhone(phone)) {
    return sendError(res, 400, 'Numéro de téléphone invalide.')
  }

  const formType = cleanText(body.form_type, 40)
  let payload: Record<string, unknown>

  if (formType === 'contact') {
    const subject = cleanText(body.subject, 40)

    if (!CONTACT_SUBJECTS.has(subject)) {
      return sendError(res, 400, 'Type de demande invalide.')
    }

    if (subject !== 'Inscription' && !message) {
      return sendError(res, 400, 'Le message est obligatoire.')
    }

    let birthYear: number | null = null

    if (subject === 'Inscription') {
      birthYear = Number(body.birth_year)
      const currentYear = new Date().getUTCFullYear()

      if (
        !Number.isInteger(birthYear) ||
        birthYear < 1900 ||
        birthYear > currentYear ||
        !category
      ) {
        return sendError(res, 400, "Les informations d'inscription sont invalides.")
      }
    }

    const requestType =
      subject === 'Inscription'
        ? 'Joueur'
        : subject === 'Benevolat'
          ? 'Bénévole'
          : subject === 'Partenariat'
            ? 'Partenaire'
            : 'Autre'

    payload = {
      first_name: firstName,
      last_name: lastName,
      birth_year: birthYear,
      category: subject === 'Inscription' ? category : null,
      email,
      phone: phone || null,
      request_type: requestType,
      message: message || null,
      status: 'Nouveau',
    }
  } else if (formType === 'pre_registration') {
    const birthDateValue = cleanText(body.birth_date, 10)
    const birthDate = new Date(`${birthDateValue}T00:00:00Z`)
    const minimumDate = new Date('1900-01-01T00:00:00Z')
    const today = new Date()

    if (
      !birthDateValue ||
      Number.isNaN(birthDate.getTime()) ||
      birthDate < minimumDate ||
      birthDate > today ||
      !category ||
      !phone ||
      !isValidPhone(phone) ||
      body.contact_consent !== true
    ) {
      return sendError(res, 400, 'Les informations de pré-inscription sont invalides.')
    }

    const isMinor = calculateAge(birthDate) < 18
    const legalGuardianFirstName = cleanText(body.legal_guardian_first_name, 100)
    const legalGuardianLastName = cleanText(body.legal_guardian_last_name, 100)
    const legalGuardianEmail = cleanText(body.legal_guardian_email, 254).toLowerCase()
    const legalGuardianPhone = cleanText(body.legal_guardian_phone, 30)

    if (
      isMinor &&
      (!legalGuardianFirstName ||
        !legalGuardianLastName ||
        !isValidEmail(legalGuardianEmail) ||
        !isValidPhone(legalGuardianPhone))
    ) {
      return sendError(res, 400, 'Les coordonnées du responsable légal sont invalides.')
    }

    const firstLicence = body.first_licence === true
    const previousClub = cleanText(body.previous_club, 160)

    payload = {
      first_name: firstName,
      last_name: lastName,
      birth_year: birthDate.getUTCFullYear(),
      birth_date: birthDateValue,
      category,
      email,
      phone,
      request_type: 'Joueur',
      message: message || null,
      status: 'Nouveau',
      previous_club: firstLicence ? null : previousClub || null,
      first_licence: firstLicence,
      legal_guardian_first_name: isMinor ? legalGuardianFirstName : null,
      legal_guardian_last_name: isMinor ? legalGuardianLastName : null,
      legal_guardian_email: isMinor ? legalGuardianEmail : null,
      legal_guardian_phone: isMinor ? legalGuardianPhone : null,
      contact_consent: true,
    }
  } else {
    return sendError(res, 400, 'Type de formulaire invalide.')
  }

  const { error: rateWriteError } = await adminClient
    .from('public_submission_attempts')
    .insert({ ip_hash: ipHash })

  if (rateWriteError) {
    console.error('PUBLIC FORM RATE LIMIT WRITE ERROR:', rateWriteError)
    return sendError(res, 500, 'Le formulaire est temporairement indisponible.')
  }

  const { error: insertError } = await adminClient
    .from('registrations')
    .insert(payload)

  if (insertError) {
    console.error('PUBLIC REGISTRATION INSERT ERROR:', insertError)
    return sendError(res, 500, "La demande n'a pas pu être enregistrée.")
  }

  const cleanupBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  void adminClient
    .from('public_submission_attempts')
    .delete()
    .lt('created_at', cleanupBefore)

  res.setHeader('Cache-Control', 'no-store')
  return res.status(201).json({ success: true })
}
