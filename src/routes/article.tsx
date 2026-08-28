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

type Article = {
  id: number
  title: string
  content: string | null
  image_url: string | null
  created_at: string
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
        .select('id, title, content, image_url, created_at')
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
    )
  }

  if (error) {
    return (
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
    )
  }

  if (notFound || !article) {
    return (
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
    )
  }

  return (
    <article className="max-w-5xl mx-auto px-6 py-20">
      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-64 sm:h-96 object-cover rounded-3xl"
        />
      )}

      <div className="mt-8">
        <p className="text-sm text-gray-500">
          {new Date(article.created_at).toLocaleDateString('fr-FR')}
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          {article.title}
        </h1>

        <div className="mt-6 text-lg leading-relaxed whitespace-pre-line">
          {article.content}
        </div>
      </div>
    </article>
  )
}

export default ArticlePage
