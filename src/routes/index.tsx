import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  ShieldHalf,
  Trophy,
  Users,
} from 'lucide-react'
import { club, gallery, matches, news, sponsors, teams } from '@/data/club'
import { SectionHeading } from '@/components/SectionHeading'
import { PhotoTile } from '@/components/PhotoTile'
import { ClubCrest } from '@/components/ClubCrest'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function Home() {
  const upcoming = matches.filter((m) => !m.played).slice(0, 3)

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--club-navy-deep)] grain-overlay">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(29,79,145,0.55),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(200,32,47,0.35),transparent_55%)]" />
        <svg
          className="absolute -right-24 -top-24 w-[560px] h-[560px] opacity-[0.07]"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="94" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="100" y1="6" x2="100" y2="194" stroke="white" strokeWidth="1.5" />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div className="animate-rise">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-[var(--club-yellow)]" />
              <span className="font-condensed text-[var(--club-yellow)] text-sm font-semibold tracking-[0.3em]">
                {club.city.toUpperCase()} · {club.region.toUpperCase()}
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.95] text-balance">
              Football Club Plouha
              <span className="block text-[var(--club-yellow)]">
                Les Falaises
              </span>
            </h1>
            <p className="mt-6 text-white/70 text-lg max-w-xl font-condensed">
              Depuis {club.founded}, un club amateur porté par la passion du
              ballon rond sur la côte du Goëlo. Onze équipes, un seul
              maillot : celui des Falaises.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/equipes"
                className="inline-flex items-center gap-2 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold px-6 py-3.5 rounded-lg hover:bg-white transition-colors"
              >
                Découvrir nos équipes
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/calendrier"
                className="inline-flex items-center gap-2 border border-white/30 text-white font-condensed font-bold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Voir le calendrier
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end animate-rise" style={{ animationDelay: '0.15s' }}>
            <div className="relative bg-white/[0.04] border border-white/10 rounded-3xl p-10 backdrop-blur-sm w-full max-w-sm">
              <ClubCrest className="w-32 h-32 mx-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]" />
              <div className="mt-8 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="font-display text-3xl text-[var(--club-yellow)]">{club.founded}</div>
                  <div className="font-condensed text-white/60 text-xs tracking-widest">FONDATION</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-[var(--club-yellow)]">{teams.length}</div>
                  <div className="font-condensed text-white/60 text-xs tracking-widest">ÉQUIPES</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-[var(--club-yellow)]">
                    {teams.reduce((sum, t) => sum + t.players, 0)}
                  </div>
                  <div className="font-condensed text-white/60 text-xs tracking-widest">LICENCIÉS</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-[var(--club-yellow)]">3</div>
                  <div className="font-condensed text-white/60 text-xs tracking-widest">TITRES DISTRICT</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-2 stripe-diagonal" />
      </section>

      {/* PRESENTATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <PhotoTile hue={214} caption="Stade de Kermarquer" className="h-56 rounded-2xl col-span-2" />
            <PhotoTile hue={48} caption="École de foot" className="h-40 rounded-2xl" />
            <PhotoTile hue={0} caption="Séniors A" className="h-40 rounded-2xl" />
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Le club" title="Une histoire ancrée dans le Goëlo" />
          <p className="mt-6 text-[var(--club-navy-deep)]/80 leading-relaxed font-condensed text-lg">
            Créé en {club.founded} par une poignée de passionnés du bourg,
            le Football Club Plouha a grandi au rythme du village, entre
            terrain de Kermarquer et vue sur les falaises du Bréhat.
            Aujourd'hui, {teams.reduce((sum, t) => sum + t.players, 0)}
            {' '}licenciés répartis en {teams.length} équipes, de l'école de
            foot aux séniors, portent haut les couleurs bleu, jaune et rouge.
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <ShieldHalf className="text-[var(--club-red)] shrink-0" size={26} />
              <div>
                <div className="font-condensed font-bold">Valeurs</div>
                <div className="text-sm text-[var(--club-navy-deep)]/70">Respect, engagement, convivialité</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trophy className="text-[var(--club-red)] shrink-0" size={26} />
              <div>
                <div className="font-condensed font-bold">Palmarès</div>
                <div className="text-sm text-[var(--club-navy-deep)]/70">3 titres de District depuis 2010</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="text-[var(--club-red)] shrink-0" size={26} />
              <div>
                <div className="font-condensed font-bold">Bénévoles</div>
                <div className="text-sm text-[var(--club-navy-deep)]/70">Plus de 40 bénévoles actifs</div>
              </div>
            </div>
          </div>
          <Link
            to="/club"
            className="inline-flex items-center gap-2 mt-8 font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] transition-colors"
          >
            En savoir plus sur le club <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* NEWS */}
      <section className="bg-[var(--club-navy)]/[0.04] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <SectionHeading eyebrow="À la une" title="Dernières actualités" />
            <Link
              to="/actualites"
              className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
            >
              Toutes les actualités <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {news.map((item, i) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-black/5"
              >
                <PhotoTile hue={i % 2 === 0 ? 214 : 0} caption={item.category} className="h-36" />
                <div className="p-5">
                  <div className="text-xs font-condensed font-semibold text-[var(--club-navy)]/60 tracking-wide">
                    {formatDate(item.date)}
                  </div>
                  <h3 className="mt-2 font-condensed font-bold text-lg leading-snug normal-case">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--club-navy-deep)]/70 leading-relaxed line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TEAMS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <SectionHeading eyebrow="Effectifs" title="Toutes nos équipes" />
          <Link
            to="/equipes"
            className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
          >
            Le détail des équipes <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.slice(0, 6).map((team) => (
            <div
              key={team.id}
              className="p-6 rounded-2xl border border-[var(--club-navy)]/10 hover:border-[var(--club-yellow)] transition-colors bg-white"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-condensed font-bold text-xl normal-case">{team.name}</h3>
                <span className="text-xs font-condensed font-semibold px-2.5 py-1 rounded-full bg-[var(--club-red)]/10 text-[var(--club-red)]">
                  {team.category}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--club-navy-deep)]/70">
                Entraîneur : {team.coach}
              </p>
              <p className="text-sm text-[var(--club-navy-deep)]/70">{team.training}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CALENDAR PREVIEW */}
      <section className="bg-[var(--club-navy-deep)] py-20 grain-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Agenda" title="Prochaines rencontres" dark />
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {upcoming.map((match) => (
              <div
                key={match.id}
                className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 text-white"
              >
                <div className="text-xs font-condensed font-semibold text-[var(--club-yellow)] tracking-widest mb-4">
                  {match.competition}
                </div>
                <div className="flex items-center justify-between font-condensed font-bold text-lg normal-case">
                  <span>{match.home}</span>
                  <span className="text-white/40 text-sm">vs</span>
                  <span>{match.away}</span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-white/60">
                  <CalendarDays size={15} />
                  {formatDate(match.date)} · {match.time}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-sm text-white/60">
                  <MapPin size={15} />
                  {match.venue}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/calendrier"
              className="inline-flex items-center gap-2 bg-[var(--club-yellow)] text-[var(--club-navy-deep)] font-condensed font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors"
            >
              Calendrier complet <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <SectionHeading eyebrow="En images" title="Galerie photo" />
          <Link
            to="/galerie"
            className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
          >
            Voir toute la galerie <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.slice(0, 8).map((img) => (
            <PhotoTile key={img.id} hue={img.hue} caption={img.caption} className="h-44 rounded-xl" />
          ))}
        </div>
      </section>

      {/* SPONSORS */}
      <section className="bg-[var(--club-cream)] border-t border-black/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Ils nous soutiennent" title="Nos partenaires" align="center" />
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="px-6 py-4 bg-white rounded-xl border border-black/5 font-condensed font-bold text-[var(--club-navy)] text-sm"
              >
                {sponsor.name}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/partenaires"
              className="font-condensed font-bold text-[var(--club-navy)] hover:text-[var(--club-red)] inline-flex items-center gap-2"
            >
              Découvrir nos partenaires <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
  export default Home
}
