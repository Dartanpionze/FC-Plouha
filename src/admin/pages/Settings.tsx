import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
} from 'lucide-react'

type ClubSettings = {
  id: number
  club_name: string | null
  short_name: string | null
  season: string | null
  logo_url: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  email: string | null
  phone: string | null
  facebook_url: string | null
  instagram_url: string | null
  description: string | null
}

export default function Settings() {
  const [settings, setSettings] = useState<ClubSettings | null>(null)

  const [clubName, setClubName] = useState('')
  const [shortName, setShortName] = useState('')
  const [season, setSeason] = useState('')

  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')

  const [description, setDescription] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('club_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error(error)
      setMessage('Impossible de récupérer les paramètres du club.')
      setLoading(false)
      return
    }

    setSettings(data)

    setClubName(data.club_name || '')
    setShortName(data.short_name || '')
    setSeason(data.season || '')

    setAddress(data.address || '')
    setPostalCode(data.postal_code || '')
    setCity(data.city || '')

    setEmail(data.email || '')
    setPhone(data.phone || '')

    setFacebookUrl(data.facebook_url || '')
    setInstagramUrl(data.instagram_url || '')

    setDescription(data.description || '')

    setLoading(false)
  }

  const saveSettings = async () => {
    if (!settings) return

    if (!clubName.trim()) {
      setMessage('Le nom du club est obligatoire.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('club_settings')
      .update({
        club_name: clubName,
        short_name: shortName,
        season,
        address: address || null,
        postal_code: postalCode || null,
        city: city || null,
        email: email || null,
        phone: phone || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)

    if (error) {
      console.error(error)
      setMessage("Erreur lors de l'enregistrement des paramètres.")
      setSaving(false)
      return
    }

    setMessage('Paramètres enregistrés avec succès.')
    setSaving(false)

    fetchSettings()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-slate-400">
          Chargement des paramètres...
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">

      <div className="mb-8">
        <p className="text-sm text-slate-400 mb-1">
          Configuration
        </p>

        <h1 className="text-3xl font-bold tracking-tight">
          Paramètres du club
        </h1>

        <p className="mt-2 text-slate-400">
          Modifiez les informations générales du FC Plouha.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      <div className="space-y-6">

        {/* IDENTITE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2
                size={20}
                className="text-[var(--club-yellow)]"
              />
            </div>

            <div>
              <h2 className="font-bold text-lg">
                Identité du club
              </h2>

              <p className="text-sm text-slate-500">
                Informations principales du FC Plouha.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom complet
              </label>

              <input
                type="text"
                value={clubName}
                onChange={(e) =>
                  setClubName(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom court
              </label>

              <input
                type="text"
                value={shortName}
                onChange={(e) =>
                  setShortName(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Saison actuelle
              </label>

              <input
                type="text"
                placeholder="2026/2027"
                value={season}
                onChange={(e) =>
                  setSeason(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

          </div>
        </section>

        {/* ADRESSE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center gap-3 mb-6">
            <MapPin
              size={20}
              className="text-[var(--club-yellow)]"
            />

            <div>
              <h2 className="font-bold text-lg">
                Adresse
              </h2>

              <p className="text-sm text-slate-500">
                Coordonnées géographiques du club.
              </p>
            </div>
          </div>

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Adresse
              </label>

              <input
                type="text"
                placeholder="Adresse du stade ou du siège"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Code postal
                </label>

                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) =>
                    setPostalCode(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Ville
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

            </div>

          </div>
        </section>

        {/* CONTACT */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="font-bold text-lg mb-6">
            Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                <span className="inline-flex items-center gap-2">
                  <Mail size={15} />
                  E-mail
                </span>
              </label>

              <input
                type="email"
                placeholder="contact@fcplouha.fr"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                <span className="inline-flex items-center gap-2">
                  <Phone size={15} />
                  Téléphone
                </span>
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

          </div>
        </section>

        {/* RESEAUX SOCIAUX */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="font-bold text-lg mb-6">
            Réseaux sociaux
          </h2>

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                <span className="inline-flex items-center gap-2">
                  <Facebook size={15} />
                  Facebook
                </span>
              </label>

              <input
                type="url"
                placeholder="https://facebook.com/..."
                value={facebookUrl}
                onChange={(e) =>
                  setFacebookUrl(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                <span className="inline-flex items-center gap-2">
                  <Instagram size={15} />
                  Instagram
                </span>
              </label>

              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={instagramUrl}
                onChange={(e) =>
                  setInstagramUrl(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

          </div>
        </section>

        {/* DESCRIPTION */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="font-bold text-lg mb-2">
            Présentation du club
          </h2>

          <p className="text-sm text-slate-500 mb-5">
            Texte général pouvant être réutilisé sur le site.
          </p>

          <textarea
            rows={8}
            placeholder="Présentation du FC Plouha..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30 resize-none"
          />

        </section>

        {/* ENREGISTRER */}
        <div className="flex justify-end">

          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save size={18} />

            {saving
              ? 'Enregistrement...'
              : 'Enregistrer les modifications'}
          </button>

        </div>

      </div>

    </div>
  )
}
