import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'

import Home from './routes/index'
import Club from './routes/club'
import TeamsPage from './routes/equipes'
import Calendrier from './routes/calendrier'
import Actualites from './routes/actualites'
import Galerie from './routes/galerie'
import Partenaires from './routes/partenaires'
import Contact from './routes/contact'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/club" element={<Club />} />
        <Route path="/equipes" element={<Equipes />} />
        <Route path="/calendrier" element={<Calendrier />} />
        <Route path="/actualites" element={<Actualites />} />
        <Route path="/galerie" element={<Galerie />} />
        <Route path="/partenaires" element={<Partenaires />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  )
}

export default App
