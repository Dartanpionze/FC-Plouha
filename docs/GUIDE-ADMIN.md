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

### Première connexion après une invitation

Lorsqu'un Superadmin crée votre compte :

1. vous recevez un email d'invitation ;
2. ouvrez le lien contenu dans cet email ;
3. choisissez votre mot de passe ;
4. votre compte est ensuite utilisable depuis `/admin/login`.

Le lien d'invitation est personnel. Ne le transférez pas.

### Règles de compte

- ne partagez pas votre mot de passe ;
- n'utilisez pas le compte d'une autre personne ;
- n'enregistrez pas le mot de passe sur un ordinateur public ;
- si vous pensez que votre compte est compromis, prévenez immédiatement le Superadmin ou l'administrateur technique.

---

## 2. Rôles et permissions

Le CMS possède deux types de comptes.

### Superadmin

Le **Superadmin** dispose de l'accès complet au CMS.

Il peut notamment :

- accéder à tous les modules ;
- créer, modifier et supprimer le contenu ;
- inviter de nouveaux administrateurs ;
- attribuer ou modifier leurs permissions ;
- désactiver et réactiver un compte administrateur ;
- supprimer définitivement un compte administrateur.

La gestion des utilisateurs est réservée au Superadmin.

### Admin

Un **Admin** ne voit et n'utilise que les modules qui lui ont été autorisés.

Les permissions sont définies séparément pour chaque module :

- **Voir** : consulter le contenu du module ;
- **Créer** : ajouter un nouvel élément ;
- **Modifier** : modifier un élément existant ;
- **Supprimer** : supprimer un élément.

Un Admin peut donc, par exemple, être autorisé à voir, créer et modifier les actualités sans avoir le droit de les supprimer.

Si un module n'apparaît pas dans votre menu, cela signifie normalement que votre compte n'a pas la permission de le consulter.

Les restrictions ne concernent pas seulement les boutons affichés : les pages, les données et les fichiers du CMS sont également protégés côté serveur et base de données.

---

## 3. Dashboard

Le Dashboard donne une vue rapide de l'activité du site.

Son contenu dépend de vos permissions : vous ne voyez que les informations correspondant aux modules auxquels vous avez accès.

Le badge **Inscriptions** indique les nouvelles demandes reçues lorsque votre compte est autorisé à consulter ce module.

---

## 4. Actualités

Menu : **Actualités**

Ce module permet, selon vos permissions, de consulter, créer, modifier ou supprimer les articles du site.

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

Lors du remplacement d'une image, le CMS gère également le nettoyage de l'ancienne image lorsque vos droits permettent cette modification.

Évitez les images inutilement énormes : une photo correctement compressée accélère le site.

---

## 5. Club

Menu : **Club**

Ce module gère notamment l'histoire du club et le staff/les dirigeants.

### Histoire du club

Vous pouvez, selon vos permissions, ajouter ou modifier des événements avec :

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

## 6. Équipes

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

## 7. Joueurs

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

Un joueur inactif reste disponible pour les administrateurs disposant de l'accès au module, mais n'est pas affiché au public.

Pour les photos : JPEG, PNG ou WebP, maximum 5 Mo.

---

## 8. Matchs

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

## 9. Galerie

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

## 10. Partenaires

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

## 11. Inscriptions et demandes

Menu : **Inscriptions**

Les formulaires envoyés depuis le site arrivent ici.

Les demandes peuvent correspondre à :

- joueur ;
- bénévole ;
- partenaire ;
- autre demande.

Une nouvelle demande arrive avec le statut **Nouveau**.

Selon vos permissions, vous pouvez consulter la demande, modifier son statut ou ses notes, ou la supprimer.

### Données personnelles

Les demandes peuvent contenir un nom, un email, un téléphone et un message.

Ces informations ne doivent pas être :

- publiées sur le site ;
- copiées dans un espace public ;
- transmises à une personne qui n'en a pas besoin.

Seuls les comptes autorisés à consulter le module **Inscriptions** peuvent accéder à ces demandes depuis le CMS.

---

## 12. Paramètres

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

Si vous disposez uniquement de la permission **Voir**, les champs restent consultables mais ne sont pas modifiables.

---

## 13. Gestion des administrateurs — Superadmin

Cette partie concerne uniquement le **Superadmin**.

Menu : **Utilisateurs** / gestion des administrateurs.

### Inviter un administrateur

Pour créer un compte :

1. ouvrir la gestion des utilisateurs ;
2. choisir **Inviter un administrateur** ;
3. renseigner son nom et son adresse email ;
4. sélectionner ses permissions pour chaque module ;
5. envoyer l'invitation.

Le nouvel utilisateur reçoit un email lui permettant d'activer son compte et de définir son mot de passe.

### Modifier les permissions

Les permissions peuvent être adaptées à la fonction de chaque personne.

Il est recommandé de donner uniquement les droits nécessaires.

Exemple : une personne chargée de la communication peut disposer de :

- Actualités : Voir, Créer, Modifier ;
- Galerie : Voir, Créer, Modifier ;
- aucun droit de suppression si cela n'est pas nécessaire.

### Désactiver un compte

La désactivation permet de retirer l'accès au CMS sans supprimer définitivement le compte.

Utilisez-la notamment lorsqu'une personne :

- quitte temporairement ses fonctions ;
- ne doit plus accéder au CMS pour le moment ;
- doit être bloquée rapidement sans perdre immédiatement son compte.

Un compte désactivé peut ensuite être **réactivé**.

### Supprimer un compte

La suppression est **définitive**.

Elle supprime le compte administrateur ainsi que son accès d'authentification et ses permissions associées.

Utilisez de préférence la désactivation lorsqu'il existe un doute sur la nécessité de supprimer définitivement le compte.

Les comptes Superadmin sont protégés contre ces actions depuis l'interface normale de gestion des utilisateurs.

---

## 14. Bonnes pratiques

Avant de publier :

- relisez les noms et l'orthographe ;
- vérifiez les dates et horaires ;
- vérifiez l'équipe concernée ;
- contrôlez les liens ;
- choisissez une image adaptée ;
- ouvrez la page publique après une modification importante.

Pour les photos, évitez de publier une image lorsque le club ne dispose pas des autorisations nécessaires.

Concernant les permissions administrateur :

- appliquez le principe du minimum nécessaire ;
- évitez de donner **Supprimer** lorsqu'il n'est pas utile ;
- désactivez rapidement un compte qui ne doit plus être utilisé ;
- ne créez pas de compte partagé entre plusieurs personnes.

---

## 15. Ce qu'un utilisateur du CMS ne doit pas faire

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

## 16. En cas de problème

### Impossible de se connecter

Vérifiez d'abord :

- l'adresse email ;
- le mot de passe ;
- la connexion Internet.

Si votre compte a été désactivé, seul un Superadmin peut le réactiver.

Si le problème continue, contactez le Superadmin ou l'administrateur technique.

### Un module a disparu

Cela peut être normal si vos permissions ont été modifiées.

Contactez le Superadmin si vous pensez devoir disposer de cet accès.

### Un bouton Créer, Modifier ou Supprimer n'apparaît pas

Les actions disponibles dépendent des permissions attribuées à votre compte.

L'absence d'un bouton ne signifie donc pas nécessairement qu'il existe un problème technique.

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

## 17. Résumé

Le CMS est l'outil de gestion quotidien du club :

**Actualités · Club · Équipes · Joueurs · Inscriptions · Matchs · Galerie · Partenaires · Paramètres**

Les accès sont contrôlés individuellement par compte et par module.

Le **Superadmin** gère l'ensemble du CMS et les comptes administrateurs.  
Les **Admins** disposent uniquement des modules et actions qui leur ont été attribués.

L'infrastructure technique reste séparée de cette administration. Pour gérer le contenu du FC Plouha, un utilisateur autorisé doit normalement pouvoir effectuer son travail uniquement depuis `/admin`.
