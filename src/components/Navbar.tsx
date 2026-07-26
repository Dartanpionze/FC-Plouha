import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ClubCrest } from './ClubCrest'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/club', label: 'Le club' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/equipes', label: 'Équipes' },
  { to: '/calendrier', label: 'Calendrier' },
  { to: '/galerie', label: 'Galerie' },
  { to: '/partenaires', label: 'Partenaires' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <header className="sticky top-0 z-50 bg-[var(--club-navy)] shadow-lg shadow-black/20">
      <div className="h-1.5 stripe-diagonal" />
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <ClubCrest className="w-11 h-11" />
          <span className="text-white leading-tight">
            <span className="block font-display text-lg tracking-wide">
              FC Plouha
            </span>
            <span className="block font-condensed text-[var(--club-yellow)] text-xs font-semibold tracking-[0.2em]">
              LES FALAISES
            </span>
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1 font-condensed font-semibold text-sm tracking-wide">
          {links.map((link) => {
            const active = pathname === link.to
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`px-3 py-2 rounded-md transition-colors block ${
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
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden bg-[var(--club-navy-deep)] border-t border-white/10">
          <ul className="px-4 py-3 flex flex-col font-condensed font-semibold text-base">
            {links.map((link) => {
              const active = pathname === link.to
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
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
