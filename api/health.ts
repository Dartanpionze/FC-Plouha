import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const cronSecret = process.env.CRON_SECRET
  const authorization = req.headers?.authorization

  if (!cronSecret) {
    console.error('Missing CRON_SECRET')
    return res.status(500).json({ ok: false, error: 'Health check is not configured.' })
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase health-check configuration')
    return res.status(500).json({ ok: false, error: 'Supabase is not configured.' })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const startedAt = Date.now()

  try {
    const { error } = await supabase
      .from('club_settings')
      .select('club_name')
      .limit(1)

    if (error) {
      console.error('SUPABASE HEALTH CHECK ERROR:', error)
      return res.status(503).json({
        ok: false,
        database: 'unavailable',
        checked_at: new Date().toISOString(),
      })
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      ok: true,
      database: 'reachable',
      response_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('HEALTH CHECK ERROR:', error)
    return res.status(503).json({
      ok: false,
      database: 'unavailable',
      checked_at: new Date().toISOString(),
    })
  }
}
