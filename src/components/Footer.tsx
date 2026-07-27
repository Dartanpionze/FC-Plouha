import { Link, useLocation } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { ClubCrest } from './ClubCrest'
import { club } from '@/data/club'

export function Footer() {
  return (
    <footer className="bg-[var(--club-navy-deep)] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <ClubCrest className="w-16 h-16" />
            <span className="font-display text-white text-lg">FC Plouha</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs">
            Fondé en {club.founded}, le Football Club Plouha « Les Falaises »
            fait vivre le ballon rond sur la côte du Goëlo, des débutants aux
            vétérans.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              href="https://www.facebook.com/ASPludual/"
              aria-label="Facebook du club"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--club-yellow)] hover:text-[var(--club-navy-deep)] transition-colors"
            >
              <Facebook size={17} />
            </a>
            <a
              href="https://www.instagram.com/as_plouha_pludual/"
              aria-label="Instagram du club"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--club-yellow)] hover:text-[var(--club-navy-deep)] transition-colors"
            >
              <Instagram size={17} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-condensed text-white font-bold text-sm tracking-[0.15em] mb-4">
            NAVIGATION
          </h3>
          <ul className="space-y-2 text-sm font-condensed">
            <li><Link to="/club" className="hover:text-[var(--club-yellow)]">Le club</Link></li>
            <li><Link to="/equipes" className="hover:text-[var(--club-yellow)]">Nos équipes</Link></li>
            <li><Link to="/calendrier" className="hover:text-[var(--club-yellow)]">Calendrier</Link></li>
            <li><Link to="/galerie" className="hover:text-[var(--club-yellow)]">Galerie photos</Link></li>
            <li><Link to="/partenaires" className="hover:text-[var(--club-yellow)]">Partenaires</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-condensed text-white font-bold text-sm tracking-[0.15em] mb-4">
            LE CLUB
          </h3>
          <ul className="space-y-2 text-sm font-condensed">
            <li><Link to="/actualites" className="hover:text-[var(--club-yellow)]">Actualités</Link></li>
            <li><Link to="/contact" className="hover:text-[var(--club-yellow)]">Nous contacter</Link></li>
            <li><Link to="/contact" className="hover:text-[var(--club-yellow)]">Devenir bénévole</Link></li>
            <li><Link to="/contact" className="hover:text-[var(--club-yellow)]">Rejoindre l'école de foot</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-condensed text-white font-bold text-sm tracking-[0.15em] mb-4">
            CONTACT
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin size={17} className="shrink-0 mt-0.5 text-[var(--club-yellow)]" />
              <span>{club.stadium}<br />{club.address}</span>
            </li>
            <li className="flex gap-2 items-center">
              <Phone size={17} className="shrink-0 text-[var(--club-yellow)]" />
              <span>{club.phone}</span>
            </li>
            <li className="flex gap-2 items-center">
              <Mail size={17} className="shrink-0 text-[var(--club-yellow)]" />
              <span>{club.email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs flex flex-col sm:flex-row gap-2 justify-between font-condensed tracking-wide">
          <span>© {new Date(2026, 6, 25).getFullYear()} Football Club Plouha — Les Falaises. Tous droits réservés.</span>
          <span>Club affilié à la Ligue de Bretagne de Football</span>
        </div>
      </div>
    </footer>
  )
}
