import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import { ClubCrest } from './ClubCrest'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_SITE_VISIBILITY,
  normalizeSiteVisibility,
  type SiteVisibility,
} from '@/lib/siteVisibility'

type ClubSettings = {
  club_name: string | null
  short_name: string | null
  description: string | null
  founded_year: number | null
  address: string | null
  postal_code: string | null
  city: string | null
  email: string | null
  phone: string | null
  facebook_url: string | null
  instagram_url: string | null
  site_visibility: Partial<SiteVisibility> | null
}

export function Footer() {
  const [settings, setSettings] =
    useState<ClubSettings | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('club_settings')
        .select(`
          club_name,
          short_name,
          description,
          founded_year,
          address,
          postal_code,
          city,
          email,
          phone,
          facebook_url,
          instagram_url,
          site_visibility
        `)
        .limit(1)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setSettings(data)
    }

    fetchSettings()
  }, [])

  const visibility = normalizeSiteVisibility(
    settings?.site_visibility || DEFAULT_SITE_VISIBILITY,
  )

  const clubName =
    settings?.club_name || 'Football Club Plouha'

  const shortName =
    settings?.short_name || 'FC Plouha'

  const foundedYear =
    settings?.founded_year ?? 2026

  const addressLine =
    [
      settings?.address,
      [settings?.postal_code, settings?.city]
        .filter(Boolean)
        .join(' '),
    ]
      .filter(Boolean)
      .join(', ') || 'Plouha'

  const description =
    settings?.description ||
    `Fondé en ${foundedYear}, le ${clubName} fait vivre le football à Plouha autour de ses joueurs, éducateurs, bénévoles et partenaires.`

  return (
    <footer className="bg-[var(--club-navy-deep)] text-white/80">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">

        {/* IDENTITE */}
        <div>

          <div className="flex items-center gap-3 mb-4">
            <ClubCrest className="w-16 h-16" />

            <span className="font-display text-white text-lg">
              {shortName}
            </span>
          </div>

          <p className="text-sm leading-relaxed max-w-xs">
            {description}
          </p>

          {(settings?.facebook_url ||
            settings?.instagram_url) && (
              <div className="flex gap-3 mt-5">

                {settings.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook du club"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--club-yellow)] hover:text-[var(--club-navy-deep)] transition-colors"
                  >
                    <Facebook size={17} />
                  </a>
                )}

                {settings.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram du club"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--club-yellow)] hover:text-[var(--club-navy-deep)] transition-colors"
                  >
                    <Instagram size={17} />
                  </a>
                )}

              </div>
            )}

        </div>

        {/* NAVIGATION */}
        <div>

          <h3 className="font-condensed text-white font-bold text-sm tracking-[0.15em] mb-4">
            NAVIGATION
          </h3>

          <ul className="space-y-2 text-sm font-condensed">
            {visibility.club && (
              <li>
                <Link to="/club" className="hover:text-[var(--club-yellow)]">
                  Le club
                </Link>
              </li>
            )}

            {visibility.teams && (
              <li>
                <Link to="/equipes" className="hover:text-[var(--club-yellow)]">
                  Nos équipes
                </Link>
              </li>
            )}

            {visibility.calendar && (
              <li>
                <Link to="/calendrier" className="hover:text-[var(--club-yellow)]">
                  Calendrier
                </Link>
              </li>
            )}

            {visibility.gallery && (
              <li>
                <Link to="/galerie" className="hover:text-[var(--club-yellow)]">
                  Galerie photos
                </Link>
              </li>
            )}

            {visibility.partners && (
              <li>
                <Link to="/partenaires" className="hover:text-[var(--club-yellow)]">
                  Partenaires
                </Link>
              </li>
            )}
          </ul>

        </div>

        {/* LE CLUB */}
        <div>

          <h3 className="font-condensed text-white font-bold text-sm tracking-[0.15em] mb-4">
            LE CLUB
          </h3>

          <ul className="space-y-2 text-sm font-condensed">
            {visibility.news && (
              <li>
                <Link to="/actualites" className="hover:text-[var(--club-yellow)]">
                  Actualités
                </Link>
              </li>
            )}

            {visibility.contact && (
              <li>
                <Link to="/contact" className="hover:text-[var(--club-yellow)]">
                  Nous contacter
                </Link>
              </li>
            )}

            {visibility.contact && (
              <li>
                <Link to="/contact?subject=Benevolat" className="hover:text-[var(--club-yellow)]">
                  Devenir bénévole
                </Link>
              </li>
            )}

            {visibility.contact && (
              <li>
                <Link to="/contact?subject=Inscription" className="hover:text-[var(--club-yellow)]">
                  Rejoindre le club
                </Link>
              </li>
            )}
          </ul>

        </div>

        {/* CONTACT */}
        <div>

          <h3 className="font-condensed text-white font-bold text-sm tracking-[0.15em] mb-4">
            CONTACT
          </h3>

          <ul className="space-y-3 text-sm">

            <li className="flex gap-2">
              <MapPin
                size={17}
                className="shrink-0 mt-0.5 text-[var(--club-yellow)]"
              />

              <span>
                {shortName}
                <br />
                {addressLine}
              </span>
            </li>

            {settings?.phone && (
              <li className="flex gap-2 items-center">
                <Phone
                  size={17}
                  className="shrink-0 text-[var(--club-yellow)]"
                />

                <a
                  href={`tel:${settings.phone.replace(/\s/g, '')}`}
                  className="hover:text-white transition-colors"
                >
                  {settings.phone}
                </a>
              </li>
            )}

            {settings?.email && (
              <li className="flex gap-2 items-center">
                <Mail
                  size={17}
                  className="shrink-0 text-[var(--club-yellow)]"
                />

                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {settings.email}
                </a>
              </li>
            )}

          </ul>

        </div>

      </div>

      <div className="border-t border-white/10">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs flex flex-col sm:flex-row gap-2 justify-between font-condensed tracking-wide">

          <span>
            © {new Date().getFullYear()} {clubName} — Les Falaises.
            Tous droits réservés.
          </span>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              Club affilié à la Ligue de Bretagne de Football
            </span>
            <Link
              to="/mentions-legales"
              className="hover:text-[var(--club-yellow)] transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              to="/politique-confidentialite"
              className="hover:text-[var(--club-yellow)] transition-colors"
            >
              Confidentialité
            </Link>
          </div>

        </div>

      </div>

    </footer>
  )
}
