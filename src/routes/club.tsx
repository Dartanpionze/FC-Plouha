import { Link } from 'react-router-dom'
import { Award, HeartHandshake, ShieldHalf, Users2 } from 'lucide-react'
import { club, teams } from '@/data/club'
import { SectionHeading } from '@/components/SectionHeading'
import { PhotoTile } from '@/components/PhotoTile'

const timeline = [
  { year: '1968', text: "Création du club par d'anciens joueurs du bourg de Plouha." },
  { year: '1984', text: 'Inauguration du stade de Kermarquer et de son premier vestiaire en dur.' },
  { year: '2003', text: "Ouverture de l'école de foot et lancement de la section féminine." },
  { year: '2011', text: 'Premier titre de champion de District pour les Séniors A.' },
  { year: '2019', text: 'Rénovation complète des vestiaires et pose du nouvel éclairage LED.' },
  { year: '2026', text: 'Le club compte 11 équipes et plus de 130 licenciés.' },
]

const bureau = [
  { role: 'Présidente', name: 'Annick Le Floch' },
  { role: 'Vice-président', name: 'Ronan Guivarc\'h' },
  { role: 'Trésorier', name: 'Job Riou' },
  { role: 'Secrétaire', name: 'Solenn Le Gall' },
  { role: 'Responsable technique', name: 'Erwan Le Bihan' },
  { role: 'Responsable école de foot', name: 'Katell Morvan' },
]

function ClubPage() {
  return (
    <div>
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            LE CLUB
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl text-white">
            {club.name}
          </h1>
          <p className="mt-6 text-white/70 font-condensed text-lg max-w-2xl mx-auto">
            Un club familial où se croisent trois générations de licenciés,
            autour d'une même passion : le ballon rond face aux falaises du
            Goëlo.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <PhotoTile hue={214} caption="Vue du stade de Kermarquer" className="h-80 rounded-2xl" />
        <div>
          <SectionHeading eyebrow="Notre histoire" title="Presque 60 ans d'existence" />
          <p className="mt-6 font-condensed text-lg text-[var(--club-navy-deep)]/80 leading-relaxed">
            Le Football Club Plouha voit le jour en {club.founded}, quand un
            groupe d'ouvriers et de marins-pêcheurs du bourg décide de monter
            une équipe pour disputer les tournois de la Fête du Goëlo. Depuis,
            le club n'a jamais cessé de grandir, porté par des générations de
            bénévoles et une identité forte : le bleu de la mer, le jaune du
            genêt breton, et le rouge de la passion.
          </p>
        </div>
      </section>

      <section className="bg-[var(--club-navy)]/[0.04] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Chronologie" title="Les grandes dates" align="center" />
          <ol className="mt-12 relative border-l-2 border-[var(--club-yellow)] ml-3">
            {timeline.map((item) => (
              <li key={item.year} className="mb-9 ml-8">
                <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-[var(--club-red)] border-2 border-white" />
                <div className="font-display text-xl text-[var(--club-navy)]">{item.year}</div>
                <p className="font-condensed text-[var(--club-navy-deep)]/75 mt-1">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <SectionHeading eyebrow="Nos valeurs" title="Ce qui nous rassemble" align="center" />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShieldHalf, title: 'Respect', text: "Des terrains, des arbitres et de l'adversaire, en toute circonstance." },
            { icon: Users2, title: 'Convivialité', text: 'Un club où chacun trouve sa place, joueur, parent ou bénévole.' },
            { icon: Award, title: 'Exigence', text: 'Progresser à son rythme, de l\'école de foot aux séniors.' },
            { icon: HeartHandshake, title: 'Engagement', text: 'Des bénévoles qui font vivre le club toute la saison.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center p-6 rounded-2xl bg-white border border-black/5">
              <Icon className="mx-auto text-[var(--club-red)]" size={30} />
              <h3 className="mt-4 font-condensed font-bold text-lg">{title}</h3>
              <p className="mt-2 text-sm text-[var(--club-navy-deep)]/70">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--club-navy-deep)] py-20 grain-overlay">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Bureau directeur" title="L'équipe dirigeante" dark align="center" />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bureau.map((person) => (
              <div key={person.name} className="bg-white/5 border border-white/10 rounded-xl p-5 text-white">
                <div className="font-condensed font-bold">{person.name}</div>
                <div className="text-sm text-[var(--club-yellow)]">{person.role}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-white/50 font-condensed">
            {teams.reduce((sum, t) => sum + t.players, 0)} licenciés répartis
            en {teams.length} équipes cette saison.
          </p>
        </div>
      </section>
    </div>
  )
}
