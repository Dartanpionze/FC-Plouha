import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Football Club Plouha — Les Falaises',
      },
      {
        name: 'description',
        content:
          "Site officiel du Football Club Plouha « Les Falaises » : actualités, équipes, calendrier des matchs, galerie photo et partenaires du club amateur de Plouha (Côtes-d'Armor).",
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Scripts />
      </body>
    </html>
  )
}
