import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ExternalLink,
  Handshake,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SectionHeading } from '@/components/SectionHeading'
import Seo from '@/components/Seo'

type Partner = {
  id: number
  name: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  type: string
  display_order: number
  active: boolean
}

const typeLabels: Record<string, string> = {
  partner: 'Partenaires',
  sponsor: 'Sponsors',
  equipment: 'Équipementiers',
}

const typeOrder = [
  'sponsor',
  'partner',
  'equipment',
]

function SponsorsPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    setError(false)

    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('active', true)
      .order('display_order', {
        ascending: true,
      })
      .order('name', {
        ascending: true,
      })

    if (error) {
      console.error(error)
      setError(true)
      setLoading(false)
      return
    }

    setPartners(data || [])
    setLoading(false)
  }

  const existingTypes = typeOrder.filter((type) =>
    partners.some((partner) => partner.type === type),
  )

  const visibleTypes = useMemo(
    () =>
      typeFilter === 'all'
        ? existingTypes
        : existingTypes.filter((type) => type === typeFilter),
    [existingTypes, typeFilter],
  )

  return (
    <div>
      <Seo
        title="Partenaires"
        description="Découvrez les partenaires et sponsors qui accompagnent et soutiennent le Football Club Plouha."
      />

      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">
        <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            MERCI À EUX
          </span>

          <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            Nos partenaires
          </h1>

          <p className="mt-6 text-white/70 font-condensed text-lg 2xl:text-xl max-w-2xl 2xl:max-w-3xl mx-auto 2xl:leading-relaxed">
            Le club avance grâce au soutien de ses partenaires locaux,
            engagés aux côtés du projet du FC Plouha.
          </p>

          {!loading && !error && partners.length > 0 && (
            <div className="mt-7 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 font-condensed text-sm text-white/65">
              {partners.length} soutien{partners.length > 1 ? 's' : ''} du club
            </div>
          )}
        </div>
      </section>

      <section className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 2xl:px-8 py-20 2xl:py-24">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--club-navy-deep)]/50">
            <Loader2
              size={34}
              className="animate-spin"
            />

            <p className="mt-4 font-condensed">
              Chargement des partenaires...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="py-20 text-center">
            <Handshake
              size={40}
              className="mx-auto text-[var(--club-red)]"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Impossible de charger les partenaires
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Veuillez réessayer ultérieurement.
            </p>

            <button
              type="button"
              onClick={fetchPartners}
              className="mt-6 rounded-lg bg-[var(--club-yellow)] px-5 py-3 font-condensed font-bold text-[var(--club-navy-deep)]"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && partners.length === 0 && (
          <div className="py-20 text-center">
            <Handshake
              size={42}
              className="mx-auto text-[var(--club-navy-deep)]/30"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Nos partenaires arrivent bientôt
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Vous souhaitez accompagner le projet du FC Plouha ?
            </p>

            <Link
              to="/contact?subject=Partenariat"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--club-yellow)] px-6 py-3 font-condensed font-bold text-[var(--club-navy-deep)]"
            >
              Devenir partenaire
              <ArrowRight size={17} />
            </Link>
          </div>
        )}

        {!loading && !error && partners.length > 0 && (
          <>
            {existingTypes.length > 1 && (
              <div className="mb-12 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`rounded-full px-4 py-2 font-condensed text-sm font-bold transition ${
                    typeFilter === 'all'
                      ? 'bg-[var(--club-navy-deep)] text-white'
                      : 'border border-black/10 bg-white text-[var(--club-navy-deep)]'
                  }`}
                >
                  Tous
                </button>

                {existingTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`rounded-full px-4 py-2 font-condensed text-sm font-bold transition ${
                      typeFilter === type
                        ? 'bg-[var(--club-yellow)] text-[var(--club-navy-deep)]'
                        : 'border border-black/10 bg-white text-[var(--club-navy-deep)]'
                    }`}
                  >
                    {typeLabels[type] || type}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-16">
              {visibleTypes.map((type) => {
                const items = partners.filter(
                  (partner) => partner.type === type,
                )

                return (
                  <div key={type}>
                    <SectionHeading
                      eyebrow="Ils nous accompagnent"
                      title={typeLabels[type] || 'Partenaires'}
                    />

                    <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map((partner) => {
                        const card = (
                          <div className="h-full group bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="h-44 bg-white flex items-center justify-center p-7 border-b border-black/[0.06]">
                              {partner.logo_url ? (
                                <img
                                  src={partner.logo_url}
                                  alt={`Logo ${partner.name}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-[var(--club-navy-deep)]/5 flex items-center justify-center">
                                  <Handshake
                                    size={28}
                                    className="text-[var(--club-navy-deep)]/30"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="p-5">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-condensed font-bold text-xl 2xl:text-2xl text-[var(--club-navy-deep)]">
                                  {partner.name}
                                </h3>

                                {partner.website_url && (
                                  <ExternalLink
                                    size={16}
                                    className="shrink-0 mt-1 text-[var(--club-navy-deep)]/30 group-hover:text-[var(--club-red)] transition-colors"
                                  />
                                )}
                              </div>

                              {partner.description && (
                                <p className="mt-2 text-sm leading-relaxed text-[var(--club-navy-deep)]/60">
                                  {partner.description}
                                </p>
                              )}

                              {partner.website_url && (
                                <div className="mt-4 inline-flex items-center gap-1.5 font-condensed text-xs font-bold text-[var(--club-navy)] group-hover:text-[var(--club-red)]">
                                  Visiter le site
                                  <ExternalLink size={13} />
                                </div>
                              )}
                            </div>
                          </div>
                        )

                        if (partner.website_url) {
                          return (
                            <a
                              key={partner.id}
                              href={partner.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              {card}
                            </a>
                          )
                        }

                        return (
                          <div key={partner.id}>
                            {card}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section className="bg-[var(--club-navy)] py-16 2xl:py-20">
        <div className="max-w-3xl 2xl:max-w-4xl mx-auto px-4 sm:px-6 2xl:px-8 text-center text-white">
          <Handshake
            className="mx-auto text-[var(--club-yellow)]"
            size={36}
          />

          <h2 className="mt-4 text-3xl 2xl:text-4xl">
            Devenez partenaire
          </h2>

          <p className="mt-4 text-white/70 font-condensed 2xl:text-lg">
            Vous souhaitez soutenir le projet du FC Plouha ?
            Échangeons ensemble sur un partenariat adapté à votre activité.
          </p>

          <Link
            to="/contact?subject=Partenariat"
            className="inline-flex mt-7 items-center gap-2 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors"
          >
            Proposer un partenariat
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default SponsorsPage
