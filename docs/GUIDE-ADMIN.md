# Guide administrateur — FC Plouha

Ce guide est destiné aux personnes autorisées à gérer le contenu du site du Football Club Plouha.

Vous travaillez uniquement depuis le **panel d'administration du site**. Vous n'avez pas besoin d'accéder à GitHub, Vercel ou Supabase.

---

## 1. Connexion

Ouvrir :

`/admin/login`

Saisir l'adresse email et le mot de passe du compte qui vous a été attribué.

Après connexion, vous arrivez sur le **Dashboard**.

À la fin de votre travail, utilisez **Déconnexion** dans l'administration.

### Règles de compte

- ne partagez pas votre mot de passe ;
- n'enregistrez pas le mot de passe sur un ordinateur public ;
- si vous pensez que votre compte est compromis, prévenez immédiatement l'administrateur technique.

---

## 2. Dashboard

Le Dashboard donne une vue rapide de l'activité du site et permet d'accéder aux principaux modules.

Le badge **Inscriptions** indique les nouvelles demandes reçues. Il se met à jour automatiquement lorsque de nouvelles demandes arrivent.

---

## 3. Actualités

Menu : **Actualités**

Ce module permet de créer, modifier et supprimer les articles du site.

Pour une nouvelle actualité :

1. renseigner le titre ;
2. ajouter un petit résumé ;
3. rédiger le contenu dans l'éditeur ;
4. ajouter une image si nécessaire ;
5. enregistrer/publier.

Pour modifier une actualité existante, utilisez l'action de modification sur l'article concerné.

### Images

Formats acceptés :
- JPEG/JPG ;
- PNG ;
- WebP.

Taille maximale : **5 Mo**.

Évitez les images inutilement énormes : une photo correctement compressée accélère le site.

---

## 4. Club

Menu : **Club**

Ce module gère notamment :

### Histoire du club

Vous pouvez ajouter des événements avec :
- une année ;
- un titre ;
- une description.

### Staff / dirigeants

Vous pouvez renseigner :
- nom ;
- fonction ;
- email ;
- téléphone ;
- photo ;
- visibilité.

Un membre désactivé peut rester enregistré dans l'administration sans apparaître sur le site public.

---

## 5. Équipes

Menu : **Équipes**

Chaque équipe peut contenir notamment :
- nom ;
- catégorie ;
- saison ;
- entraîneur ;
- adjoint ;
- présentation ;
- image.

Les équipes alimentent la page publique **Nos équipes** et servent également à rattacher joueurs et matchs.

Avant de supprimer une équipe, vérifiez qu'elle n'est plus utile pour les joueurs ou les matchs enregistrés.

---

## 6. Joueurs

Menu : **Joueurs**

Un joueur peut être associé à une équipe.

Les informations disponibles comprennent notamment :
- prénom ;
- nom ;
- équipe ;
- saison ;
- numéro ;
- présentation ;
- photo ;
- état actif/inactif.

Un joueur inactif reste disponible dans l'administration mais n'est pas affiché au public.

Pour les photos : JPEG, PNG ou WebP, maximum 5 Mo.

---

## 7. Matchs

Menu : **Matchs**

Ce module alimente le calendrier et les résultats.

Lors de la création ou modification d'un match, vérifiez particulièrement :
- l'équipe ;
- l'adversaire ;
- la date ;
- l'heure ;
- domicile/extérieur ;
- compétition ;
- lieu ;
- statut.

Lorsqu'un match est terminé, renseignez le statut correspondant ainsi que le score.

Une erreur de date ou de statut peut faire apparaître le match dans la mauvaise section du site.

---

## 8. Galerie

Menu : **Galerie**

La galerie fonctionne avec des **albums** et des **photos**.

### Albums

Créez d'abord un album, par exemple :
- Reprise 2026/2027 ;
- Match FC Plouha — adversaire ;
- Tournoi jeunes ;
- Vie du club.

### Photos

Ajoutez ensuite les photos dans l'album approprié.

Formats : JPEG, PNG ou WebP.  
Maximum : 5 Mo par image.

Vous pouvez ajouter une légende pour donner du contexte à la photo.

---

## 9. Partenaires

Menu : **Partenaires**

Ce module permet de gérer les sponsors et partenaires affichés sur le site.

Vous pouvez notamment renseigner :
- nom ;
- logo ;
- présentation ;
- lien vers le site du partenaire.

Vérifiez le lien avant publication.

Pour un logo, privilégiez une image nette avec un fond adapté. Formats autorisés : JPEG, PNG ou WebP, maximum 5 Mo.

---

## 10. Inscriptions et demandes

Menu : **Inscriptions**

Les formulaires envoyés depuis le site arrivent ici.

Les demandes peuvent correspondre à :
- joueur ;
- bénévole ;
- partenaire ;
- autre demande.

Une nouvelle demande arrive avec le statut **Nouveau**.

Traitez la demande puis changez son statut selon son avancement.

### Données personnelles

Les demandes peuvent contenir un nom, un email, un téléphone et un message.

Ces informations ne doivent pas être :
- publiées sur le site ;
- copiées dans un espace public ;
- transmises à une personne qui n'en a pas besoin.

Seuls les utilisateurs connectés à l'administration peuvent consulter ces demandes.

---

## 11. Paramètres

Menu : **Paramètres**

Ce module contient les informations générales du club, notamment selon les champs disponibles :
- saison ;
- année ;
- adresse ;
- email ;
- réseaux sociaux ;
- présentation.

Ces informations peuvent être réutilisées à plusieurs endroits du site.

Modifiez-les avec précaution.

---

## 12. Bonnes pratiques

Avant de publier :
- relisez les noms et l'orthographe ;
- vérifiez les dates et horaires ;
- vérifiez l'équipe concernée ;
- contrôlez les liens ;
- choisissez une image adaptée ;
- ouvrez la page publique après une modification importante.

Pour les photos, évitez de publier une image lorsque le club ne dispose pas des autorisations nécessaires.

---

## 13. Ce qu'un utilisateur du CMS ne doit pas faire

Vous n'avez pas à intervenir directement dans :
- Supabase ;
- GitHub ;
- Vercel ;
- les variables d'environnement ;
- les règles de sécurité ;
- la base de données ;
- les buckets de stockage.

Si quelque chose semble cassé techniquement, **ne tentez pas de contourner le problème**. Prévenez l'administrateur technique.

En particulier, ne demandez jamais :
- de désactiver une sécurité pour « faire marcher » un formulaire ;
- de rendre un stockage accessible en écriture à tout le monde ;
- de partager une clé ou un mot de passe technique.

---

## 14. En cas de problème

### Impossible de se connecter

Vérifiez d'abord :
- l'adresse email ;
- le mot de passe ;
- la connexion Internet.

Si le problème continue, contactez l'administrateur technique.

### Une image est refusée

Vérifiez :
- qu'elle est en JPEG/JPG, PNG ou WebP ;
- qu'elle fait moins de 5 Mo.

### Une modification n'apparaît pas

Rechargez d'abord la page publique. Si le contenu reste incorrect, ne recréez pas plusieurs fois la même donnée : contactez l'administrateur technique.

### Le site affiche une erreur

Notez :
- la page concernée ;
- l'action réalisée ;
- l'heure approximative ;
- si possible, faites une capture d'écran.

Transmettez ces informations à l'administrateur technique.

---

## 15. Résumé

Le CMS est l'outil de gestion quotidien du club :

**Actualités · Club · Équipes · Joueurs · Inscriptions · Matchs · Galerie · Partenaires · Paramètres**

L'infrastructure technique reste séparée de cette administration. Pour gérer le contenu du FC Plouha, vous devez normalement pouvoir tout faire depuis `/admin`.
