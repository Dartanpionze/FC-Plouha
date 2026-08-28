import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import ScrollToTop from './components/ScrollToTop'

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
import Settings from './admin/pages/Settings'
import AdminClub from './admin/pages/Club'
import Registrations from './admin/pages/Registrations'
import Users from './admin/pages/Users'
import AcceptInvite from './admin/pages/AcceptInvite'
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
          <Route path="/club" element={<Club />} />
          <Route path="/equipes" element={<TeamsPage />} />
          <Route path="/equipes/:id" element={<TeamDetailPage />} />
          <Route path="/calendrier" element={<CalendarPage />} />
          <Route path="/actualites" element={<NewsPage />} />
          <Route path="/actualites/:id" element={<ArticlePage />} />
          <Route path="/galerie" element={<GalleryPage />} />
          <Route path="/partenaires" element={<SponsorsPage />} />
          <Route path="/contact" element={<Contact />} />

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
          <Route path="gallery" element={<RequireAdminPermission module="gallery"><Gallery /></RequireAdminPermission>} />
          <Route path="partners" element={<RequireAdminPermission module="partners"><Partners /></RequireAdminPermission>} />
          <Route path="settings" element={<RequireAdminPermission module="settings"><Settings /></RequireAdminPermission>} />
          <Route path="users" element={<RequireSuperadmin><Users /></RequireSuperadmin>} />
        </Route>
      </Routes>
    </>
  )
}

export default App
