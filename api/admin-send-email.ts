
    
  
import { createClient } from '@supabase/supabase-js'

const FROM_EMAIL = 'FC Plouha <contact@fcplouha.fr>'
const REPLY_TO_EMAIL = 'contact@fcplouha.fr'
const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENTS_BYTES = 3 * 1024 * 1024
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt',
])

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
    return {
      allowed: false,
      error: 'Impossible de vérifier la limite de sécurité.',
    }
  }

  if ((count ?? 0) >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil(windowMs / 1000),
    }
  }

  const { error: insertError } = await adminClient
    .from('admin_api_attempts')
    .insert({
      user_id: userId,
      action,
    })

  if (insertError) {
    console.error('ADMIN RATE LIMIT WRITE ERROR:', insertError)
    return {
      allowed: false,
      error: 'Impossible d’appliquer la limite de sécurité.',
    }
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

function getBearerToken(req: any) {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function cleanMessageId(value: unknown) {
  const cleaned = cleanText(value, 998)
  if (!cleaned) return ''
  return cleaned.replace(/[\r\n]/g, '').trim()
}

