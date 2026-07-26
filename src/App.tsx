import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'

import Home from './routes/index'
import Club from './routes/club'
import TeamsPage from './routes/equipes'
import CalendarPage from './routes/calendrier'
import NewsPage from './routes/actualites'
import GalleryPage from './routes/galerie'
import SponsorsPage from './routes/partenaires'
import Contact from './routes/contact'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/club" element={<Club />} />
        <Route path="/equipes" element={<TeamsPage />} />
        <Route path="/calendrier" element={<CalendarPage />} />
        <Route path="/actualites" element={<NewsPage />} />
        <Route path="/galerie" element={<GalleryPage />} />
        <Route path="/partenaires" element={<SponsorsPage />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  )
}

export default App
