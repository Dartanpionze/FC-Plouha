import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Euro,
  GraduationCap,
  HandHeart,
  Handshake,
  Loader2,
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

type TeamCategory = {
  category: string | null
}

type RegistrationForm = {
  firstName: string
  lastName: string
  birthDate: string
  category: string
  email: string
  phone: string
  previousClub: string
  firstLicence: boolean
  legalGuardianFirstName: string
  legalGuardianLastName: string
  legalGuardianEmail: string
  legalGuardianPhone: string
  message: string
  consent: boolean
}

const emptyForm: RegistrationForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  category: '',
  email: '',
  phone: '',
  previousClub: '',
  firstLicence: false,
  legalGuardianFirstName: '',
  legalGuardianLastName: '',
  legalGuardianEmail: '',
  legalGuardianPhone: '',
  message: '',
  consent: false,
}

const profiles = [
  {
    title: 'Joueur ou joueuse',
    text: "Vous souhaitez rejoindre le projet sportif du FC Plouha ou inscrire votre enfant ? Faites directement votre pré-inscription en ligne.",
    icon: UserPlus,
    to: '#preinscription',
    action: 'Faire une pré-inscription',
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
  const formRef = useRef<HTMLElement | null>(null)
  const [fees, setFees] = useState<RegistrationFee[]>([])
  const [teamCategories, setTeamCategories] = useState<string[]>([])
  const [form, setForm] = useState<RegistrationForm>(emptyForm)
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchPageData = async () => {
      const [feesResult, teamsResult] = await Promise.all([
        supabase
          .from('registration_fees')
          .select('id, title, amount, description, season, display_order')
          .eq('active', true)
          .order('display_order', { ascending: true })
          .order('title', { ascending: true }),
        supabase
          .from('teams')
          .select('category')
          .eq('active', true)
          .order('category', { ascending: true }),
      ])

      if (feesResult.error) {
        console.error(feesResult.error)
      } else if (!cancelled) {
        setFees(
          (feesResult.data ?? []).map((fee) => ({
            ...fee,
            amount: Number(fee.amount),
          })) as RegistrationFee[],
        )
      }

      if (teamsResult.error) {
        console.error(teamsResult.error)
      } else if (!cancelled) {
        const categories = Array.from(
          new Set(
            ((teamsResult.data ?? []) as TeamCategory[])
              .map((team) => team.category?.trim())
              .filter((category): category is string => Boolean(category)),
          ),
        )
        setTeamCategories(categories)
      }
    }

    void fetchPageData()

    return () => {
      cancelled = true
    }
  }, [])

  const availableCategories = useMemo(
    () =>
      teamCategories.length > 0
        ? [...teamCategories, 'Je ne sais pas']
        : ['U6 / U7', 'U8 / U9', 'U10 / U11', 'U12 / U13', 'U15F / U18F', 'Je ne sais pas'],
    [teamCategories],
  )

  const isMinor = useMemo(() => {
    if (!form.birthDate) return false
    const birthDate = new Date(`${form.birthDate}T00:00:00`)
    if (Number.isNaN(birthDate.getTime())) return false

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1
    }

    return age < 18
  }, [form.birthDate])

  const handleProfileClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    to: string,
  ) => {
    if (to !== '#preinscription') return

    event.preventDefault()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = event.target
    const { name } = target
    const value =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (formStatus === 'error') {
      setFormStatus('idle')
      setFormError('')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError('')

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.birthDate ||
      !form.category ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      setFormStatus('error')
      setFormError('Merci de compléter tous les champs obligatoires.')
      return
    }

    if (
      isMinor &&
      (!form.legalGuardianFirstName.trim() ||
        !form.legalGuardianLastName.trim() ||
        !form.legalGuardianPhone.trim() ||
        !form.legalGuardianEmail.trim())
    ) {
      setFormStatus('error')
      setFormError('Pour un joueur mineur, les coordonnées du responsable légal sont obligatoires.')
      return
    }

    if (!form.consent) {
      setFormStatus('error')
      setFormError('Vous devez autoriser le FC Plouha à vous recontacter pour envoyer la demande.')
      return
    }

    setFormStatus('sending')

    const birthYear = Number(form.birthDate.slice(0, 4))

    const { error } = await supabase.from('registrations').insert([
      {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        birth_year: Number.isFinite(birthYear) ? birthYear : null,
        birth_date: form.birthDate,
        category: form.category,
        email: form.email.trim(),
        phone: form.phone.trim(),
        request_type: 'Joueur',
        message: form.message.trim() || null,
        status: 'Nouveau',
        previous_club: form.firstLicence ? null : form.previousClub.trim() || null,
        first_licence: form.firstLicence,
        legal_guardian_first_name: isMinor ? form.legalGuardianFirstName.trim() : null,
        legal_guardian_last_name: isMinor ? form.legalGuardianLastName.trim() : null,
        legal_guardian_email: isMinor ? form.legalGuardianEmail.trim() : null,
        legal_guardian_phone: isMinor ? form.legalGuardianPhone.trim() : null,
        contact_consent: true,
      },
    ])

    if (error) {
      console.error(error)
      setFormStatus('error')
      setFormError("La pré-inscription n'a pas pu être envoyée. Merci de réessayer.")
      return
    }

    setForm(emptyForm)
    setFormStatus('sent')
  }

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
              Choisissez votre profil pour accéder directement à la démarche correspondante.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {profiles.map((profile) => {
              const Icon = profile.icon

              return (
                <Link
                  key={profile.title}
                  to={profile.to}
                  onClick={(event) => handleProfileClick(event, profile.to)}
                  className="group block rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--club-yellow)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--club-yellow)]/20 text-[var(--club-navy-deep)]">
                      <Icon size={24} />
                    </div>
                    <ArrowRight
                      size={20}
                      className="mt-2 text-[var(--club-navy-deep)]/25 transition-transform group-hover:translate-x-1 group-hover:text-[var(--club-red)]"
                    />
                  </div>

                  <h3 className="mt-5 font-condensed text-2xl font-bold text-[var(--club-navy-deep)]">
                    {profile.title}
                  </h3>

                  <p className="mt-3 leading-relaxed text-[var(--club-navy-deep)]/65">
                    {profile.text}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 font-condensed font-bold text-[var(--club-red)] transition group-hover:gap-3">
                    {profile.action}
                    <ArrowRight size={18} />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <section
          id="preinscription"
          ref={formRef}
          className="scroll-mt-24 border-y border-black/5 bg-[var(--club-cream)]/55"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
            <div className="max-w-3xl">
              <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
                SAISON 2026/2027
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl text-[var(--club-navy-deep)]">
                Pré-inscription joueur / joueuse
              </h2>
              <p className="mt-4 font-condensed text-lg leading-relaxed text-[var(--club-navy-deep)]/65">
                Ces informations nous permettent de préparer votre demande et de vous
                recontacter. Cette démarche ne remplace pas la validation définitive de
                la licence.
              </p>
            </div>

            {formStatus === 'sent' ? (
              <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 sm:p-8">
                <div className="flex gap-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={28} />
                  <div>
                    <h3 className="font-condensed text-2xl font-bold text-green-900">
                      Pré-inscription envoyée
                    </h3>
                    <p className="mt-2 text-green-900/75">
                      Votre demande a bien été transmise au FC Plouha. Un responsable du
                      club pourra maintenant vous recontacter pour la suite de l'inscription.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormStatus('idle')}
                      className="mt-5 rounded-xl bg-green-700 px-5 py-3 font-condensed font-bold text-white hover:bg-green-800 transition"
                    >
                      Faire une autre pré-inscription
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 rounded-2xl border border-black/5 bg-white p-5 sm:p-8 shadow-sm"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                      Prénom du licencié *
                    </label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      autoComplete="given-name"
                      className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                    />
                  </div>

                  <div>
                    <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                      Nom du licencié *
                    </label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                      className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                    />
                  </div>

                  <div>
                    <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={form.birthDate}
                      onChange={handleChange}
                      max={new Date().toISOString().slice(0, 10)}
                      className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                    />
                  </div>

                  <div>
                    <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                      Catégorie souhaitée *
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                    >
                      <option value="">Choisir une catégorie</option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                      E-mail de contact *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                    />
                  </div>

                  <div>
                    <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                      Téléphone de contact *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-black/5 bg-[var(--club-cream)]/45 p-4 sm:p-5">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="firstLicence"
                      checked={form.firstLicence}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                        Première licence / aucun club précédent
                      </span>
                      <span className="mt-1 block text-sm text-[var(--club-navy-deep)]/60">
                        Cochez cette case si le joueur ou la joueuse n'était licencié(e)
                        dans aucun autre club.
                      </span>
                    </span>
                  </label>

                  {!form.firstLicence && (
                    <div className="mt-4">
                      <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                        Club précédent
                      </label>
                      <input
                        name="previousClub"
                        value={form.previousClub}
                        onChange={handleChange}
                        placeholder="Nom du club, si concerné"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                      />
                    </div>
                  )}
                </div>

                {isMinor && (
                  <div className="mt-6 rounded-2xl border border-[var(--club-yellow)]/50 bg-[var(--club-yellow)]/10 p-5">
                    <h3 className="font-condensed text-xl font-bold text-[var(--club-navy-deep)]">
                      Responsable légal
                    </h3>
                    <p className="mt-1 text-sm text-[var(--club-navy-deep)]/60">
                      Le licencié étant mineur, ces coordonnées sont obligatoires.
                    </p>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                          Prénom *
                        </label>
                        <input
                          name="legalGuardianFirstName"
                          value={form.legalGuardianFirstName}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                        />
                      </div>

                      <div>
                        <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                          Nom *
                        </label>
                        <input
                          name="legalGuardianLastName"
                          value={form.legalGuardianLastName}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                        />
                      </div>

                      <div>
                        <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          name="legalGuardianEmail"
                          value={form.legalGuardianEmail}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                        />
                      </div>

                      <div>
                        <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          name="legalGuardianPhone"
                          value={form.legalGuardianPhone}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <label className="block font-condensed font-bold text-[var(--club-navy-deep)]">
                    Message / informations complémentaires
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Une question, une précision ou une information utile pour le club..."
                    className="mt-2 w-full resize-none rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                  />
                </div>

                <label className="mt-6 flex items-start gap-3 rounded-xl border border-black/5 p-4">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={form.consent}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm leading-relaxed text-[var(--club-navy-deep)]/70">
                    J'autorise le Football Club Plouha à utiliser les informations
                    renseignées afin de traiter cette demande de pré-inscription et de me
                    recontacter. *
                  </span>
                </label>

                {formStatus === 'error' && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="submit"
                    disabled={formStatus === 'sending'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-navy-deep)] px-6 py-3.5 font-condensed font-bold text-white hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {formStatus === 'sending' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Envoyer ma pré-inscription
                      </>
                    )}
                  </button>

                  <p className="text-xs leading-relaxed text-[var(--club-navy-deep)]/50">
                    Les champs marqués d'un * sont obligatoires.
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {fees.length > 0 && (
          <section className="border-b border-black/5 bg-white">
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
