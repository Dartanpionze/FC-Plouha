import { createClient } from '@supabase/supabase-js'

function singleRelation<T>(
  relation: T | T[] | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function sendDatabaseError(res: any, section: 'home' | 'club' | 'contact') {
  const label =
    section === 'club'
      ? 'du club'
      : section === 'contact'
        ? 'de contact'
        : "de l'accueil"

  return res.status(502).json({
    success: false,
    error: `Impossible de charger les informations ${label}.`,
  })
}

async function loadContactData(supabase: any, res: any) {
  const [settingsResult, teamsResult, feesResult] = await Promise.all([
    supabase
      .from('club_settings')
      .select(`
        club_name,
        short_name,
        address,
        postal_code,
        city,
        email,
        phone
      `)
      .limit(1)
      .single(),
    supabase
      .from('teams')
      .select('category')
      .eq('active', true)
      .order('category', { ascending: true }),
    supabase
      .from('registration_fees')
      .select('id, title, amount, description, season, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .order('title', { ascending: true }),
  ])

  const results = [settingsResult, teamsResult, feesResult]
  const errors = results
    .map((result) => result.error)
    .filter((error) => Boolean(error))

  if (errors.length > 0) {
    console.error('PUBLIC CONTACT SUPABASE ERROR:', errors)
    return sendDatabaseError(res, 'contact')
  }

  const categories = Array.from(
    new Set(
      (teamsResult.data ?? [])
        .map((team: { category: string | null }) => team.category?.trim())
        .filter((category: string | undefined): category is string =>
          Boolean(category),
        ),
    ),
  )

  const registrationFees = (feesResult.data ?? []).map((fee: any) => ({
    ...fee,
    amount: Number(fee.amount),
  }))

  return res.status(200).json({
    success: true,
    data: {
      settings: settingsResult.data ?? null,
      teamCategories: categories,
      registrationFees,
    },
  })
}

async function loadClubData(supabase: any, res: any) {
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

  const results = [settingsResult, historyResult, staffResult, teamsResult]
  const errors = results
    .map((result) => result.error)
    .filter((error) => Boolean(error))

  if (errors.length > 0) {
    console.error('PUBLIC CLUB SUPABASE ERROR:', errors)
    return sendDatabaseError(res, 'club')
  }

  return res.status(200).json({
    success: true,
    data: {
      settings: settingsResult.data ?? null,
      history: historyResult.data ?? [],
      staff: staffResult.data ?? [],
      teams: teamsResult.data ?? [],
    },
  })
}

async function loadHomeData(supabase: any, res: any) {
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
    supabase.from('club_settings').select('*').limit(1).single(),
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
        teams (id, name)
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
    return sendDatabaseError(res, 'home')
  }

  const matches = (matchesResult.data ?? []).map((match: any) => ({
    ...match,
    teams: singleRelation(match.teams),
  }))
  const trainingSlots = (trainingSlotsResult.data ?? []).map((slot: any) => ({
    ...slot,
    teams: singleRelation(slot.teams),
  }))

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
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const requestedSection = req.query?.section
  const section =
    requestedSection === 'club' || requestedSection === 'contact'
      ? requestedSection
      : 'home'
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    console.error('PUBLIC DATA ERROR: missing Supabase server configuration')
    return res.status(500).json({
      success: false,
      error: 'Impossible de charger les informations du site.',
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
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    )

    if (section === 'club') {
      return await loadClubData(supabase, res)
    }

    if (section === 'contact') {
      return await loadContactData(supabase, res)
    }

    return await loadHomeData(supabase, res)
  } catch (error) {
    console.error('PUBLIC DATA ERROR:', error)
    return res.status(500).json({
      success: false,
      error: 'Impossible de charger les informations du site.',
    })
  }
}
