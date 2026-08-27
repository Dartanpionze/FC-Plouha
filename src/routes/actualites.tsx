import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Loader2,
  Newspaper,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type NewsItem = {
  id: number
  title: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    setLoading(true)
    setError(false)

    const { data, error } = await supabase
      .from('news')
      .select('id, title, excerpt, content, image_url, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError(true)
      setLoading(false)
      return
    }

    setNews(data || [])
    setLoading(false)
  }

  return (
    <div>
      {/* HERO */}
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            LE CLUB EN DIRECT
          </span>

          <h1 className="mt-4 text-4xl sm:text-6xl text-white">
            Actualités
          </h1>

          <p className="mt-5 text-white/65 font-condensed text-lg max-w-2xl mx-auto">
            Retrouvez les dernières nouvelles du FC Plouha,
            la vie du club et les informations sportives.
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">

        {/* CHARGEMENT */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2
              size={36}
              className="animate-spin text-[var(--club-navy-deep)]/40"
            />

            <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/50">
              Chargement des actualités...
            </p>
          </div>
        )}

        {/* ERREUR */}
        {!loading && error && (
          <div className="py-20 text-center">
            <Newspaper
              size={44}
              className="mx-auto text-[var(--club-red)]"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Impossible de charger les actualités
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Veuillez réessayer ultérieurement.
            </p>
          </div>
        )}

        {/* AUCUNE ACTUALITE */}
        {!loading && !error && news.length === 0 && (
          <div className="py-20 text-center">
            <Newspaper
              size={46}
              className="mx-auto text-[var(--club-navy-deep)]/20"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Aucune actualité pour le moment
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Les prochaines nouvelles du club apparaîtront ici.
            </p>
          </div>
        )}

        {/* LISTE */}
        {!loading && !error && news.length > 0 && (
          <div className="space-y-8">
            {news.map((item) => (
              <article
                key={item.id}
                className="group grid md:grid-cols-[280px_1fr] bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-lg transition-shadow"
              >
                <Link
                  to={`/actualites/${item.id}`}
                  className="block h-52 md:h-full bg-[var(--club-navy-deep)]/5 overflow-hidden"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper
                        size={44}
                        className="text-[var(--club-navy-deep)]/20"
                      />
                    </div>
                  )}
                </Link>

                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <div className="text-xs font-condensed text-[var(--club-navy-deep)]/55 capitalize">
                    {formatDate(item.created_at)}
                  </div>

                  <h2 className="mt-3 font-condensed font-bold text-2xl normal-case text-[var(--club-navy-deep)]">
                    <Link
                      to={`/actualites/${item.id}`}
                      className="hover:text-[var(--club-red)] transition-colors"
                    >
                      {item.title}
                    </Link>
                  </h2>

                  {item.excerpt && (
                    <p className="mt-3 text-[var(--club-navy-deep)]/75 leading-relaxed font-condensed">
                      {item.excerpt}
                    </p>
                  )}

                  <Link
                    to={`/actualites/${item.id}`}
                    className="inline-flex items-center gap-2 mt-5 font-condensed font-bold text-sm text-[var(--club-navy)] hover:text-[var(--club-red)] transition-colors"
                  >
                    Lire l'article
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default NewsPage
