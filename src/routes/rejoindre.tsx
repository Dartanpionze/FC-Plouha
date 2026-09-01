import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Euro,
  GraduationCap,
  HandHeart,
  Handshake,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import Seo from '@/components/Seo'
import { supabase } from '@/lib/supabase'

type RegistrationFee = {
  id: string
  title: string
  amount: number
  description: string | null
  season: string | null
  display_order: number
}

const profiles = [
  {
    title: 'Joueur ou joueuse',
    text: "Vous souhaitez rejoindre le projet sportif du FC Plouha ou inscrire votre enfant ? Envoyez-nous votre demande et nous vous orienterons vers la catégorie adaptée.",
    icon: UserPlus,
    to: '/contact?subject=Inscription',
    action: "Faire une demande d'inscription",
  },
  {
    title: 'Bénévole ou dirigeant',
    text: "Matchs, événements, organisation, communication ou vie du club : chacun peut apporter son aide, ponctuellement ou régulièrement.",
    icon: HandHeart,
    to: '/contact?subject=Benevolat',
    action: 'Proposer mon aide',
  },
  {
    title: 'Éducateur ou encadrant',
    text: "Vous souhaitez participer à l'encadrement sportif et accompagner le développement du club ? Prenez contact avec nous pour échanger sur votre expérience et vos envies.",
    icon: GraduationCap,
    to: '/contact?subject=Benevolat',
    action: 'Contacter le club',
  },
  {
    title: 'Partenaire',
    text: "Entreprise, commerce ou acteur local : associez votre image au FC Plouha et participez au développement d'un projet sportif ancré dans son territoire.",
    icon: Handshake,
    to: '/contact?subject=Partenariat',
    action: 'Devenir partenaire',
  },
]

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)

function RejoindrePage() {
  const [fees, setFees] = useState<RegistrationFee[]>([])

  useEffect(() => {
    let cancelled = false

    const fetchFees = async () => {
      const { data, error } = await supabase
        .from('registration_fees')
        .select('id, title, amount, description, season, display_order')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('title', { ascending: true })

      if (error) {
        console.error(error)
        return
      }

      if (!cancelled) {
        setFees(
          (data ?? []).map((fee) => ({
            ...fee,
            amount: Number(fee.amount),
          })) as RegistrationFee[],
        )
      }
    }

    void fetchFees()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <Seo
        title="Rejoindre le club"
        description="Rejoignez le FC Plouha comme joueur, joueuse, bénévole, éducateur, dirigeant ou partenaire."
      />

      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] grain-overlay py-16 sm:py-20 2xl:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,199,44,0.12),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(29,79,145,0.4),transparent_40%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            ÉCRIVONS LA SUITE ENSEMBLE
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            Rejoindre le FC Plouha
          </h1>
          <p className="mt-6 max-w-3xl mx-auto font-condensed text-lg sm:text-xl leading-relaxed text-white/75">
            Le club se construit avec celles et ceux qui veulent porter ses couleurs,
            transmettre leur passion ou simplement donner un peu de leur temps.
            Trouvez ci-dessous la manière de rejoindre l'aventure.
          </p>
        </div>
      </section>

      <main>
        <section className="max-w-6xl 2xl:max-w-[1380px] mx-auto px-4 sm:px-6 2xl:px-8 py-14 2xl:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
              À CHACUN SA PLACE
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl text-[var(--club-navy-deep)]">
              Comment souhaitez-vous participer ?
            </h2>
            <p className="mt-4 font-condensed text-lg text-[var(--club-navy-deep)]/65">
              Choisissez votre profil. Le bouton vous conduira vers le formulaire
              correspondant, déjà préparé pour votre demande.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {profiles.map((profile) => {
              const Icon = profile.icon

              return (
                <article
                  key={profile.title}
                  className="group rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--club-yellow)]/20 text-[var(--club-navy-deep)]">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-5 font-condensed text-2xl font-bold text-[var(--club-navy-deep)]">
                    {profile.title}
                  </h3>

                  <p className="mt-3 leading-relaxed text-[var(--club-navy-deep)]/65">
                    {profile.text}
                  </p>

                  <Link
                    to={profile.to}
                    className="mt-6 inline-flex items-center gap-2 font-condensed font-bold text-[var(--club-red)] transition group-hover:gap-3"
                  >
                    {profile.action}
                    <ArrowRight size={18} />
                  </Link>
                </article>
              )
            })}
          </div>
        </section>

        {fees.length > 0 && (
          <section className="border-y border-black/5 bg-[var(--club-cream)]/55">
            <div className="max-w-6xl 2xl:max-w-[1380px] mx-auto px-4 sm:px-6 2xl:px-8 py-14 2xl:py-18">
              <div className="max-w-3xl">
                <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
                  LICENCES
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl text-[var(--club-navy-deep)]">
                  Tarifs d'inscription
                </h2>
                <p className="mt-4 font-condensed text-lg text-[var(--club-navy-deep)]/65">
                  Retrouvez les tarifs actuellement publiés par le club. Pour une
                  situation particulière ou une question sur une catégorie,
                  contactez-nous directement.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fees.map((fee) => (
                  <article
                    key={fee.id}
                    className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--club-yellow)]/20 text-[var(--club-navy-deep)]">
                        <Euro size={22} />
                      </div>

                      {fee.season && (
                        <span className="rounded-full bg-[var(--club-navy-deep)]/5 px-3 py-1 font-condensed text-xs font-bold text-[var(--club-navy-deep)]/60">
                          {fee.season}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 font-condensed text-xl font-bold text-[var(--club-navy-deep)]">
                      {fee.title}
                    </h3>

                    <p className="mt-2 font-condensed text-3xl font-black text-[var(--club-red)]">
                      {formatPrice(fee.amount)}
                    </p>

                    {fee.description && (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--club-navy-deep)]/60">
                        {fee.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  to="/contact?subject=Inscription"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--club-navy-deep)] px-5 py-3 font-condensed font-bold text-white hover:opacity-90 transition"
                >
                  Une question sur une inscription ?
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="bg-[var(--club-navy-deep)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex gap-4">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--club-yellow)]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl text-white">
                  Vous ne savez pas quelle rubrique choisir ?
                </h2>
                <p className="mt-2 font-condensed text-white/65">
                  Écrivez-nous simplement. Nous transmettrons votre demande à la bonne personne.
                </p>
              </div>
            </div>

            <Link
              to="/contact?subject=Autre"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-6 py-3.5 font-condensed font-bold text-[var(--club-navy-deep)] hover:opacity-90 transition"
            >
              Contacter le club
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default RejoindrePage
