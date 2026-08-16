import {
  Newspaper,
  Shield,
  CalendarDays,
  Handshake,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const stats = [
  {
    label: 'Actualités',
    value: '12',
    description: 'articles publiés',
    icon: Newspaper,
    path: '/admin/news',
  },
  {
    label: 'Équipes',
    value: '4',
    description: 'équipes enregistrées',
    icon: Shield,
    path: '/admin/teams',
  },
  {
    label: 'Matchs à venir',
    value: '3',
    description: 'dans le calendrier',
    icon: CalendarDays,
    path: '/admin/matches',
  },
  {
    label: 'Partenaires',
    value: '8',
    description: 'partenaires actifs',
    icon: Handshake,
    path: '/admin/partners',
  },
]

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-8">
        <p className="text-sm text-slate-400 mb-1">
          Vue d'ensemble
        </p>

        <h1 className="text-3xl font-bold tracking-tight">
          Tableau de bord
        </h1>

        <p className="mt-2 text-slate-400">
          Gérez facilement le contenu du site du FC Plouha.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Link
              key={stat.label}
              to={stat.path}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon
                    size={21}
                    className="text-[var(--club-yellow)]"
                  />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition"
                />
              </div>

              <div className="mt-5">
                <p className="text-sm text-slate-400">
                  {stat.label}
                </p>

                <p className="text-3xl font-bold mt-1">
                  {stat.value}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {stat.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ACTIONS */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">
          Actions rapides
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Accédez rapidement aux outils les plus utilisés.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

          <Link
            to="/admin/news"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >
            <Newspaper
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Nouvelle actualité
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Publier une nouvelle actualité sur le site.
            </p>
          </Link>

          <Link
            to="/admin/matches"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >
            <CalendarDays
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Ajouter un match
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Ajouter une rencontre au calendrier.
            </p>
          </Link>

          <Link
            to="/admin/gallery"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
          >
            <Shield
              size={22}
              className="text-[var(--club-yellow)]"
            />

            <h3 className="font-semibold mt-4">
              Ajouter des photos
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Alimenter la galerie du club.
            </p>
          </Link>

        </div>
      </div>

    </div>
  )
}
