
    
  
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

    const articlePublishedMeta =
      document.head.querySelector<HTMLMetaElement>(
        'meta[property="article:published_time"]',
      )

    if (type === 'article' && publishedTime) {
      setMeta(
        'meta[property="article:published_time"]',
        'property',
        'article:published_time',
        publishedTime,
      )
    } else {
      articlePublishedMeta?.remove()
    }

    let canonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }

    canonical.setAttribute('href', canonicalUrl)

    const organization = {
      '@type': 'SportsOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: 'FC Plouha',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_IMAGE,
      },
      email: 'contact@fcplouha.fr',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Rue Louis Droumaguet',
        postalCode: '22580',
        addressLocality: 'Plouha',
        addressCountry: 'FR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 48.67983363305893,
        longitude: -2.9269387118059194,
      },
    }

    const graph: Record<string, unknown>[] = [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'fr-FR',
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
    ]

    if (type === 'article' && publishedTime) {
      graph.push({
        '@type': 'NewsArticle',
        '@id': `${canonicalUrl}#article`,
        headline: title || SITE_NAME,
        description,
        image: [socialImage],
        datePublished: publishedTime,
        dateModified: publishedTime,
        mainEntityOfPage: canonicalUrl,
        inLanguage: 'fr-FR',
        author: {
          '@id': `${SITE_URL}/#organization`,
        },
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      })
    }

    let structuredData =
      document.head.querySelector<HTMLScriptElement>(
        'script[data-fc-plouha-seo="structured-data"]',
      )

    if (!structuredData) {
      structuredData = document.createElement('script')
      structuredData.type = 'application/ld+json'
      structuredData.dataset.fcPlouhaSeo = 'structured-data'
      document.head.appendChild(structuredData)
    }

    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    })
  }, [
    description,
    image,

