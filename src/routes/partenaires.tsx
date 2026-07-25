import { Link } from 'react-router-dom'
import { Handshake } from 'lucide-react'
import { sponsors } from '@/data/club'
import { SectionHeading } from '@/components/SectionHeading'

const tiers: Array<'Or' | 'Argent' | 'Bronze'> = ['Or', 'Argent', 'Bronze']

const tierStyle: Record<string, string> = {
  Or: 'border-[var(--club-yellow)] bg-[var(--club-yellow)]/10',
  Argent: 'border-black/15 bg-black/[0.03]',
  Bronze: 'border-[var(--club-red)]/30 bg-[var(--club-red)]/5',
}

function SponsorsPage() {
  return (
    <div>
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            MERCI À EUX
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">Nos partenaires</h1>
          <p className="mt-6 text-white/70 font-condensed text-lg max-w-2xl mx-auto">
            Le club vit grâce au soutien de ses partenaires locaux, qui
            accompagnent nos équipes saison après saison.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-14">
        {tiers.map((tier) => {
          const items = sponsors.filter((s) => s.tier === tier)
          if (!items.length) return null
          return (
            <div key={tier}>
              <SectionHeading eyebrow={`Partenaires ${tier.toLowerCase()}`} title={`Niveau ${tier}`} />
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {items.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className={`p-6 rounded-xl border-2 ${tierStyle[tier]}`}
                  >
                    <div className="font-condensed font-bold text-lg text-[var(--club-navy-deep)]">
                      {sponsor.name}
                    </div>
                    <div className="text-sm text-[var(--club-navy-deep)]/60">{sponsor.sector}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <section className="bg-[var(--club-navy)] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
          <Handshake className="mx-auto text-[var(--club-yellow)]" size={36} />
          <h2 className="mt-4 text-3xl">Devenez partenaire</h2>
          <p className="mt-4 text-white/70 font-condensed">
            Visibilité sur nos maillots, panneaux au stade et réseaux sociaux :
            échangeons sur la formule qui vous correspond.
          </p>
          <Link
            to="/contact"
            className="inline-flex mt-7 items-center gap-2 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors"
          >
            Contacter le club
          </Link>
        </div>
      </section>
    </div>
  )
}
