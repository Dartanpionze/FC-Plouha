import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  Shield,
  Users,
  CalendarDays,
  Images,
  Handshake,
  Settings,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navigation = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Actualités',
    path: '/admin/news',
    icon: Newspaper,
  },
  {
    label: 'Équipes',
    path: '/admin/teams',
    icon: Shield,
  },
  {
    label: 'Joueurs',
    path: '/admin/players',
    icon: Users,
  },
  {
    label: 'Matchs',
    path: '/admin/matches',
    icon: CalendarDays,
  },
  {
    label: 'Galerie',
    path: '/admin/gallery',
    icon: Images,
  },
  {
    label: 'Partenaires',
    path: '/admin/partners',
    icon: Handshake,
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  const [session, setSession] = useState<any>(null)
  const [checkingSession, setCheckingSession] =
    useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setCheckingSession(false)

      if (!session) {
        navigate('/admin/login', {
          replace: true,
        })
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)

        if (!session) {
          navigate('/admin/login', {
            replace: true,
          })
        }
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()

    navigate('/admin/login', {
      replace: true,
    })
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">
          Vérification de la connexion...
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userEmail =
    session.user?.email || 'Administrateur'

  const userInitial =
    userEmail.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* SIDEBAR */}
      <aside className="w-72 shrink-0 bg-slate-900 border-r border-white/10 flex flex-col">

        {/* LOGO */}
        <div className="h-20 px-6 flex items-center border-b border-white/10">
          <div>
            <div className="text-xl font-black tracking-tight">
              FC PLOUHA
            </div>

            <div className="text-xs text-slate-400 mt-0.5">
              Administration
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-1">

          <div className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Gestion du club
          </div>

          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-sm font-medium transition-all
                  ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      className={
                        isActive
                          ? 'text-[var(--club-yellow)]'
                          : 'text-slate-500 group-hover:text-slate-300'
                      }
                    />

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}

          <div className="px-3 pt-6 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Configuration
          </div>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `
              group flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-sm font-medium transition-all
              ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }
              `
            }
          >
            {({ isActive }) => (
              <>
                <Settings
                  size={19}
                  className={
                    isActive
                      ? 'text-[var(--club-yellow)]'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }
                />

                <span>Paramètres</span>
              </>
            )}
          </NavLink>

        </nav>

        {/* BOTTOM */}
        <div className="p-4 border-t border-white/10 space-y-2">

          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <ExternalLink size={18} />
            Voir le site
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <LogOut size={18} />
            Déconnexion
          </button>

        </div>

      </aside>

      {/* CONTENU */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* TOPBAR */}
        <header className="h-20 shrink-0 border-b border-white/10 bg-slate-950/80 backdrop-blur flex items-center justify-between px-8">

          <div>
            <p className="text-sm text-slate-400">
              Administration du club
            </p>

            <h1 className="text-lg font-semibold">
              FC Plouha
            </h1>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">
                Administrateur
              </p>

              <p className="text-xs text-slate-500">
                {userEmail}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold">
              {userInitial}
            </div>

          </div>

        </header>

        {/* PAGE */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

      </div>

    </div>
  )
}
