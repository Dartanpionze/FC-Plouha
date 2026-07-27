export const club = {
  name: 'Football Club Plouha',
  nickname: 'Les Falaises',
  founded: 2026,
  city: 'Plouha',
  region: 'Côtes-d\'Armor, Bretagne',
  stadium: 'Terrain des sports',
  address: 'Rue Louis Droumaguet, 22580 Plouha',
  email: 'contact@fc-plouha-lesfalaises.bzh',
  phone: '02 96 22 47 13',
}

export interface NewsItem {
  id: number
  title: string
  date: string
  category: string
  excerpt: string
}

export const news: Array<NewsItem> = [
  {
    id: 1,
    title: 'Le FC Plouha prépare son retour',
    date: '2026-07-20',
    category: 'Club',
    excerpt:
      "Les dirigeants travaillent actuellement à la reconstruction du club et à la préparation de la prochaine saison.",
  },{/*
  {
    id: 2,
    title: 'Ouverture des inscriptions pour la saison 2026-2027',
    date: '2026-07-12',
    category: 'Club',
    excerpt:
      "Le forum des associations se tiendra le 30 août salle Kermarquer. Toutes les catégories, des U6 aux vétérans, y seront représentées.",
  },
  {
    id: 3,
    title: 'Journée détente : tournoi inter-génération',
    date: '2026-07-02',
    category: 'Événement',
    excerpt:
      "Parents, licenciés et bénévoles se sont affrontés dans la bonne humeur sur les hauteurs de Kermarquer. Buvette et grillades au programme.",
  },
  {
    id: 4,
    title: 'Nouveau maillot extérieur dévoilé',
    date: '2026-06-24',
    category: 'Club',
    excerpt:
      "En jaune et bleu marine, le nouveau maillot rend hommage aux falaises du Bréhat et sera porté dès la reprise face à Étables.",
  },*/}
]

export interface Team {
  id: string
  name: string
  category: string
  coach: string
  training: string
  players: number
}

export const teams: Array<Team> = [
  {
    id: 'seniors-a',
    name: 'Séniors A',
    category: 'District 4',
    coach: 'Erwan Le Bihan',
    training: 'Dimanche, 15h00',
    players: 5,
  },
  {/*
  {
    id: 'seniors-b',
    name: 'Séniors B',
    category: 'District 2',
    coach: 'Gwenaël Cadic',
    training: 'Mardi & jeudi, 19h00',
    players: 19,
  },
  {
    id: 'feminines',
    name: 'Féminines',
    category: 'District 1',
    coach: 'Maëlle Rouxel',
    training: 'Lundi & mercredi, 18h30',
    players: 17,
  },
  {
    id: 'u17',
    name: 'U17',
    category: 'Championnat Régional',
    coach: 'Tanguy Even',
    training: 'Mercredi & vendredi, 18h00',
    players: 16,
  },
  {
    id: 'u15',
    name: 'U15',
    category: 'Championnat Départemental',
    coach: 'Loïg Guégan',
    training: 'Mercredi & vendredi, 17h30',
    players: 18,
  },
  {
    id: 'ecole-de-foot',
    name: "École de foot (U6-U13)",
    category: 'Plateaux district',
    coach: 'Katell Morvan',
    training: 'Mercredi, 14h00',
    players: 1,
  },*/}
]
*]
export interface Match {
  id: number
  competition: string
  home: string
  away: string
  date: string
  time: string
  venue: string
  played?: boolean
  scoreHome?: number
  scoreAway?: number
}

export const matches: Array<Match> = [
  {
    id: 1,
    competition: 'Régional 3 - J1',
    home: 'FC Plouha',
    away: 'Étables FC',
    date: '2026-08-30',
    time: '15h30',
    venue: 'Stade de Kermarquer',
  },
  {
    id: 2,
    competition: 'Régional 3 - J2',
    home: 'AS Lanvollon',
    away: 'FC Plouha',
    date: '2026-09-06',
    time: '15h30',
    venue: 'Stade de Lanvollon',
  },
  {
    id: 3,
    competition: 'Coupe de Bretagne - T1',
    home: 'FC Plouha',
    away: 'US Pordic',
    date: '2026-09-13',
    time: '16h00',
    venue: 'Stade de Kermarquer',
  },
  {
    id: 4,
    competition: 'Régional 3 - J3',
    home: 'FC Plouha',
    away: 'Goudelin Sportif',
    date: '2026-09-20',
    time: '15h30',
    venue: 'Stade de Kermarquer',
  },
  {
    id: 5,
    competition: 'Régional 3 - J-2',
    home: 'FC Plouha',
    away: 'Lanvollon AS',
    date: '2026-07-19',
    time: '15h30',
    venue: 'Stade de Kermarquer',
    played: true,
    scoreHome: 2,
    scoreAway: 2,
  },
  {
    id: 6,
    competition: 'Amical',
    home: 'US Plouézec',
    away: 'FC Plouha',
    date: '2026-07-05',
    time: '18h00',
    venue: 'Stade de Plouézec',
    played: true,
    scoreHome: 1,
    scoreAway: 3,
  },
]

export interface GalleryImage {
  id: number
  caption: string
  category: string
  hue: number
}

export const gallery: Array<GalleryImage> = [
  { id: 1, caption: 'Coup d\'envoi face à Étables', category: 'Match', hue: 214 },
  { id: 2, caption: 'Les U13 avant leur plateau', category: 'Jeunes', hue: 48 },
  { id: 3, caption: 'But décisif de Le Guennec', category: 'Match', hue: 0 },
  { id: 4, caption: 'Vestiaires avant le derby', category: 'Coulisses', hue: 214 },
  { id: 5, caption: 'Tournoi inter-génération', category: 'Événement', hue: 48 },
  { id: 6, caption: 'Séance vidéo du staff', category: 'Coulisses', hue: 0 },
  { id: 7, caption: 'Remise des maillots', category: 'Club', hue: 214 },
  { id: 8, caption: 'Vue sur les falaises depuis Kermarquer', category: 'Stade', hue: 48 },
]

export interface Sponsor {
  id: number
  name: string
  tier: 'Or' | 'Argent' | 'Bronze'
  sector: string
}

export const sponsors: Array<Sponsor> = [
  { id: 1, name: 'Crédit Armoricain', tier: 'Or', sector: 'Banque' },
  { id: 2, name: 'Menuiserie Le Roux', tier: 'Or', sector: 'Artisanat' },
  { id: 3, name: 'Fruits de Mer Kerdual', tier: 'Argent', sector: 'Mareyage' },
  { id: 4, name: 'Garage Guilloux', tier: 'Argent', sector: 'Automobile' },
  { id: 5, name: 'Boulangerie du Bourg', tier: 'Bronze', sector: 'Alimentation' },
  { id: 6, name: 'Optique de la Baie', tier: 'Bronze', sector: 'Santé' },
  { id: 7, name: 'Camping des Falaises', tier: 'Bronze', sector: 'Tourisme' },
  { id: 8, name: 'Assurances Tanguy', tier: 'Bronze', sector: 'Assurance' },
]
