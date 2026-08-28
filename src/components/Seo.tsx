import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'Football Club Plouha'
const SITE_URL = 'https://fc-plouha.vercel.app'
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`

type SeoProps = {
  title?: string
  description?: string
  image?: string | null
  noIndex?: boolean
}

function setMeta(
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

export default function Seo({
  title,
  description = 'Site officiel du Football Club Plouha : actualités, équipes, matchs, galerie, partenaires et informations du club.',
  image,
  noIndex = false,
}: SeoProps) {
  const location = useLocation()

  useEffect(() => {
    const pageTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} | Site officiel`

    const canonicalUrl = `${SITE_URL}${location.pathname}`
    const socialImage = image
      ? image.startsWith('http')
        ? image
        : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`
      : DEFAULT_IMAGE

    document.title = pageTitle

    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'fr_FR')
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME)
    setMeta('meta[property="og:title"]', 'property', 'og:title', pageTitle)
    setMeta(
      'meta[property="og:description"]',
      'property',
      'og:description',
      description,
    )
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[property="og:image"]', 'property', 'og:image', socialImage)

    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle)
    setMeta(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      description,
    )
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', socialImage)
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow',
    )

    let canonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }

    canonical.setAttribute('href', canonicalUrl)
  }, [description, image, location.pathname, noIndex, title])

  return null
}
