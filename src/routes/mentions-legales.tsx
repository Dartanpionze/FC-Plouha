import { Link } from 'react-router-dom'
import { Building2, Mail, MapPin, Server, UserRound } from 'lucide-react'
import Seo from '@/components/Seo'

function MentionsLegalesPage() {
  return (
    <div>
      <Seo
        title="Mentions légales"
        description="Mentions légales du site officiel du PLOUHA Football Club."
      />

      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            INFORMATIONS LÉGALES
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">
            Mentions légales
          </h1>
          <p className="mt-5 max-w-2xl mx-auto font-condensed text-lg text-white/70">
            Informations relatives à l'éditeur et à l'hébergement de fcplouha.fr.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 2xl:py-20">
        <div className="space-y-6">
          <LegalSection icon={Building2} title="Éditeur du site">
            <p><strong>PLOUHA Football Club</strong></p>
            <p>Association sportive</p>
            <p className="mt-3 flex gap-2">
              <MapPin size={18} className="mt-0.5 shrink-0 text-[var(--club-red)]" />
              <span>
                Terrain des sports<br />
                Rue Louis Droumaguet<br />
                22580 PLOUHA
              </span>
            </p>
            <p className="mt-3">
              Téléphone : <a className="font-semibold hover:text-[var(--club-red)]" href="tel:0612887751">06 12 88 77 51</a>
            </p>
            <p>
              E-mail : <a className="font-semibold hover:text-[var(--club-red)]" href="mailto:contact@fcplouha.fr">contact@fcplouha.fr</a>
            </p>
          </LegalSection>

          <LegalSection icon={UserRound} title="Direction de la publication">
            <p>
              Directeur de la publication : <strong>Bruno Scala</strong>, président du PLOUHA Football Club.
            </p>
          </LegalSection>

          <LegalSection icon={Server} title="Hébergement">
            <p>Le site fcplouha.fr est hébergé par :</p>
            <p className="mt-3"><strong>Vercel Inc.</strong></p>
            <p>
              440 N Barranca Ave #4133<br />
              Covina, CA 91723<br />
              États-Unis
            </p>
            <p className="mt-3 text-sm text-[var(--club-navy-deep)]/60">
              Le site utilise également Supabase comme service technique de base de données et de stockage pour certaines fonctionnalités.
            </p>
          </LegalSection>

          <LegalSection icon={Mail} title="Données personnelles">
            <p>
              Les informations concernant la collecte et le traitement des données personnelles sont détaillées dans notre{' '}
              <Link
                to="/politique-confidentialite"
                className="font-semibold text-[var(--club-red)] hover:underline"
              >
                politique de confidentialité
              </Link>.
            </p>
            <p className="mt-3">
              Pour toute question relative à vos données personnelles :{' '}
              <a
                href="mailto:contact@fcplouha.fr"
                className="font-semibold text-[var(--club-red)] hover:underline"
              >
                contact@fcplouha.fr
              </a>.
            </p>
          </LegalSection>

          <section className="rounded-2xl border border-black/5 bg-[var(--club-navy)]/[0.04] p-6">
            <h2 className="font-condensed text-xl font-bold text-[var(--club-navy-deep)]">
              Propriété intellectuelle
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--club-navy-deep)]/70">
              Sauf indication contraire, les contenus propres au PLOUHA Football Club publiés sur ce site sont protégés par les règles applicables à la propriété intellectuelle. Les logos, photographies ou contenus appartenant à des tiers restent la propriété de leurs titulaires respectifs.
            </p>
          </section>

          <p className="pt-2 text-xs font-condensed text-[var(--club-navy-deep)]/45">
            Dernière mise à jour : septembre 2026.
          </p>
        </div>
      </main>
    </div>
  )
}

function LegalSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--club-yellow)]/20 text-[var(--club-navy-deep)]">
          <Icon size={20} />
        </div>
        <h2 className="font-condensed text-xl font-bold text-[var(--club-navy-deep)]">
          {title}
        </h2>
      </div>
      <div className="mt-5 leading-relaxed text-[var(--club-navy-deep)]/70">
        {children}
      </div>
    </section>
  )
}

export default MentionsLegalesPage
