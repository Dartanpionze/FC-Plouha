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
