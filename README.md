# Football Club Plouha — Site officiel & CMS

Site officiel du Football Club Plouha avec espace d'administration intégré.

## Architecture

- **Frontend** : React 19 + TypeScript + Vite
- **Styles** : Tailwind CSS 4 + styles globaux
- **Routing** : React Router
- **Backend / base / authentification / stockage** : Supabase
- **Éditeur d'actualités** : Tiptap
- **Hébergement** : Vercel
- **Dépôt source** : GitHub
- **Email** : Resend est conservé dans le projet pour un usage futur ; le formulaire public enregistre actuellement les demandes dans Supabase.

## Principe d'accès

L'infrastructure technique reste sous la responsabilité d'un **administrateur technique unique**.

Les utilisateurs du CMS n'ont pas besoin d'accéder à :
- GitHub ;
- Vercel ;
- Supabase.

Ils utilisent uniquement l'espace `/admin`.

> Ne jamais communiquer les accès Supabase, Vercel ou GitHub à un utilisateur qui a seulement besoin de gérer le contenu du club.

## Commandes

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

`npm run build` exécute d'abord le contrôle TypeScript (`tsc --noEmit`), puis le build Vite.

## Variables d'environnement

Créer les variables suivantes dans l'environnement de déploiement :

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Conservées pour l'API Resend actuellement dormante
RESEND_API_KEY=
CONTACT_TO_EMAIL=
```

Ne jamais versionner une clé secrète dans GitHub.

## Routes publiques

| Route | Fonction |
|---|---|
| `/` | Accueil |
| `/club` | Présentation, histoire et staff |
| `/equipes` | Liste des équipes |
| `/equipes/:id` | Détail d'une équipe et joueurs |
| `/calendrier` | Matchs et résultats |
| `/actualites` | Liste des actualités |
| `/actualites/:id` | Lecture d'une actualité |
| `/galerie` | Albums et photos |
| `/partenaires` | Partenaires |
| `/contact` | Contact et demandes d'inscription |
| `*` | Page 404 |

## Routes d'administration

| Route | Module |
|---|---|
| `/admin/login` | Connexion |
| `/admin` | Dashboard |
| `/admin/news` | Actualités |
| `/admin/club` | Histoire et staff |
| `/admin/teams` | Équipes |
| `/admin/players` | Joueurs |
| `/admin/registrations` | Inscriptions / demandes |
| `/admin/matches` | Matchs |
| `/admin/gallery` | Galerie |
| `/admin/partners` | Partenaires |
| `/admin/settings` | Paramètres du club |

`AdminLayout` vérifie la session Supabase et renvoie vers `/admin/login` si aucune session n'est active.

## Tables Supabase

Le site utilise les tables suivantes :

- `news`
- `teams`
- `players`
- `matches`
- `gallery_albums`
- `gallery_photos`
- `partners`
- `club_settings`
- `club_history`
- `club_staff`
- `registrations`

### RLS

Le Row Level Security est activé sur les 11 tables.

Principes actuellement appliqués :
- contenu du site : lecture publique lorsque nécessaire ;
- création/modification/suppression : utilisateurs authentifiés ;
- `players` et `club_staff` : le public ne voit que les éléments actifs ;
- `registrations` : le public peut uniquement créer une demande avec le statut `Nouveau` ;
- lecture, modification et suppression des inscriptions : utilisateurs authentifiés uniquement.

**Ne jamais désactiver le RLS pour résoudre rapidement un problème.**

## Supabase Storage

Buckets :

- `news-images`
- `team-images`
- `player-images`
- `gallery-images`
- `partner-logos`
- `staff-images`

Ils sont publics pour permettre l'affichage des images sur le site.

Les opérations d'upload et de suppression sont réservées aux utilisateurs authentifiés.

Contraintes serveur :
- taille maximale : **5 Mo** ;
- MIME autorisés : `image/jpeg`, `image/png`, `image/webp`.

Le frontend applique également ces contrôles via `src/lib/uploads.ts`.

`src/lib/storage.ts` gère notamment la suppression des anciens fichiers lorsqu'une image est remplacée.

## Sécurité importante

À conserver impérativement :

1. RLS activé sur toutes les tables applicatives.
2. Aucun `INSERT` anonyme sur `storage.objects`.
3. Les inscriptions ne doivent jamais disposer d'une policy `SELECT` pour `anon`.
4. Les clés privées ne doivent jamais être placées dans `VITE_*` : ces variables sont exposées au navigateur.
5. Les accès GitHub, Vercel et Supabase restent réservés à l'administrateur technique.
6. Les comptes CMS sont créés uniquement pour des personnes autorisées.
7. Ne jamais supprimer directement des lignes dans `storage.objects` par SQL pour nettoyer les images.

## Structure utile

```text
src/
├── admin/
│   ├── components/
│   │   ├── RequireAdminPermission.tsx
│   │   └── RequireSuperadmin.tsx
│   ├── hooks/useAdminAccess.ts
│   ├── layouts/AdminLayout.tsx
│   └── pages/
├── components/
│   ├── ClubCrest.tsx
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   ├── ScrollToTop.tsx
│   ├── SectionHeading.tsx
│   └── Seo.tsx
├── lib/
│   ├── adminPermissions.ts
│   ├── storage.ts
│   ├── supabase.ts
│   └── uploads.ts
├── routes/
├── App.tsx
├── Layout.tsx
└── styles.css

api/
└── contact.ts
```

## SEO

Le projet contient :
- métadonnées générales dans `index.html` ;
- composant `src/components/Seo.tsx` ;
- canonical ;
- Open Graph / Twitter ;
- `robots.txt` ;
- `sitemap.xml` ;
- `noindex` sur les pages d'erreur/404 ;
- métadonnées dynamiques pour les articles et équipes.

Le domaine actuel est temporaire. **Lors du passage au domaine officiel du club**, mettre à jour au minimum :
- l'URL du site dans `Seo.tsx` ;
- canonical / Open Graph dans `index.html` ;
- `robots.txt` ;
- `sitemap.xml` ;
- les éventuelles redirections Vercel.

## Déploiement

Workflow normal :

1. modifier/tester le projet ;
2. pousser les changements sur GitHub ;
3. Vercel déclenche le déploiement ;
4. vérifier que `npm run build` passe ;
5. tester le site public et `/admin`.

Un build rouge ne doit pas être ignoré : corriger TypeScript ou Vite avant de considérer une version comme valide.

## Formulaire public

Le formulaire `/contact` crée actuellement une ligne dans `registrations`.

L'API `api/contact.ts` utilisant Resend est conservée pour une éventuelle utilisation future, mais le formulaire public ne dépend pas actuellement de l'envoi d'un email.

Amélioration future recommandée si le spam apparaît : CAPTCHA/Turnstile et/ou limitation de débit côté serveur.


## État du CMS

Le back-office `/admin` couvre actuellement :

- tableau de bord ;
- actualités avec éditeur riche ;
- club et historique ;
- équipes et joueurs ;
- inscriptions ;
- matchs / résultats ;
- galerie et sélection des photos d'accueil ;
- partenaires ;
- paramètres du club ;
- gestion des utilisateurs et permissions par le Superadmin.

Les actions visibles dans chaque module dépendent des permissions `Voir`, `Créer`, `Modifier` et `Supprimer`. Les contrôles d'interface ne remplacent pas les règles RLS Supabase : les deux couches doivent rester cohérentes.


## Maintenance

Avant une modification importante :
- conserver une version stable dans GitHub ;
- éviter de modifier simultanément code, schéma Supabase et policies ;
- tester chaque module après modification ;
- vérifier le site sur mobile et grand écran ;
- contrôler le build Vercel.

Après une modification Supabase :
- vérifier les policies RLS ;
- tester en visiteur déconnecté ;
- tester en admin connecté ;
- vérifier les uploads et suppressions Storage.

## Documentation utilisateur

Le guide destiné aux personnes qui utilisent uniquement le CMS se trouve dans :

`docs/GUIDE-ADMIN.md`

Il ne contient volontairement aucune procédure Supabase, GitHub ou Vercel.
