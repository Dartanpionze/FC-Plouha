import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

import './styles.css'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu principal
      </a>

      <Navbar />

      <main id="contenu-principal" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
