import { Link } from 'react-router-dom'
import {
  Database,
  Mail,
  ShieldCheck,
  TimerReset,
  UserRoundCheck,
} from 'lucide-react'
import Seo from '@/components/Seo'

function PolitiqueConfidentialitePage() {
  return (
    <div>
      <Seo
        title="Politique de confidentialité"
        description="Politique de confidentialité et informations RGPD du site du PLOUHA Football Club."
      />

      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            VOS DONNÉES
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">
            Politique de confidentialité
          </h1>
          <p className="mt-5 max-w-2xl mx-auto font-condensed text-lg text-white/70">
            Comment le PLOUHA Football Club utilise et protège les informations transmises sur fcplouha.fr.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 2xl:py-20">
        <div className="space-y-6">
          <PrivacySection icon={ShieldCheck} title="Responsable du traitement">
            <p>
              Le responsable du traitement est le <strong>PLOUHA Football Club</strong>,
              Terrain des sports, Rue Louis Droumaguet, 22580 PLOUHA.
            </p>
            <p className="mt-3">
              Contact :{' '}
              <a className="font-semibold text-[var(--club-red)] hover:underline" href="mailto:contact@fcplouha.fr">
                contact@fcplouha.fr
              </a>
            </p>
          </PrivacySection>

          <PrivacySection icon={Database} title="Données collectées et finalités">
            <p>
              Lorsque vous utilisez le formulaire de contact, d'inscription, de bénévolat ou de partenariat, le club peut recueillir votre prénom, votre nom, votre adresse e-mail, votre numéro de téléphone, le type de demande et votre message.
            </p>
            <p className="mt-3">
              Pour une demande d'inscription sportive, l'année de naissance et la catégorie souhaitée peuvent également être demandées afin d'orienter la demande vers l'équipe ou l'interlocuteur approprié.
            </p>
            <p className="mt-3">
              Ces données sont utilisées uniquement pour recevoir votre demande, vous répondre, organiser son suivi et, le cas échéant, préparer votre prise de contact avec le club. La base juridique de ce traitement est l'intérêt légitime du club à répondre aux sollicitations qui lui sont adressées et, lorsque la demande vise une inscription, les démarches précontractuelles ou préalables à l'adhésion effectuées à votre demande.
            </p>
          </PrivacySection>

          <PrivacySection icon={UserRoundCheck} title="Destinataires et prestataires techniques">
            <p>
              Les données sont accessibles uniquement aux personnes du PLOUHA Football Club habilitées à traiter les demandes reçues.
            </p>
            <p className="mt-3">
              Le site s'appuie sur des prestataires techniques, notamment <strong>Supabase</strong> pour la base de données et le stockage applicatif, et <strong>Vercel</strong> pour l'hébergement et la mise à disposition du site. Ces prestataires peuvent traiter des données dans le cadre strict de la fourniture de leurs services.
            </p>
          </PrivacySection>

          <PrivacySection icon={TimerReset} title="Durée de conservation">
            <p>
              Les demandes transmises par les formulaires du site sont conservées pendant une durée maximale de <strong>2 mois</strong> à compter de leur réception, puis supprimées lorsqu'elles ne sont plus nécessaires au suivi de la demande.
            </p>
            <p className="mt-3 text-sm">
              Si une demande aboutit à une adhésion ou à une autre relation avec le club, les informations nécessaires à cette nouvelle finalité peuvent faire l'objet d'un traitement distinct et d'une durée de conservation adaptée.
            </p>
          </PrivacySection>

          <PrivacySection icon={ShieldCheck} title="Vos droits">
            <p>
              Dans les conditions prévues par la réglementation applicable, vous pouvez demander l'accès à vos données, leur rectification ou leur effacement, demander la limitation de leur traitement, vous opposer à certains traitements et exercer votre droit à la portabilité lorsque celui-ci est applicable.
            </p>
            <p className="mt-3">
              Pour exercer vos droits, écrivez à{' '}
              <a className="font-semibold text-[var(--club-red)] hover:underline" href="mailto:contact@fcplouha.fr">
                contact@fcplouha.fr
              </a>.
              Le club pourra vous demander les informations nécessaires pour vérifier votre identité lorsque cela est justifié.
            </p>
            <p className="mt-3">
              Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL.
            </p>
          </PrivacySection>

          <PrivacySection icon={Mail} title="Informations complémentaires">
            <p>
              Pour connaître l'identité de l'éditeur et de l'hébergeur du site, consultez les{' '}
              <Link to="/mentions-legales" className="font-semibold text-[var(--club-red)] hover:underline">
                mentions légales
              </Link>.
            </p>
          </PrivacySection>

          <p className="pt-2 text-xs font-condensed text-[var(--club-navy-deep)]/45">
            Dernière mise à jour : septembre 2026.
          </p>
        </div>
      </main>
    </div>
  )
}

function PrivacySection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck
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

export default PolitiqueConfidentialitePage
