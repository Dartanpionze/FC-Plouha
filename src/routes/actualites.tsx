import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Loader2,
  Newspaper,
  Search,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'

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
  const [search, setSearch] = useState('')

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

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return news

    return news.filter((item) =>
      [item.title, item.excerpt, item.content]
        .filter(Boolean)
        .some((value) =>
          value!
            .replace(/<[^>]*>/g, ' ')
            .toLowerCase()
            .includes(query),
        ),
    )
  }, [news, search])

  const featuredArticle = search.trim()
    ? null
    : filteredNews[0] || null

  const listArticles = featuredArticle
    ? filteredNews.slice(1)
    : filteredNews

  return (
    <div>
      <Seo
        title="Actualités"
        description="Retrouvez les dernières actualités du Football Club Plouha, la vie du club et les informations sportives."
      />

      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">
        <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            LE CLUB EN DIRECT
          </span>

          <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            Actualités
          </h1>

          <p className="mt-5 2xl:mt-6 text-white/65 font-condensed text-lg 2xl:text-xl max-w-2xl 2xl:max-w-3xl mx-auto 2xl:leading-relaxed">
            Retrouvez les dernières nouvelles du FC Plouha,
            la vie du club et les informations sportives.
          </p>
        </div>
      </section>

      <section className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 2xl:px-8 py-16 2xl:py-24">
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
            <button
              type="button"
              onClick={fetchNews}
              className="mt-6 rounded-lg bg-[var(--club-yellow)] px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)]"
            >
              Réessayer
            </button>
          </div>
        )}

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

        {!loading && !error && news.length > 0 && (
          <>
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="font-condensed font-bold text-xs tracking-[0.24em] text-[var(--club-red)]">
                  TOUTES LES PUBLICATIONS
                </span>
                <p className="mt-1 text-sm text-[var(--club-navy-deep)]/55">
                  {filteredNews.length} actualité{filteredNews.length > 1 ? 's' : ''}
                  {search.trim() ? ` trouvée${filteredNews.length > 1 ? 's' : ''}` : ''}
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--club-navy-deep)]/35"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une actualité..."
                  className="w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-11 font-condensed text-[var(--club-navy-deep)] outline-none transition focus:border-[var(--club-navy)]/35 focus:ring-2 focus:ring-[var(--club-navy)]/10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Effacer la recherche"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--club-navy-deep)]/45 hover:bg-black/5"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {featuredArticle && (
              <article className="group mb-12 grid overflow-hidden rounded-3xl border border-black/5 bg-[var(--club-navy-deep)] shadow-xl lg:grid-cols-[1.15fr_0.85fr]">
                <Link
                  to={`/actualites/${featuredArticle.id}`}
                  className="relative block min-h-[300px] overflow-hidden bg-black/20 lg:min-h-[430px]"
                >
                  {featuredArticle.image_url ? (
                    <>
                      <img
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        fetchPriority="high"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent lg:bg-gradient-to-r" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Newspaper size={72} className="text-white/15" />
                    </div>
                  )}
                </Link>

                <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                  <span className="w-fit rounded-full bg-[var(--club-yellow)] px-3 py-1.5 font-condensed text-xs font-bold uppercase tracking-[0.16em] text-[var(--club-navy-deep)]">
                    À la une
                  </span>

                  <div className="mt-5 text-xs font-condensed capitalize text-white/55">
                    {formatDate(featuredArticle.created_at)}
                  </div>

                  <h2 className="mt-3 font-condensed text-3xl font-bold normal-case text-white sm:text-4xl">
                    <Link
                      to={`/actualites/${featuredArticle.id}`}
                      className="hover:text-[var(--club-yellow)] transition-colors"
                    >
                      {featuredArticle.title}
                    </Link>
                  </h2>

                  {featuredArticle.excerpt && (
                    <p className="mt-5 font-condensed leading-relaxed text-white/70">
                      {featuredArticle.excerpt}
                    </p>
                  )}

                  <Link
                    to={`/actualites/${featuredArticle.id}`}
                    className="mt-7 inline-flex items-center gap-2 font-condensed font-bold text-[var(--club-yellow)]"
                  >
                    Lire l'article <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            )}

            {filteredNews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-16 text-center">
                <Search
                  size={38}
                  className="mx-auto text-[var(--club-navy-deep)]/20"
                />
                <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
                  Aucun résultat
                </h2>
                <p className="mt-2 text-[var(--club-navy-deep)]/55">
                  Aucune actualité ne correspond à « {search.trim()} ».
                </p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-5 font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)]"
                >
                  Afficher toutes les actualités
                </button>
              </div>
            ) : (
              listArticles.length > 0 && (
                <div className="grid gap-7 md:grid-cols-2">
                  {listArticles.map((item) => (
                    <article
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                    >
                      <Link
                        to={`/actualites/${item.id}`}
                        className="block h-56 overflow-hidden bg-[var(--club-navy-deep)]/5"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Newspaper
                              size={44}
                              className="text-[var(--club-navy-deep)]/20"
                            />
                          </div>
                        )}
                      </Link>

                      <div className="p-6 sm:p-7">
                        <div className="text-xs font-condensed capitalize text-[var(--club-navy-deep)]/55">
                          {formatDate(item.created_at)}
                        </div>

                        <h2 className="mt-3 font-condensed text-2xl font-bold normal-case text-[var(--club-navy-deep)]">
                          <Link
                            to={`/actualites/${item.id}`}
                            className="hover:text-[var(--club-red)] transition-colors"
                          >
                            {item.title}
                          </Link>
                        </h2>

                        {item.excerpt && (
                          <p className="mt-3 line-clamp-3 font-condensed leading-relaxed text-[var(--club-navy-deep)]/70">
                            {item.excerpt}
                          </p>
                        )}

                        <Link
                          to={`/actualites/${item.id}`}
                          className="mt-5 inline-flex items-center gap-2 font-condensed text-sm font-bold text-[var(--club-navy)] hover:text-[var(--club-red)]"
                        >
                          Lire l'article <ArrowRight size={16} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default NewsPage
