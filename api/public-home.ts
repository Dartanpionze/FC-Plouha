import { createClient } from '@supabase/supabase-js'

function singleRelation<T>(
  relation: T | T[] | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

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
    console.error('PUBLIC HOME ERROR: missing Supabase server configuration')
    return res.status(500).json({
      success: false,
      error: "Impossible de charger les informations de l'accueil.",
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
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const [
      settingsResult,
      newsResult,
      teamsResult,
      matchesResult,
      trainingSlotsResult,
      trainingExceptionsResult,
      homeStoryResult,
      galleryResult,
      partnersResult,
    ] = await Promise.all([
      supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .single(),

      supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4),

      supabase
        .from('teams')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true }),

      supabase
        .from('matches')
        .select(`
          id,
          opponent,
          match_date,
          match_time,
          location,
          is_home,
          competition,
          status,
          teams (
            id,
            name
          )
        `)
        .eq('status', 'scheduled')
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(3),

      supabase
        .from('training_slots')
        .select(`
          id,
          team_id,
          weekday,
          start_time,
          end_time,
          location,
          coach,
          start_date,
          end_date,
          active,
          teams (id, name, category)
        `)
        .eq('active', true)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true }),

      supabase
        .from('training_exceptions')
        .select('*')
        .gte('original_date', yesterday)
        .order('original_date', { ascending: true }),

      supabase
        .from('gallery_photos')
        .select('*')
        .eq('active', true)
        .not('home_slot', 'is', null)
        .order('home_slot', { ascending: true })
        .limit(3),

      supabase
        .from('gallery_photos')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(8),

      supabase
        .from('partners')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .limit(12),
    ])

    const results = [
      settingsResult,
      newsResult,
      teamsResult,
      matchesResult,
      trainingSlotsResult,
      trainingExceptionsResult,
      homeStoryResult,
      galleryResult,
      partnersResult,
    ]

    const errors = results
      .map((result) => result.error)
      .filter((error) => Boolean(error))

    if (errors.length > 0) {
      console.error('PUBLIC HOME SUPABASE ERROR:', errors)
      return res.status(502).json({
        success: false,
        error: "Impossible de charger les informations de l'accueil.",
      })
    }

    const matches = (matchesResult.data ?? []).map((match) => ({
      ...match,
      teams: singleRelation(match.teams),
    }))

    const trainingSlots = (trainingSlotsResult.data ?? []).map((slot) => ({
      ...slot,
      teams: singleRelation(slot.teams),
    }))

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    )

    return res.status(200).json({
      success: true,
      data: {
        settings: settingsResult.data ?? null,
        news: newsResult.data ?? [],
        teams: teamsResult.data ?? [],
        matches,
        trainingSlots,
        trainingExceptions: trainingExceptionsResult.data ?? [],
        homeStoryPhotos: homeStoryResult.data ?? [],
        galleryPhotos: galleryResult.data ?? [],
        partners: partnersResult.data ?? [],
      },
    })
  } catch (error) {
    console.error('PUBLIC HOME ERROR:', error)
    return res.status(500).json({
      success: false,
      error: "Impossible de charger les informations de l'accueil.",
    })
  }
}
