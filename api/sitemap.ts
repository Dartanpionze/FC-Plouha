import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://fcplouha.fr'

const STATIC_PAGES = [
  '/',
  '/club',
  '/equipes',
  '/calendrier',
  '/actualites',
  '/galerie',
  '/partenaires',
  '/rejoindre',
  '/contact',
  '/mentions-legales',
  '/politique-confidentialite',
]

type SitemapEntry = {
  path: string
  lastModified?: string | null
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatLastModified(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `\n    <lastmod>${date.toISOString()}</lastmod>`
}

function createSitemap(entries: SitemapEntry[]) {
  const urls = entries
    .map(
      ({ path, lastModified }) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${formatLastModified(lastModified)}
  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed')
  }

  const entries: SitemapEntry[] = STATIC_PAGES.map((path) => ({ path }))
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })

      const [newsResult, teamsResult] = await Promise.all([
        supabase
          .from('news')
          .select('id, created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('teams')
          .select('id, created_at')
          .eq('active', true)
          .order('created_at', { ascending: true }),
      ])

      if (newsResult.error) {
        console.error('SITEMAP NEWS ERROR:', newsResult.error)
      } else {
        for (const article of newsResult.data ?? []) {
          entries.push({
            path: `/actualites/${encodeURIComponent(String(article.id))}`,
            lastModified: article.created_at,
          })
        }
      }

      if (teamsResult.error) {
        console.error('SITEMAP TEAMS ERROR:', teamsResult.error)
      } else {
        for (const team of teamsResult.data ?? []) {
          entries.push({
            path: `/equipes/${encodeURIComponent(String(team.id))}`,
            lastModified: team.created_at,
          })
        }
      }
    } catch (error) {
      console.error('SITEMAP GENERATION ERROR:', error)
    }
  } else {
    console.error('Missing Supabase sitemap configuration')
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  )

  return res.status(200).send(createSitemap(entries))
}
