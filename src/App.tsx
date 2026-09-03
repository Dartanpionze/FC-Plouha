import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import ScrollToTop from './components/ScrollToTop'
import PublicSectionRoute from './components/PublicSectionRoute'

import Home from './routes/index'
import Club from './routes/club'
import TeamsPage from './routes/equipes'
import TeamDetailPage from './routes/equipe-detail'
import CalendarPage from './routes/calendrier'
import NewsPage from './routes/actualites'
import ArticlePage from './routes/article'
import GalleryPage from './routes/galerie'
import SponsorsPage from './routes/partenaires'
import Contact from './routes/contact'
import RejoindrePage from './routes/rejoindre'
import MentionsLegalesPage from './routes/mentions-legales'
import PolitiqueConfidentialitePage from './routes/politique-confidentialite'
import NotFoundPage from './routes/not-found'

import AdminLayout from './admin/layouts/AdminLayout'
import Dashboard from './admin/pages/Dashboard'
import Login from './admin/pages/Login'
import News from './admin/pages/News'
import Teams from './admin/pages/Teams'
import Players from './admin/pages/Players'
import Matches from './admin/pages/Matches'
import Gallery from './admin/pages/Gallery'
import Partners from './admin/pages/Partners'
import Pricing from './admin/pages/Pricing'
import Trainings from './admin/pages/Trainings'
import Settings from './admin/pages/Settings'
import AdminClub from './admin/pages/Club'
import Registrations from './admin/pages/Registrations'
import Users from './admin/pages/Users'
import AcceptInvite from './admin/pages/AcceptInvite'
import Backups from './admin/pages/Backups'
import RequireAdminPermission from './admin/components/RequireAdminPermission'
import RequireSuperadmin from './admin/components/RequireSuperadmin'

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* SITE PUBLIC */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/club" element={<PublicSectionRoute section="club"><Club /></PublicSectionRoute>} />
          <Route path="/equipes" element={<PublicSectionRoute section="teams"><TeamsPage /></PublicSectionRoute>} />
          <Route path="/equipes/:id" element={<PublicSectionRoute section="teams"><TeamDetailPage /></PublicSectionRoute>} />
          <Route path="/calendrier" element={<PublicSectionRoute section="calendar"><CalendarPage /></PublicSectionRoute>} />
          <Route path="/actualites" element={<PublicSectionRoute section="news"><NewsPage /></PublicSectionRoute>} />
          <Route path="/actualites/:id" element={<PublicSectionRoute section="news"><ArticlePage /></PublicSectionRoute>} />
          <Route path="/galerie" element={<PublicSectionRoute section="gallery"><GalleryPage /></PublicSectionRoute>} />
          <Route path="/partenaires" element={<PublicSectionRoute section="partners"><SponsorsPage /></PublicSectionRoute>} />
          <Route path="/contact" element={<PublicSectionRoute section="contact"><Contact /></PublicSectionRoute>} />
          <Route path="/rejoindre" element={<RejoindrePage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />

          {/* Toute route publique inconnue affiche la page 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ADMINISTRATION - séparée du Navbar/Footer public */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/accept-invite" element={<AcceptInvite />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="news" element={<RequireAdminPermission module="news"><News /></RequireAdminPermission>} />
          <Route path="club" element={<RequireAdminPermission module="club"><AdminClub /></RequireAdminPermission>} />
          <Route path="teams" element={<RequireAdminPermission module="teams"><Teams /></RequireAdminPermission>} />
          <Route path="players" element={<RequireAdminPermission module="players"><Players /></RequireAdminPermission>} />
          <Route path="registrations" element={<RequireAdminPermission module="registrations"><Registrations /></RequireAdminPermission>} />
          <Route path="matches" element={<RequireAdminPermission module="matches"><Matches /></RequireAdminPermission>} />
          <Route path="trainings" element={<RequireAdminPermission module="teams"><Trainings /></RequireAdminPermission>} />
          <Route path="gallery" element={<RequireAdminPermission module="gallery"><Gallery /></RequireAdminPermission>} />
          <Route path="partners" element={<RequireAdminPermission module="partners"><Partners /></RequireAdminPermission>} />
          <Route path="pricing" element={<RequireAdminPermission module="settings"><Pricing /></RequireAdminPermission>} />
          <Route path="settings" element={<RequireAdminPermission module="settings"><Settings /></RequireAdminPermission>} />
          <Route path="users" element={<RequireSuperadmin><Users /></RequireSuperadmin>} />
          <Route path="backups" element={<RequireSuperadmin><Backups /></RequireSuperadmin>} />
        </Route>
      </Routes>
    </>
  )
}

export default App
