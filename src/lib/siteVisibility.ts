export type PublicSectionKey =
  | 'club'
  | 'news'
  | 'teams'
  | 'calendar'
  | 'gallery'
  | 'partners'
  | 'contact'

export type SiteVisibility = Record<PublicSectionKey, boolean>

export const DEFAULT_SITE_VISIBILITY: SiteVisibility = {
  club: true,
  news: true,
  teams: true,
  calendar: true,
  gallery: true,
  partners: true,
  contact: true,
}

export function normalizeSiteVisibility(
  value: Partial<SiteVisibility> | null | undefined,
): SiteVisibility {
  return {
    ...DEFAULT_SITE_VISIBILITY,
    ...(value || {}),
  }
}
