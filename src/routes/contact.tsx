import { useEffect, useState } from 'react'
import { Clock, Mail, MapPin, Phone, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ClubSettings = {
  club_name: string | null
  short_name: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  email: string | null
  phone: string | null
}

function ContactPage() {
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const [fields, setFields] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [status, setStatus] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
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
        .single()

      if (error) {
        console.error(error)
      } else {
        setSettings(data)
      }

      setLoadingSettings(false)
    }

    fetchSettings()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFields({
      ...fields,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l’envoi')
      }

      setStatus('sent')
      setFields({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      console.error(error)
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

      {/* HERO */}
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">

          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            RESTONS EN CONTACT
          </span>

          <h1 className="mt-4 text-4xl sm:text-6xl text-white">
            Contact
          </h1>

          <p className="mt-6 text-white/70 font-condensed text-lg max-w-2xl mx-auto">
            Une question sur une inscription, un partenariat
            ou la vie du club ? Écrivez-nous, un bénévole
            vous répondra rapidement.
          </p>

        </div>

      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-[1fr_1.2fr] gap-14">

        {/* COORDONNEES */}
        <div>

          <h2 className="font-condensed font-bold text-2xl text-[var(--club-navy-deep)] mb-6">
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

          <h2 className="font-condensed font-bold text-2xl text-[var(--club-navy-deep)] mb-6">
            Envoyer un message
          </h2>

          {status === 'sent' ? (
            <div className="rounded-xl bg-[var(--club-yellow)]/15 border border-[var(--club-yellow)] p-6 text-center">

              <p className="font-condensed font-bold text-[var(--club-navy-deep)]">
                Merci, votre message a bien été envoyé !
              </p>

              <p className="text-sm text-[var(--club-navy-deep)]/70 mt-1">
                Un membre du club vous recontactera rapidement.
              </p>

            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div className="grid sm:grid-cols-2 gap-5">

                <label className="block">
                  <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                    Nom complet
                  </span>

                  <input
                    type="text"
                    name="name"
                    required
                    value={fields.name}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                    placeholder="Votre nom"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                    Email
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

              </div>

              <label className="block">
                <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                  Sujet
                </span>

                <select
                  name="subject"
                  required
                  value={fields.subject}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                >
                  <option value="">
                    Choisir un sujet
                  </option>
                  <option value="Inscription">
                    Inscription / école de foot
                  </option>
                  <option value="Partenariat">
                    Partenariat / sponsoring
                  </option>
                  <option value="Benevolat">
                    Bénévolat
                  </option>
                  <option value="Autre">
                    Autre demande
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-condensed font-semibold text-[var(--club-navy-deep)]/80">
                  Message
                </span>

                <textarea
                  name="message"
                  required
                  rows={5}
                  value={fields.message}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--club-blue-light)]"
                  placeholder="Votre message..."
                />
              </label>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--club-red)] text-white font-condensed font-bold px-7 py-3 rounded-lg hover:bg-[var(--club-red-deep)] transition-colors disabled:opacity-60"
              >
                {status === 'sending'
                  ? 'Envoi en cours...'
                  : 'Envoyer le message'}
              </button>

              {status === 'error' && (
                <p className="text-sm text-[var(--club-red)]">
                  Une erreur est survenue, merci de réessayer.
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
