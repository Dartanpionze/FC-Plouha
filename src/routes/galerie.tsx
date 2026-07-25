import { Link } from 'react-router-dom'
import { useState } from 'react'
import { gallery } from '@/data/club'
import { PhotoTile } from '@/components/PhotoTile'

export const Route = createFileRoute('/galerie')({
  component: GalleryPage,
})

const categories = ['Tous', ...Array.from(new Set(gallery.map((g) => g.category)))]

function GalleryPage() {
  const [filter, setFilter] = useState('Tous')
  const filtered = filter === 'Tous' ? gallery : gallery.filter((g) => g.category === filter)

  return (
    <div>
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            SOUVENIRS
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">Galerie photo</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`font-condensed font-semibold text-sm px-4 py-2 rounded-full border transition-colors ${
                filter === cat
                  ? 'bg-[var(--club-navy-deep)] text-white border-[var(--club-navy-deep)]'
                  : 'border-black/10 text-[var(--club-navy-deep)]/70 hover:border-[var(--club-navy-deep)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((img) => (
            <PhotoTile key={img.id} hue={img.hue} caption={img.caption} className="h-52 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  )
}
