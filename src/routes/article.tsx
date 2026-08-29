import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Newspaper,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'

type Article = {
  id: number
  title: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  created_at: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function plainTextToHtml(value: string) {
  const normalized = value.replace(/\r\n?/g, '\n').trim()

  if (!normalized) {
    return ''
  }

  const explicitParagraphs = normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const paragraphs =
    explicitParagraphs.length > 1
      ? explicitParagraphs
      : normalized.includes('\n')
        ? normalized
            .split('\n')
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
        : [normalized]

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('')
}

function getRenderableContent(value: string | null) {
  if (!value?.trim()) {
    return ''
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value)

  return looksLikeHtml ? value : plainTextToHtml(value)
}

function ArticlePage() {
  const { id } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const fetchArticle = async () => {
    if (!id) {
      setArticle(null)
      setNotFound(true)
      setError(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    setNotFound(false)

    try {
      const { data, error: fetchError } = await supabase
        .from('news')
        .select('id, title, excerpt, content, image_url, created_at')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) {
        console.error(fetchError)
        setArticle(null)
        setError(true)
        return
      }

      if (!data) {
        setArticle(null)
        setNotFound(true)
        return
      }

      setArticle(data)
    } catch (fetchError) {
      console.error(fetchError)
      setArticle(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticle()
  }, [id])

  if (loading) {
    return (
      <>
        <Seo title="Actualité" />
        <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-[var(--club-navy)]"
          />
          <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/60">
            Chargement de l'article...
          </p>
        </div>
      </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Seo title="Actualité indisponible" noIndex />
        <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle
            size={30}
            className="text-[var(--club-red)]"
          />
        </div>

        <h1 className="mt-6 text-3xl text-[var(--club-navy-deep)]">
          Impossible de charger l'article
        </h1>

        <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/65">
          Une erreur est survenue pendant le chargement. Vous pouvez
          réessayer ou revenir aux actualités.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={fetchArticle}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)] hover:opacity-90 transition"
          >
            <RefreshCw size={17} />
            Réessayer
          </button>

          <Link
            to="/actualites"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--club-navy-deep)]/15 px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)] hover:bg-slate-50 transition"
          >
            <ArrowLeft size={17} />
            Retour aux actualités
          </Link>
        </div>
      </section>
      </>
    )
  }

  if (notFound || !article) {
    return (
      <>
        <Seo title="Actualité introuvable" noIndex />
        <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--club-navy)]/10 flex items-center justify-center">
          <Newspaper
            size={30}
            className="text-[var(--club-navy)]"
          />
        </div>

        <h1 className="mt-6 text-3xl text-[var(--club-navy-deep)]">
          Actualité introuvable
        </h1>

        <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/65">
          Cette actualité n'existe plus ou l'adresse utilisée est incorrecte.
        </p>

        <Link
          to="/actualites"
          className="inline-flex items-center justify-center gap-2 mt-8 rounded-xl bg-[var(--club-yellow)] px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)] hover:opacity-90 transition"
        >
          <ArrowLeft size={17} />
          Voir les actualités
        </Link>
      </section>
      </>
    )
  }

  const seoDescription =
    article.excerpt ||
    article.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160) ||
    'Actualité du Football Club Plouha.'

  return (
    <>
      <Seo
        title={article.title}
        description={seoDescription}
        image={article.image_url}
      />

      <article className="article-page">
        <div className="article-page-inner">
          <Link to="/actualites" className="article-back-link">
            <ArrowLeft size={17} />
            Retour aux actualités
          </Link>

          <header className="article-header">
            <p className="article-kicker">Actualité du club</p>

            <h1 className="article-title">{article.title}</h1>

            <div className="article-meta">
              <time dateTime={article.created_at}>
                {new Date(article.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </div>

            {article.excerpt && (
              <p className="article-lead">{article.excerpt}</p>
            )}
          </header>

          {article.image_url && (
            <figure className="article-cover">
              <img
                src={article.image_url}
                alt={article.title}
                decoding="async"
                fetchPriority="high"
              />
            </figure>
          )}

          <div className="article-body-card">
            <div
              className="article-richtext"
              dangerouslySetInnerHTML={{
                __html: getRenderableContent(article.content),
              }}
            />
          </div>

          <footer className="article-footer">
            <Link to="/actualites" className="article-footer-link">
              <ArrowLeft size={17} />
              Toutes les actualités
            </Link>
          </footer>
        </div>
      </article>
    </>
  )
}

export default ArticlePage
