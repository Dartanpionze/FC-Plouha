import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ClubCrest } from './ClubCrest'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_SITE_VISIBILITY,
  normalizeSiteVisibility,
  type PublicSectionKey,
  type SiteVisibility,
} from '@/lib/siteVisibility'

const links: Array<{
  to: string
  label: string
  section?: PublicSectionKey
}> = [
  { to: '/', label: 'Accueil' },
  { to: '/club', label: 'Le club', section: 'club' },
  { to: '/actualites', label: 'Actualités', section: 'news' },
  { to: '/equipes', label: 'Équipes', section: 'teams' },
  { to: '/calendrier', label: 'Calendrier', section: 'calendar' },
  { to: '/galerie', label: 'Galerie', section: 'gallery' },
  { to: '/partenaires', label: 'Partenaires', section: 'partners' },
  { to: '/contact', label: 'Contact', section: 'contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [visibility, setVisibility] = useState<SiteVisibility>(
    DEFAULT_SITE_VISIBILITY,
  )
  const { pathname } = useLocation()

  useEffect(() => {
    const fetchVisibility = async () => {
      const { data, error } = await supabase
        .from('club_settings')
        .select('site_visibility')
        .limit(1)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setVisibility(normalizeSiteVisibility(data?.site_visibility))
    }

    void fetchVisibility()
  }, [])

  const visibleLinks = links.filter(
    (link) => !link.section || visibility[link.section],
  )

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 bg-[var(--club-navy)] shadow-lg shadow-black/20">
      <div className="h-1.5 stripe-diagonal" />
      <nav
        aria-label="Navigation principale"
        className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 flex items-center justify-between h-20 2xl:h-24"
      >
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <ClubCrest className="w-14 h-14 2xl:w-16 2xl:h-16" />
          <span className="text-white leading-tight">
            <span className="block font-display text-lg 2xl:text-2xl tracking-wide">
              FC Plouha
            </span>
            <span className="block font-condensed text-[var(--club-yellow)] text-xs 2xl:text-sm font-semibold tracking-[0.2em]">
              LES FALAISES
            </span>
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1 2xl:gap-2 font-condensed font-semibold text-sm 2xl:text-base tracking-wide">
          {visibleLinks.map((link) => {
            const active =
              link.to === '/'
                ? pathname === '/'
                : pathname === link.to || pathname.startsWith(`${link.to}/`)
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-2 2xl:px-4 2xl:py-2.5 rounded-md transition-colors block ${
                    active
                      ? 'text-[var(--club-navy)] bg-[var(--club-yellow)]'
                      : 'text-white/85 hover:text-[var(--club-yellow)]'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="lg:hidden text-white p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-navigation"
          className="lg:hidden bg-[var(--club-navy-deep)] border-t border-white/10"
        >
          <ul className="px-4 py-3 flex flex-col font-condensed font-semibold text-base">
            {visibleLinks.map((link) => {
              const active =
                link.to === '/'
                  ? pathname === '/'
                  : pathname === link.to || pathname.startsWith(`${link.to}/`)
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`block py-3 border-b border-white/5 ${
                      active ? 'text-[var(--club-yellow)]' : 'text-white/85'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </header>
  )
}
