import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminAccess } from '@/admin/hooks/useAdminAccess'
import {
  DEFAULT_SITE_VISIBILITY,
  normalizeSiteVisibility,
  type PublicSectionKey,
  type SiteVisibility,
} from '@/lib/siteVisibility'
import {
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
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
  founded_year: number | null
  members_count: number | null
  volunteers_count: number | null
  district_titles: number | null
  site_visibility: Partial<SiteVisibility> | null
}

export default function Settings() {
  const { can } = useAdminAccess()
  const canUpdate = can('settings', 'update')

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
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)

  const [foundedYear, setFoundedYear] = useState('')
  const [membersCount, setMembersCount] = useState('')
  const [volunteersCount, setVolunteersCount] = useState('')
  const [districtTitles, setDistrictTitles] = useState('')
  const [siteVisibility, setSiteVisibility] = useState<SiteVisibility>(
    DEFAULT_SITE_VISIBILITY,
  )

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setLoadError(false)

    try {
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .single()

      if (error || !data) {
        if (error) console.error(error)
        setLoadError(true)
        setMessage(
          'Impossible de récupérer les paramètres du club. Vous pouvez réessayer.',
        )
        return false
      }

      setSettings(data)

      setClubName(data.club_name || '')
      setShortName(data.short_name || '')
      setSeason(data.season || '')

      setFoundedYear(
        data.founded_year !== null
          ? data.founded_year.toString()
          : '',
      )

      setMembersCount(
        data.members_count !== null
          ? data.members_count.toString()
          : '0',
      )

      setVolunteersCount(
        data.volunteers_count !== null
          ? data.volunteers_count.toString()
          : '0',
      )

      setDistrictTitles(
        data.district_titles !== null
          ? data.district_titles.toString()
          : '0',
      )

      setAddress(data.address || '')
      setPostalCode(data.postal_code || '')
      setCity(data.city || '')

      setEmail(data.email || '')
      setPhone(data.phone || '')

      setFacebookUrl(data.facebook_url || '')
      setInstagramUrl(data.instagram_url || '')

      setDescription(data.description || '')
      setSiteVisibility(normalizeSiteVisibility(data.site_visibility))

      return true
    } catch (fetchError) {
      console.error(fetchError)
      setLoadError(true)
      setMessage(
        'Impossible de récupérer les paramètres du club. Vous pouvez réessayer.',
      )
      return false
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    if (!canUpdate) {
      setMessage("Vous n'avez pas l'autorisation de modifier les paramètres.")
      return
    }

    if (!clubName.trim()) {
      setMessage('Le nom du club est obligatoire.')
      return
    }

    const parsedFoundedYear =
      foundedYear === '' ? null : Number(foundedYear)

    if (
      parsedFoundedYear !== null &&
      (!Number.isInteger(parsedFoundedYear) ||
        parsedFoundedYear < 1800 ||
        parsedFoundedYear > 2100)
    ) {
      setMessage("L'année de fondation doit être comprise entre 1800 et 2100.")
      return
    }

    const numericCounts = [
      ['Licenciés', membersCount],
      ['Bénévoles', volunteersCount],
      ['Titres District', districtTitles],
    ] as const

    for (const [label, value] of numericCounts) {
      if (
        value !== '' &&
        (!Number.isInteger(Number(value)) || Number(value) < 0)
      ) {
        setMessage(`${label} doit être un nombre entier positif.`)
        return
      }
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setMessage("L'adresse e-mail n'est pas valide.")
      return
    }

    const socialUrls = [
      ['Facebook', facebookUrl],
      ['Instagram', instagramUrl],
    ] as const

    for (const [label, value] of socialUrls) {
      if (!value.trim()) continue

      try {
        const parsedUrl = new URL(value.trim())

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('unsupported protocol')
        }
      } catch {
        setMessage(`L'adresse ${label} doit être une URL complète valide.`)
        return
      }
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('club_settings')
      .update({
        club_name: clubName,
        short_name: shortName,
        season,
        founded_year:
          foundedYear === ''
          ? null
          : Number(foundedYear),
        
        members_count:
          membersCount === ''
          ? 0
          : Number(membersCount),
        
        volunteers_count:
          volunteersCount === ''
          ? 0
          : Number(volunteersCount),
        
        district_titles:
          districtTitles === ''
          ? 0
          : Number(districtTitles),
        address: address || null,
        postal_code: postalCode || null,
        city: city || null,
        email: email || null,
        phone: phone || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        description: description || null,
        site_visibility: siteVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)

    if (error) {
      console.error(error)
      setMessage("Erreur lors de l'enregistrement des paramètres.")
      setSaving(false)
      return
    }

    const refreshed = await fetchSettings()

    if (refreshed) {
      setMessage('Paramètres enregistrés avec succès.')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <p className="text-slate-400">
          Chargement des paramètres...
        </p>
      </div>
    )
  }

  if (loadError || !settings) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold">
            Paramètres indisponibles
          </h1>

          <p className="mt-3 text-slate-400">
            Impossible de charger les paramètres du club. Aucun champ
            modifiable n'est affiché afin d'éviter d'enregistrer des données
            incomplètes.
          </p>

          <button
            type="button"
            onClick={() => fetchSettings()}
            className="mt-5 rounded-xl bg-[var(--club-yellow)] px-4 py-2.5 font-bold text-[var(--club-navy-deep)]"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Configuration
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Paramètres du club
          </h1>

          <p className="mt-2 text-slate-400">
            Centralisez les informations générales utilisées sur le site.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition"
          >
            <ExternalLink size={17} />
            Voir le site
          </a>

          <button
            type="button"
            onClick={() => void fetchSettings()}
            disabled={loading || saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition"
          >
            <RefreshCw size={17} />
            Recharger
          </button>

        </div>

      </div>

      {!canUpdate && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[var(--club-yellow)]"
          />
          <span>
            Consultation uniquement : votre compte ne peut pas modifier les paramètres.
          </span>
        </div>
      )}

      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      <div className="space-y-6">

        {/* IDENTITE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
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
                disabled={!canUpdate}
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
                disabled={!canUpdate}
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
                disabled={!canUpdate}
                type="text"
                placeholder="2026/2027"
                value={season}
                onChange={(e) =>
                  setSeason(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Année de fondation
              </label>

              <input
                disabled={!canUpdate}
                type="number"
                min="1800"
                max="2100"
                placeholder="2026"
                value={foundedYear}
                onChange={(e) =>
                  setFoundedYear(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
              />
            </div>

          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="font-semibold mb-4">
              Chiffres du club
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Licenciés
                </label>

                <input
                  disabled={!canUpdate}
                  type="number"
                  min="0"
                  value={membersCount}
                  onChange={(e) =>
                    setMembersCount(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Bénévoles
                </label>

                <input
                  disabled={!canUpdate}
                  type="number"
                  min="0"
                  value={volunteersCount}
                  onChange={(e) =>
                    setVolunteersCount(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Titres District
                </label>

                <input
                  disabled={!canUpdate}
                  type="number"
                  min="0"
                  value={districtTitles}
                  onChange={(e) =>
                    setDistrictTitles(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

            </div>
          </div>
        </section>

        {/* ADRESSE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

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
                disabled={!canUpdate}
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
                  disabled={!canUpdate}
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
                  disabled={!canUpdate}
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
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

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
                disabled={!canUpdate}
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
                disabled={!canUpdate}
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
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

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
                disabled={!canUpdate}
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
                disabled={!canUpdate}
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

        {/* VISIBILITE DU SITE PUBLIC */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <Eye size={20} className="text-[var(--club-yellow)]" />
            <h2 className="font-bold text-lg">
              Visibilité du site public
            </h2>
          </div>

          <p className="text-sm text-slate-500 mb-5">
            Masquez temporairement une rubrique sans supprimer son contenu.
            Une rubrique masquée disparaît du menu et du pied de page, et son
            adresse publique redirige vers l'accueil.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['club', 'Le club'],
              ['news', 'Actualités'],
              ['teams', 'Équipes'],
              ['calendar', 'Calendrier'],
              ['gallery', 'Galerie'],
              ['partners', 'Partenaires'],
              ['contact', 'Contact'],
            ] as Array<[PublicSectionKey, string]>).map(([key, label]) => {
              const visible = siteVisibility[key]

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!canUpdate}
                  onClick={() =>
                    setSiteVisibility((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                  className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                    visible
                      ? 'border-emerald-500/20 bg-emerald-500/[0.08]'
                      : 'border-white/10 bg-slate-950'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span>
                    <span className="block font-semibold">{label}</span>
                    <span className="block mt-0.5 text-xs text-slate-500">
                      {visible ? 'Visible sur le site' : 'Masqué au public'}
                    </span>
                  </span>

                  {visible ? (
                    <Eye size={19} className="shrink-0 text-emerald-400" />
                  ) : (
                    <EyeOff size={19} className="shrink-0 text-slate-500" />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* DESCRIPTION */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

          <h2 className="font-bold text-lg mb-2">
            Présentation du club
          </h2>

          <p className="text-sm text-slate-500 mb-5">
            Texte général pouvant être réutilisé sur le site.
          </p>

          <textarea
            disabled={!canUpdate}
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
        {canUpdate && (
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
        )}

      </div>

    </div>
  )
}
