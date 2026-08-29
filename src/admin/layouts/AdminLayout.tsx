import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  Shield,
  Users,
  CalendarDays,
  Images,
  Handshake,
  Settings,
  UserCog,
  ExternalLink,
  LogOut,
  Landmark,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  getCurrentAdminProfile,
  getCurrentPermissions,
  isSuperadmin,
  type AdminPermission,
  type AdminProfile,
} from '@/lib/adminPermissions'

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
    label: 'Club',
    path: '/admin/club',
    icon: Landmark,
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
    label: 'Inscriptions',
    path: '/admin/registrations',
    icon: ClipboardList,
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
  const location = useLocation()

  const [session, setSession] = useState<any>(null)
  const [checkingSession, setCheckingSession] =
    useState(true)
  const [adminProfile, setAdminProfile] =
    useState<AdminProfile | null>(null)
  const [permissions, setPermissions] =
    useState<AdminPermission[]>([])
  const [superadmin, setSuperadmin] = useState(false)
  const [adminAccessError, setAdminAccessError] = useState('')
  const [newRegistrationsCount, setNewRegistrationsCount] =
    useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    const loadAdminAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return
      setSession(session)

      if (!session) {
        setCheckingSession(false)
        navigate('/admin/login', { replace: true })
        return
      }

      try {
        const [profile, userPermissions, isRootAdmin] = await Promise.all([
          getCurrentAdminProfile(),
          getCurrentPermissions(),
          isSuperadmin(),
        ])

        if (cancelled) return

        if (!profile || !profile.active) {
          await supabase.auth.signOut()
          setSession(null)
          setCheckingSession(false)
          navigate('/admin/login', { replace: true })
          return
        }

        setAdminProfile(profile)
        setPermissions(userPermissions)
        setSuperadmin(isRootAdmin)
        setAdminAccessError('')
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setAdminAccessError(
            "Impossible de vérifier les droits d'administration.",
          )
        }
      } finally {
        if (!cancelled) setCheckingSession(false)
      }
    }

    loadAdminAccess()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession) {
        setAdminProfile(null)
        setPermissions([])
        setSuperadmin(false)
        navigate('/admin/login', { replace: true })
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [navigate])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!session || !canView('registrations')) return

    const fetchNewRegistrationsCount = async () => {
      const { count, error } = await supabase
        .from('registrations')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('status', 'Nouveau')

      if (error) {
        console.error(error)
        return
      }

      setNewRegistrationsCount(count || 0)
    }

    fetchNewRegistrationsCount()

    const handleFocus = () => {
      fetchNewRegistrationsCount()
    }

    window.addEventListener('focus', handleFocus)

    const channel = supabase
      .channel('admin-registrations-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        () => {
          fetchNewRegistrationsCount()
        },
      )
      .subscribe()

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus,
      )
      supabase.removeChannel(channel)
    }
  }, [session, permissions, superadmin])

  const handleLogout = async () => {
    setMobileMenuOpen(false)
    await supabase.auth.signOut()

    navigate('/admin/login', {
      replace: true,
    })
  }

  const canView = (module: AdminPermission['module']) =>
    superadmin ||
    permissions.some(
      (permission) =>
        permission.module === module && permission.can_view,
    )

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">
          Vérification de la connexion...
        </div>
      </div>
    )
  }

  if (adminAccessError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <h1 className="text-lg font-bold">Accès administrateur indisponible</h1>
          <p className="mt-2 text-sm text-red-100/80">{adminAccessError}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  if (!session || !adminProfile) {
    return null
  }

  const userEmail =
    session.user?.email || 'Administrateur'

  const userInitial =
    userEmail.charAt(0).toUpperCase()

  const sidebarContent = (
    <>
      {/* LOGO */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
        <div>
          <div className="text-xl font-black tracking-tight">
            FC PLOUHA
          </div>

          <div className="text-xs text-slate-400 mt-0.5">
            Administration
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition"
          aria-label="Fermer le menu d'administration"
        >
          <X size={21} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
        <div className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Gestion du club
        </div>

        {navigation.filter((item) => {
          if (item.path === '/admin') return true
          const moduleByPath: Record<string, AdminPermission['module']> = {
            '/admin/news': 'news',
            '/admin/club': 'club',
            '/admin/teams': 'teams',
            '/admin/players': 'players',
            '/admin/registrations': 'registrations',
            '/admin/matches': 'matches',
            '/admin/gallery': 'gallery',
            '/admin/partners': 'partners',
          }
          const module = moduleByPath[item.path]
          return module ? canView(module) : false
        }).map((item) => {
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

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {item.path === '/admin/registrations' &&
                    newRegistrationsCount > 0 && (
                      <span className="min-w-6 h-6 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {newRegistrationsCount > 99
                          ? '99+'
                          : newRegistrationsCount}
                      </span>
                    )}
                </>
              )}
            </NavLink>
          )
        })}

        <div className="px-3 pt-6 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Configuration
        </div>

        {superadmin && (
          <NavLink
            to="/admin/users"
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
                <UserCog
                  size={19}
                  className={
                    isActive
                      ? 'text-[var(--club-yellow)]'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }
                />
                <span>Utilisateurs</span>
              </>
            )}
          </NavLink>
        )}

        {canView('settings') && (
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
        )}
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
    </>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-72 h-screen sticky top-0 shrink-0 bg-slate-900 border-r border-white/10 flex-col">
        {sidebarContent}
      </aside>

      {/* OVERLAY MOBILE */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      {/* SIDEBAR MOBILE */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-3rem))]
          bg-slate-900 border-r border-white/10 flex flex-col
          transform transition-transform duration-200 ease-out lg:hidden
          ${
            mobileMenuOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
        aria-hidden={!mobileMenuOpen}
      >
        {sidebarContent}
      </aside>

      {/* CONTENU */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen">
        {/* TOPBAR */}
        <header className="h-16 sm:h-20 shrink-0 sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
              aria-label="Ouvrir le menu d'administration"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <p className="hidden sm:block text-sm text-slate-400">
                Administration du club
              </p>

              <h1 className="text-base sm:text-lg font-semibold truncate">
                FC Plouha
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden md:block text-right min-w-0">
              <p className="text-sm font-medium">
                {adminProfile.display_name ||
                  (superadmin ? 'Super administrateur' : 'Administrateur')}
              </p>

              <p className="max-w-56 truncate text-xs text-slate-500">
                {userEmail}
              </p>
            </div>

            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold">
              {userInitial}
            </div>
          </div>
        </header>

        {/* PAGE */}
        <main className="flex-1 min-w-0 overflow-x-clip">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
