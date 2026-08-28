import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Clock,
  Mail,
  MapPin,
  Phone,
  Loader2,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'

type ClubSettings = {
  club_name: string | null
  short_name: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  email: string | null
  phone: string | null
}

type TeamCategory = {
  category: string | null
}

type FormFields = {
  firstName: string
  lastName: string
  email: string
  phone: string
  subject: string
  birthYear: string
  category: string
  message: string
}

function ContactPage() {
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [teamCategories, setTeamCategories] = useState<string[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [pageDataError, setPageDataError] = useState(false)

  const [fields, setFields] = useState<FormFields>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    birthYear: '',
    category: '',
    message: '',
  })

  const [status, setStatus] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')
  const [formError, setFormError] = useState('')

  const isRegistration = fields.subject === 'Inscription'

  const fetchPageData = async () => {
    setLoadingSettings(true)
    setPageDataError(false)

    try {
      const [settingsResult, teamsResult] = await Promise.all([
        supabase
          .from('club_settings')
          .select(`
            club_name,
            short_name,
            address,
            postal_code,
            city,
            email,
            phone
          `)
          .limit(1)
          .single(),

        supabase
          .from('teams')
          .select('category')
          .eq('active', true)
          .order('category', { ascending: true }),
      ])

      if (settingsResult.error) {
        console.error(settingsResult.error)
        setPageDataError(true)
      } else {
        setSettings(settingsResult.data)
      }

      if (teamsResult.error) {
        console.error(teamsResult.error)
        setPageDataError(true)
      } else {
        const categories = Array.from(
          new Set(
            ((teamsResult.data || []) as TeamCategory[])
              .map((team) => team.category?.trim())
              .filter((category): category is string => Boolean(category)),
          ),
        )

        setTeamCategories(categories)
      }
    } catch (fetchError) {
      console.error(fetchError)
      setPageDataError(true)
    } finally {
      setLoadingSettings(false)
    }
  }

  useEffect(() => {
    fetchPageData()
  }, [])

  const availableCategories = useMemo(() => {
    if (teamCategories.length > 0) {
      return teamCategories
    }

    return [
      'École de foot',
      'Jeunes',
      'Séniors',
      'Je ne sais pas',
    ]
  }, [teamCategories])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target

    setFields((current) => ({
      ...current,
      [name]: value,
      ...(name === 'subject' && value !== 'Inscription'
        ? {
            birthYear: '',
            category: '',
          }
        : {}),
    }))

    if (status === 'error') {
      setStatus('idle')
      setFormError('')
    }
  }

  const submitRequest = async () => {
    const requestType =
      fields.subject === 'Inscription'
        ? 'Joueur'
        : fields.subject === 'Benevolat'
          ? 'Bénévole'
          : fields.subject === 'Partenariat'
            ? 'Partenaire'
            : 'Autre'

    const { error } = await supabase
      .from('registrations')
      .insert([
        {
          first_name: fields.firstName.trim(),
          last_name: fields.lastName.trim(),
          birth_year:
            fields.subject === 'Inscription' && fields.birthYear !== ''
              ? Number(fields.birthYear)
              : null,
          category:
            fields.subject === 'Inscription'
              ? fields.category || null
              : null,
          email: fields.email.trim() || null,
          phone: fields.phone.trim() || null,
          request_type: requestType,
          message: fields.message.trim() || null,
          status: 'Nouveau',
        },
      ])

    if (error) {
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !fields.firstName.trim() ||
      !fields.lastName.trim() ||
      !fields.email.trim() ||
      !fields.subject
    ) {
      setFormError('Merci de remplir tous les champs obligatoires.')
      setStatus('error')
      return
    }

    if (
      isRegistration &&
      (!fields.birthYear || !fields.category)
    ) {
      setFormError(
        "Merci d'indiquer l'année de naissance et la catégorie souhaitée.",
      )
      setStatus('error')
      return
    }

    setFormError('')
    setStatus('sending')

    try {
      await submitRequest()

      setStatus('sent')

      setFields({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        birthYear: '',
        category: '',
        message: '',
      })
    } catch (error) {
      console.error(error)
      setFormError(
        "Impossible d'envoyer votre demande pour le moment. Merci de réessayer.",
      )
      setStatus('error')
    }
  }

  const clubName =
    settings?.club_name || 'Football Club Plouha'

  const shortName =
    settings?.short_name || 'FC Plouha'

  const addressLine =
    [
      settings?.address,
      [settings?.postal_code, settings?.city]
        .filter(Boolean)
        .join(' '),
    ]
      .filter(Boolean)
      .join(', ') || 'Plouha'

  return (
    <div>
      <Seo
        title="Contact & inscriptions"
        description="Contactez le Football Club Plouha, inscrivez-vous comme joueur ou bénévole, ou proposez un partenariat."
      />

      {/* HERO */}
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">

        <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 text-center">

          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            RESTONS EN CONTACT
          </span>

          <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            Contact & inscriptions
          </h1>

          <p className="mt-6 text-white/70 font-condensed text-lg 2xl:text-xl max-w-2xl 2xl:max-w-3xl mx-auto 2xl:leading-relaxed">
            Inscription au club, bénévolat, partenariat ou simple question :
            choisissez votre demande et contactez le FC Plouha.
          </p>

        </div>

      </section>

      {pageDataError && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 text-amber-900">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p className="font-condensed text-sm">
                Certaines informations de contact n'ont pas pu être chargées.
                Le formulaire reste disponible.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPageData}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 font-condensed font-bold text-sm text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      <section className="max-w-6xl 2xl:max-w-[1380px] mx-auto px-4 sm:px-6 2xl:px-8 py-20 2xl:py-24 grid lg:grid-cols-[1fr_1.2fr] gap-14 2xl:gap-20">

        {/* COORDONNEES */}
        <div>

          <h2 className="font-condensed font-bold text-2xl 2xl:text-3xl text-[var(--club-navy-deep)] mb-6">
            Coordonnées
          </h2>

          {loadingSettings ? (
            <div className="flex items-center gap-3 text-[var(--club-navy-deep)]/50 font-condensed">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Chargement des coordonnées...
            </div>
          ) : (
            <ul className="space-y-5">

              <li className="flex gap-3">
                <MapPin
                  className="text-[var(--club-red)] shrink-0 mt-1"
                  size={20}
                />

                <div>
                  <div className="font-condensed font-bold">
                    {shortName}
                  </div>

                  <div className="text-sm text-[var(--club-navy-deep)]/70">
                    {addressLine}
                  </div>
                </div>
              </li>

              {settings?.phone && (
                <li className="flex gap-3">
                  <Phone
                    className="text-[var(--club-red)] shrink-0 mt-1"
                    size={20}
                  />

                  <div>
                    <a
                      href={`tel:${settings.phone.replace(/\s/g, '')}`}
                      className="font-condensed font-bold hover:text-[var(--club-red)] transition-colors"
                    >
                      {settings.phone}
                    </a>

                    <div className="text-sm text-[var(--club-navy-deep)]/70">
                      Contact du club
                    </div>
                  </div>
                </li>
              )}

              {settings?.email && (
                <li className="flex gap-3">
                  <Mail
                    className="text-[var(--club-red)] shrink-0 mt-1"
                    size={20}
                  />

                  <div>
                    <a
                      href={`mailto:${settings.email}`}
                      className="font-condensed font-bold hover:text-[var(--club-red)] transition-colors"
                    >
                      {settings.email}
                    </a>

                    <div className="text-sm text-[var(--club-navy-deep)]/70">
                      Adresse e-mail du club
                    </div>
                  </div>
                </li>
              )}

              <li className="flex gap-3">
                <Clock
                  className="text-[var(--club-red)] shrink-0 mt-1"
                  size={20}
                />

                <div>
                  <div className="font-condensed font-bold">
                    {clubName}
                  </div>

                  <div className="text-sm text-[var(--club-navy-deep)]/70">
                    Contactez-nous avant de vous déplacer.
                  </div>
                </div>
              </li>

            </ul>
          )}

          <div className="mt-8 rounded-2xl overflow-hidden border border-black/10 h-64">

            <iframe
              title={`Localisation du ${shortName}`}
              src="https://www.openstreetmap.org/export/embed.html?bbox=-2.9550%2C48.6650%2C-2.9250%2C48.6850&layer=mapnik"
              className="w-full h-full border-0"
              loading="lazy"
            />

          </div>

        </div>

        {/* FORMULAIRE */}
        <div className="bg-white rounded-2xl border border-black/5 p-6 sm:p-8 shadow-sm">

          <div className="flex items-start gap-3 mb-6">

            <div className="w-11 h-11 rounded-xl bg-[var(--club-yellow)]/20 flex items-center justify-center shrink-0">
              <UserPlus
                size={21}
                className="text-[var(--club-navy-deep)]"
              />
            </div>

            <div>
              <h2 className="font-condensed font-bold text-2xl 2xl:text-3xl text-[var(--club-navy-deep)]">
                Votre demande
              </h2>

              <p className="text-sm text-[var(--club-navy-deep)]/55 mt-1">
                Les champs s'adaptent automatiquement selon votre demande.
              </p>
            </div>

          </div>

          {status === 'sent' ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl bg-[var(--club-yellow)]/15 border border-[var(--club-yellow)] p-6 text-center"
            >

              <p className="font-condensed font-bold text-[var(--club-navy-deep)]">
                {isRegistration
                  ? "Votre demande d'inscription a bien été enregistrée !"
                  : 'Merci, votre message a bien été envoyé !'}
              </p>

              <p className="text-sm text-[var(--club-navy-deep)]/70 mt-1">
                Un membre du club vous recontactera rapidement.
              </p>

              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-5 text-sm font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)]"
              >
                Envoyer une autre demande
              </button>

            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              aria-busy={status === 'sending'}
              className="space-y-5"
            >

              <label className="block">
                <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                  Je souhaite...
                </span>

                <select
                  name="subject"
                  required
                  value={fields.subject}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                >
                  <option value="">
                    Choisir une demande
                  </option>

                  <option value="Inscription">
                    M'inscrire / inscrire mon enfant
                  </option>

                  <option value="Benevolat">
                    Devenir bénévole
                  </option>

                  <option value="Partenariat">
                    Devenir partenaire / sponsor
                  </option>

                  <option value="Autre">
                    Poser une autre question
                  </option>
                </select>
              </label>

              <div className="grid sm:grid-cols-2 gap-5">

                <label className="block">
                  <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                    Prénom
                  </span>

                  <input
                    type="text"
                    name="firstName"
                    required
                    value={fields.firstName}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                    placeholder="Prénom"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                    Nom
                  </span>

                  <input
                    type="text"
                    name="lastName"
                    required
                    value={fields.lastName}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                    placeholder="Nom"
                  />
                </label>

              </div>

              <div className="grid sm:grid-cols-2 gap-5">

                <label className="block">
                  <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                    E-mail
                  </span>

                  <input
                    type="email"
                    name="email"
                    required
                    value={fields.email}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                    placeholder="vous@exemple.fr"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                    Téléphone
                  </span>

                  <input
                    type="tel"
                    name="phone"
                    value={fields.phone}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                    placeholder="06..."
                  />
                </label>

              </div>

              {/* CHAMPS INSCRIPTION */}
              {isRegistration && (
                <div className="rounded-2xl bg-[var(--club-navy)]/[0.04] border border-[var(--club-navy)]/10 p-5 space-y-5">

                  <div>
                    <h3 className="font-condensed font-bold text-[var(--club-navy-deep)]">
                      Informations pour l'inscription
                    </h3>

                    <p className="text-xs text-[var(--club-navy-deep)]/55 mt-1">
                      Ces informations aideront le club à orienter la demande vers la bonne équipe.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">

                    <label className="block">
                      <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                        Année de naissance
                      </span>

                      <input
                        type="number"
                        name="birthYear"
                        required={isRegistration}
                        min="1900"
                        max={new Date().getFullYear()}
                        value={fields.birthYear}
                        onChange={handleChange}
                        className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                        placeholder="Ex : 2014"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                        Catégorie souhaitée
                      </span>

                      <select
                        name="category"
                        required={isRegistration}
                        value={fields.category}
                        onChange={handleChange}
                        className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                      >
                        <option value="">
                          Choisir une catégorie
                        </option>

                        {availableCategories.map(
                          (category) => (
                            <option
                              key={category}
                              value={category}
                            >
                              {category}
                            </option>
                          ),
                        )}

                        {!availableCategories.includes(
                          'Je ne sais pas',
                        ) && (
                          <option value="Je ne sais pas">
                            Je ne sais pas
                          </option>
                        )}

                      </select>
                    </label>

                  </div>

                </div>
              )}

              <label className="block">
                <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                  Message
                  {!isRegistration && ' *'}
                </span>

                <textarea
                  name="message"
                  required={!isRegistration}
                  rows={5}
                  value={fields.message}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                  placeholder={
                    isRegistration
                      ? 'Précisions éventuelles : ancien club, expérience, disponibilités...'
                      : 'Votre message...'
                  }
                />
              </label>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 2xl:gap-3 bg-[var(--club-red)] text-white font-condensed font-bold 2xl:text-lg px-7 py-3 2xl:px-8 2xl:py-3.5 rounded-lg hover:bg-[var(--club-red-deep)] transition-colors disabled:opacity-60"
              >
                {status === 'sending'
                  ? 'Envoi en cours...'
                  : isRegistration
                    ? "Envoyer ma demande d'inscription"
                    : 'Envoyer le message'}
              </button>

              {status === 'error' && formError && (
                <p
                  role="alert"
                  className="text-sm text-[var(--club-red)]"
                >
                  {formError}
                </p>
              )}

            </form>
          )}

        </div>

      </section>

    </div>
  )
}

export default ContactPage
