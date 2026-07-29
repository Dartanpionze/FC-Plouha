import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  Image,
  Users,
  Calendar,
  Handshake,
  Settings,
} from 'lucide-react'

const menu = [
  {
    name: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    name: 'Actualités',
    icon: Newspaper,
    path: '/admin/news',
  },
  {
    name: 'Galerie',
    icon: Image,
    path: '/admin/gallery',
  },
  {
    name: 'Équipes',
    icon: Users,
    path: '/admin/teams',
  },
  {
    name: 'Calendrier',
    icon: Calendar,
    path: '/admin/matches',
  },
  {
    name: 'Partenaires',
    icon: Handshake,
    path: '/admin/partners',
  },
  {
    name: 'Paramètres',
    icon: Settings,
    path: '/admin/settings',
  },
]

export default function Sidebar() {
  return (
    <aside className="w-72 bg-[var(--club-navy-deep)] text-white min-h-screen flex flex-col">

      <div className="p-8 border-b border-white/10">

        <img
          src="/logo.png"
          alt="FC Plouha"
          className="w-24 mx-auto"
        />

        <h2 className="text-center mt-4 text-xl font-bold">
          FC Plouha
        </h2>

        <p className="text-center text-sm text-white/60">
          Administration
        </p>

      </div>

      <nav className="flex-1 p-4 space-y-2">

        {menu.map((item) => {

          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition"
            >
              <Icon size={20} />

              <span>{item.name}</span>
            </Link>
          )
        })}

      </nav>

    </aside>
  )
}
