import { Link } from 'react-router-dom'
import { news } from '@/data/club'
import { SectionHeading } from '@/components/SectionHeading'
import { PhotoTile } from '@/components/PhotoTile'

export const Route = createFileRoute('/actualites')({
  component: NewsPage,
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function NewsPage() {
  return (
    <div>
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            LE CLUB EN DIRECT
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">Actualités</h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 space-y-8">
        {news.map((item, i) => (
          <article
            key={item.id}
            className="grid md:grid-cols-[280px_1fr] gap-6 bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm"
          >
            <PhotoTile
              hue={i % 3 === 0 ? 214 : i % 3 === 1 ? 0 : 48}
              caption={item.category}
              className="h-48 md:h-full"
            />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-condensed font-bold px-2.5 py-1 rounded-full bg-[var(--club-red)]/10 text-[var(--club-red)]">
                  {item.category}
                </span>
                <span className="text-xs font-condensed text-[var(--club-navy-deep)]/60">
                  {formatDate(item.date)}
                </span>
              </div>
              <h2 className="font-condensed font-bold text-2xl normal-case">{item.title}</h2>
              <p className="mt-3 text-[var(--club-navy-deep)]/75 leading-relaxed font-condensed">
                {item.excerpt}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
