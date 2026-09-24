
    
  
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'Football Club Plouha'
const SITE_URL = 'https://fcplouha.fr'
const DEFAULT_IMAGE = SITE_URL + '/logo.png'
type SeoProps = {
  title?: string
  description?: string
  image?: string | null
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string | null
}
function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    'meta[' + attribute + '="' + key + '"]',
  )
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}
export default function Seo({
  title,
  description = 'Site officiel du Football Club Plouha : actualités, équipes, matchs, galerie, partenaires et informations du club.',
  image,
  noIndex = false,
  type = 'website',
  publishedTime,
}: SeoProps) {
  const { pathname } = useLocation()
  useEffect(() => {
    const pageTitle = title ? title + ' | ' + SITE_NAME : SITE_NAME + ' | Site officiel'
    const canonicalUrl = SITE_URL + pathname
    const socialImage = image
      ? image.startsWith('http') ? image : SITE_URL + (image.startsWith('/') ? image : '/' + image)
      : DEFAULT_IMAGE
    document.title = pageTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:locale', 'fr_FR')
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:title', pageTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', socialImage)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', pageTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', socialImage)
    const articleMeta = document.head.querySelector<HTMLMetaElement>('meta[property="article:published_time"]')
    if (type === 'article' && publishedTime) setMeta('property', 'article:published_time', publishedTime)
    else articleMeta?.remove()
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
    const organization = {
      '@type': 'SportsOrganization', '@id': SITE_URL + '/#organization',
      name: SITE_NAME, alternateName: 'FC Plouha', url: SITE_URL,
      logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE }, email: 'contact@fcplouha.fr',
      address: { '@type': 'PostalAddress', streetAddress: 'Rue Louis Droumaguet', postalCode: '22580', addressLocality: 'Plouha', addressCountry: 'FR' },
      geo: { '@type': 'GeoCoordinates', latitude: 48.67983363305893, longitude: -2.9269387118059194 },
    }
    const graph: Record<string, unknown>[] = [organization, {
      '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL,
      name: SITE_NAME, inLanguage: 'fr-FR', publisher: { '@id': SITE_URL + '/#organization' },
    }]
    if (type === 'article' && publishedTime) graph.push({
      '@type': 'NewsArticle', '@id': canonicalUrl + '#article', headline: title || SITE_NAME,
      description, image: [socialImage], datePublished: publishedTime, dateModified: publishedTime,
      mainEntityOfPage: canonicalUrl, inLanguage: 'fr-FR',
      author: { '@id': SITE_URL + '/#organization' }, publisher: { '@id': SITE_URL + '/#organization' },
    })
    let jsonLd = document.head.querySelector<HTMLScriptElement>('script[data-fc-plouha-seo]')
    if (!jsonLd) {
      jsonLd = document.createElement('script')
      jsonLd.type = 'application/ld+json'
      jsonLd.dataset.fcPlouhaSeo = 'true'
      document.head.appendChild(jsonLd)
    }
    jsonLd.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
  }, [description, image, noIndex, pathname, publishedTime, title, type])
  return null
}

