import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Handshake,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SectionHeading } from '@/components/SectionHeading'

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

  return (
    <div>

      {/* HERO */}
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">

          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            MERCI À EUX
          </span>

          <h1 className="mt-4 text-4xl sm:text-6xl text-white">
            Nos partenaires
          </h1>

          <p className="mt-6 text-white/70 font-condensed text-lg max-w-2xl mx-auto">
            Le club vit grâce au soutien de ses partenaires locaux,
            qui accompagnent nos équipes saison après saison.
          </p>

        </div>

      </section>

      {/* CONTENU */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">

        {/* CHARGEMENT */}
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

        {/* ERREUR */}
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

          </div>
        )}

        {/* AUCUN PARTENAIRE */}
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
              Cette page sera prochainement mise à jour.
            </p>

          </div>
        )}

        {/* PARTENAIRES */}
        {!loading && !error && partners.length > 0 && (
          <div className="space-y-16">

            {existingTypes.map((type) => {

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

                          {/* LOGO */}
                          <div className="h-44 bg-white flex items-center justify-center p-7 border-b border-black/[0.06]">

                            {partner.logo_url ? (
                              <img
                                src={partner.logo_url}
                                alt={partner.name}
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

                          {/* INFORMATIONS */}
                          <div className="p-5">

                            <div className="flex items-start justify-between gap-3">

                              <h3 className="font-condensed font-bold text-xl text-[var(--club-navy-deep)]">
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
        )}

      </section>

      {/* CTA */}
      <section className="bg-[var(--club-navy)] py-16">

        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">

          <Handshake
            className="mx-auto text-[var(--club-yellow)]"
            size={36}
          />

          <h2 className="mt-4 text-3xl">
            Devenez partenaire
          </h2>

          <p className="mt-4 text-white/70 font-condensed">
            Visibilité sur nos maillots, panneaux au stade et
            réseaux sociaux : échangeons sur la formule qui vous
            correspond.
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

export default SponsorsPage
