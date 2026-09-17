import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import ScrollToTop from './components/ScrollToTop'
import PublicSectionRoute from './components/PublicSectionRoute'
import RequireAdminPermission from './admin/components/RequireAdminPermission'
import RequireSuperadmin from './admin/components/RequireSuperadmin'
import type { AdminModule } from './lib/adminPermissions'
import type { PublicSectionKey } from './lib/siteVisibility'

const Home = lazy(() => import('./routes/index'))
const Club = lazy(() => import('./routes/club'))
const TeamsPage = lazy(() => import('./routes/equipes'))
const TeamDetailPage = lazy(() => import('./routes/equipe-detail'))
const CalendarPage = lazy(() => import('./routes/calendrier'))
const NewsPage = lazy(() => import('./routes/actualites'))
const ArticlePage = lazy(() => import('./routes/article'))
const GalleryPage = lazy(() => import('./routes/galerie'))
const SponsorsPage = lazy(() => import('./routes/partenaires'))
const Contact = lazy(() => import('./routes/contact'))
const RejoindrePage = lazy(() => import('./routes/rejoindre'))
const MentionsLegalesPage = lazy(() => import('./routes/mentions-legales'))
const PolitiqueConfidentialitePage = lazy(
  () => import('./routes/politique-confidentialite'),
)
const NotFoundPage = lazy(() => import('./routes/not-found'))

const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'))
const Dashboard = lazy(() => import('./admin/pages/Dashboard'))
const Login = lazy(() => import('./admin/pages/Login'))
const News = lazy(() => import('./admin/pages/News'))
const Teams = lazy(() => import('./admin/pages/Teams'))
const Players = lazy(() => import('./admin/pages/Players'))
const Matches = lazy(() => import('./admin/pages/Matches'))
const Gallery = lazy(() => import('./admin/pages/Gallery'))
const Partners = lazy(() => import('./admin/pages/Partners'))
const Pricing = lazy(() => import('./admin/pages/Pricing'))
const Trainings = lazy(() => import('./admin/pages/Trainings'))
const Settings = lazy(() => import('./admin/pages/Settings'))
const AdminClub = lazy(() => import('./admin/pages/Club'))
const Registrations = lazy(() => import('./admin/pages/Registrations'))
const Emails = lazy(() => import('./admin/pages/Emails'))
const Users = lazy(() => import('./admin/pages/Users'))
const AcceptInvite = lazy(() => import('./admin/pages/AcceptInvite'))
const ResetPassword = lazy(() => import('./admin/pages/ResetPassword'))
const Backups = lazy(() => import('./admin/pages/Backups'))

function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[45vh] items-center justify-center px-4"
    >
      <div className="flex items-center gap-3 font-condensed text-sm font-bold text-[var(--club-navy-deep)]/65">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--club-navy-deep)]/20 border-t-[var(--club-red)]"
        />
        Chargement de la page...
      </div>
    </div>
  )
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

function publicSection(section: PublicSectionKey, page: ReactNode) {
  return <PublicSectionRoute section={section}>{page}</PublicSectionRoute>
}

function protectedPage(module: AdminModule, page: ReactNode) {
  return (
    <RequireAdminPermission module={module}>
      {page}
    </RequireAdminPermission>
  )
}

function App() {
  return (
    <>
      <ScrollToTop />

      <LazyPage>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            <Route
              path="/club"
              element={publicSection('club', <Club />)}
            />

            <Route
              path="/equipes"
              element={publicSection('teams', <TeamsPage />)}
            />

            <Route
              path="/equipes/:id"
              element={publicSection('teams', <TeamDetailPage />)}
            />

            <Route
              path="/calendrier"
              element={publicSection('calendar', <CalendarPage />)}
            />

            <Route
              path="/actualites"
              element={publicSection('news', <NewsPage />)}
            />

            <Route
              path="/actualites/:id"
              element={publicSection('news', <ArticlePage />)}
            />

            <Route
              path="/galerie"
              element={publicSection('gallery', <GalleryPage />)}
            />

            <Route
              path="/partenaires"
              element={publicSection('partners', <SponsorsPage />)}
            />

            <Route
              path="/contact"
              element={publicSection('contact', <Contact />)}
            />

            <Route
              path="/rejoindre"
              element={<RejoindrePage />}
            />

            <Route
              path="/mentions-legales"
              element={<MentionsLegalesPage />}
            />

            <Route
              path="/politique-confidentialite"
              element={<PolitiqueConfidentialitePage />}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/admin/login" element={<Login />} />

          <Route
            path="/admin/accept-invite"
            element={<AcceptInvite />}
          />

          <Route
            path="/admin/reset-password"
            element={<ResetPassword />}
          />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />

            <Route
              path="news"
              element={protectedPage('news', <News />)}
            />

            <Route
              path="club"
              element={protectedPage('club', <AdminClub />)}
            />

            <Route
              path="teams"
              element={protectedPage('teams', <Teams />)}
            />

            <Route
              path="players"
              element={protectedPage('players', <Players />)}
            />

            <Route
              path="registrations"
              element={protectedPage(
                'registrations',
                <Registrations />,
              )}
            />

            <Route
              path="emails"
              element={protectedPage('emails', <Emails />)}
            />

            <Route
              path="matches"
              element={protectedPage('matches', <Matches />)}
            />

            <Route
              path="trainings"
              element={protectedPage('teams', <Trainings />)}
            />

            <Route
              path="gallery"
              element={protectedPage('gallery', <Gallery />)}
            />

            <Route
              path="partners"
              element={protectedPage('partners', <Partners />)}
            />

            <Route
              path="pricing"
              element={protectedPage('settings', <Pricing />)}
            />

            <Route
              path="settings"
              element={protectedPage('settings', <Settings />)}
            />

            <Route
              path="users"
              element={
                <RequireSuperadmin>
                  <Users />
                </RequireSuperadmin>
              }
            />

            <Route
              path="backups"
              element={
                <RequireSuperadmin>
                  <Backups />
                </RequireSuperadmin>
              }
            />
          </Route>
        </Routes>
      </LazyPage>
    </>
  )
}

export default App
