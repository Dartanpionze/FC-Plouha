import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    console.error('PUBLIC CLUB ERROR: missing Supabase server configuration')
    return res.status(500).json({
      success: false,
      error: 'Impossible de charger les informations du club.',
    })
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  try {
    const [settingsResult, historyResult, staffResult, teamsResult] =
      await Promise.all([
        supabase
          .from('club_settings')
          .select(`
            club_name,
            short_name,
            season,
            description,
            founded_year,
            members_count,
            volunteers_count,
            district_titles,
            city
          `)
          .limit(1)
          .single(),

        supabase
          .from('club_history')
          .select('id, year, title, description, display_order')
          .order('display_order', { ascending: true })
          .order('year', { ascending: true }),

        supabase
          .from('club_staff')
          .select('id, name, role, photo_url, email, phone, display_order, active')
          .eq('active', true)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),

        supabase
          .from('teams')
          .select('id, active')
          .eq('active', true),
      ])

    const results = [
      settingsResult,
      historyResult,
      staffResult,
      teamsResult,
    ]

    const errors = results
      .map((result) => result.error)
      .filter((error) => Boolean(error))

    if (errors.length > 0) {
      console.error('PUBLIC CLUB SUPABASE ERROR:', errors)
      return res.status(502).json({
        success: false,
        error: 'Impossible de charger les informations du club.',
      })
    }

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    )

    return res.status(200).json({
      success: true,
      data: {
        settings: settingsResult.data ?? null,
        history: historyResult.data ?? [],
        staff: staffResult.data ?? [],
        teams: teamsResult.data ?? [],
      },
    })
  } catch (error) {
    console.error('PUBLIC CLUB ERROR:', error)
    return res.status(500).json({
      success: false,
      error: 'Impossible de charger les informations du club.',
    })
  }
}
