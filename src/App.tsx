import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import ScrollToTop from './components/ScrollToTop'

import Home from './routes/index'
import Club from './routes/club'
import TeamsPage from './routes/equipes'
import CalendarPage from './routes/calendrier'
import NewsPage from './routes/actualites'
import ArticlePage from './routes/article'
import GalleryPage from './routes/galerie'
import SponsorsPage from './routes/partenaires'
import Contact from './routes/contact'

import AdminLayout from "./admin/layouts/AdminLayout";

import Dashboard from "./admin/pages/Dashboard";
import Login from "./admin/pages/Login";
import News from "./admin/pages/News";
import Teams from "./admin/pages/Teams";
import Players from "./admin/pages/Players";
import Matches from "./admin/pages/Matches";
import Gallery from "./admin/pages/Gallery";
import Partners from "./admin/pages/Partners";
import Settings from "./admin/pages/Settings";

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/club" element={<Club />} />
          <Route path="/equipes" element={<TeamsPage />} />
          <Route path="/calendrier" element={<CalendarPage />} />
          <Route path="/actualites" element={<NewsPage />} />
          <Route path="/actualites/:id" element={<ArticlePage />} />
          <Route path="/admin/login" element={<Login />} />          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="news" element={<News />} />
            <Route path="teams" element={<Teams />} />
            <Route path="players" element={<Players />} />
            <Route path="matches" element={<Matches />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="partners" element={<Partners />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/galerie" element={<GalleryPage />} />
          <Route path="/partenaires" element={<SponsorsPage />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
