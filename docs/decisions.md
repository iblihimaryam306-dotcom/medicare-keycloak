# Décisions de conception

Chaque décision suit le même plan : le contexte, le choix retenu, ses conséquences. Elles expliquent
pourquoi le projet est construit ainsi, pas seulement comment.

## 1. Authorization Code + PKCE pour l'interface

**Contexte.** L'interface est une application navigateur : elle ne peut pas garder un secret de client.

**Décision.** Le client `medicare-ui` est **public**, avec uniquement le *Standard flow* et PKCE `S256`
obligatoire. Les flux *Implicit* et *Direct access grants* sont désactivés.

**Conséquences.**
- Le mot de passe n'est saisi que sur la page Keycloak ; l'interface ne le voit jamais.
- Un code d'autorisation intercepté est inutilisable sans le `code_verifier`, qui reste dans le navigateur.
  Vérifié : un `code_verifier` incorrect donne `invalid_grant`.
- Le jeton n'est jamais placé dans l'URL (le flux *Implicit* l'y mettrait).

## 2. Un client `medicare-api` séparé pour porter les rôles

**Contexte.** Les rôles décrivent ce qu'on peut faire sur l'API, pas sur l'interface.

**Décision.** Les rôles `PATIENT`, `DOCTOR`, `SECRETARY`, `ADMIN` sont des **client roles** de
`medicare-api`. Ils apparaissent dans le jeton sous `resource_access.medicare-api.roles`, et `medicare-api`
est ajouté à l'audience (`aud`).

**Conséquences.**
- Les rôles sont rattachés à la ressource protégée, pas au realm entier : si une deuxième API apparaît,
  ses rôles sont distincts.
- L'API ignore les rôles des autres clients présents dans le jeton (par exemple `account`).
- Le client `medicare-api` n'a ni flux ni URL : personne ne s'y connecte.

## 3. Les rôles s'attribuent par groupes

**Décision.** Quatre groupes (`PATIENTS`, `DOCTORS`, `SECRETARIES`, `ADMINS`) portent chacun un rôle ; les
utilisateurs sont membres d'un groupe.

**Conséquences.** Changer le rôle d'une personne revient à changer son groupe. Le rôle d'un utilisateur
n'est jamais attribué à la main, ce qui limite les erreurs et rend l'export du realm lisible.

## 4. L'API valide le jeton elle-même

**Contexte.** L'API ne doit pas faire confiance à ce que dit l'interface.

**Décision.** L'API est un *resource server* Spring Security. Elle vérifie, pour chaque requête : la
**signature** RS256 (clés publiques récupérées via JWKS), l'**émetteur** (`issuer-uri`), l'**expiration** et
l'**audience** (`jwt.audiences=medicare-api`).

**Conséquences.**
- Pas de secret partagé : Keycloak signe avec sa clé privée, l'API vérifie avec la clé publique.
- Un jeton falsifié (rôle modifié) est rejeté : `Invalid signature`.
- Un jeton valide mais émis pour une autre API est rejeté : `The aud claim is not valid`.
- L'API continue de valider sans appeler Keycloak à chaque requête ; en contrepartie, un jeton reste
  valide jusqu'à son expiration (5 minutes ici), même si le compte est désactivé entre-temps.

## 5. Deux niveaux de contrôle d'accès

**Contexte.** Un contrôle par rôle seul laisse passer l'IDOR : `patient2` a le bon rôle sur
`/api/records/1` et pourtant ce dossier n'est pas le sien.

**Décision.**
1. **Par rôle**, dans `SecurityConfig` : chaque zone de l'API est associée à ses rôles.
2. **Par objet**, dans les contrôleurs : le `sub` du jeton est comparé au propriétaire de la donnée
   (patient) ou à la relation de soin (médecin).

**Conséquences.**
- Le `sub` est signé, donc non falsifiable : c'est lui qui relie l'identité Keycloak aux données métier.
- La règle d'accès à l'objet est écrite dans le code qui lit la donnée, pas dans l'interface.
- Les refus au niveau de l'objet sont journalisés ; ceux du filtre par rôle ne le sont pas (voir le modèle
  de menaces).

## 6. Séparation des tâches

**Décision.** La secrétaire gère les rendez-vous mais ne voit pas le contenu médical. L'administrateur
supervise (journal d'audit) mais n'a accès ni aux rendez-vous ni aux dossiers.

**Conséquences.** Aucun rôle ne cumule la gestion des comptes et la lecture des dossiers : un administrateur
compromis ne donne pas accès au contenu médical. Vérifié par les scénarios `secretary1` et `admin1` sur
`/api/records/1` (403).

## 7. MFA conditionnel par rôle

**Contexte.** Les données des médecins sont les plus sensibles ; imposer un code à tous dégrade
l'usage sans gain proportionnel.

**Décision.** Un flux d'authentification dédié, `browser-doctor-mfa`, lié au flux navigateur : après
l'identifiant et le mot de passe, un sous-flux **Conditional** « Doctor MFA » contient la condition
« rôle utilisateur = `medicare-api.DOCTOR` » puis le formulaire OTP.

**Conséquences.**
- Un patient se connecte sans code ; un médecin doit en saisir un (TOTP, SHA-1, 6 chiffres, 30 s).
- Un médecin sans appareil enregistré est invité à en configurer un à sa première connexion.
- Keycloak n'évalue une condition que dans un sous-flux *Conditional*, d'où cette structure.
- Limite : le MFA n'est appliqué que sur le flux navigateur (voir la décision 8).

## 8. Un client de test local, clairement isolé

**Contexte.** Il faut des jetons pour tester l'API automatiquement, sans passer par un navigateur.

**Décision.** Le client `medicare-test` n'active que le flux *Password* (*Direct access grants*), n'a
aucune URL de redirection et sert uniquement à `tests/get-tokens.js`. Pour un médecin qui a déjà un OTP,
le script envoie le code TOTP calculé à partir de la clé stockée localement.

**Conséquences.**
- Les 27 scénarios sont rejouables en une commande.
- Ce client contourne l'écran de connexion : un médecin **sans** OTP enregistré obtient un jeton avec son
  seul mot de passe. Il ne doit donc exister qu'en développement local.

## 9. Données fictives en mémoire, liées au `sub`

**Décision.** Les rendez-vous, dossiers et relations de soin sont des données fictives codées dans
`DemoData`, indexées par le `sub` Keycloak. Il n'y a pas de base de données applicative dans cette version.

**Conséquences.** Le projet se concentre sur l'identité et les accès. Les identifiants `sub` doivent être
stables, d'où la décision 11. Les données sont réinitialisées à chaque redémarrage de l'API.

## 10. Interface : jeton en mémoire et pas de CORS ouvert

**Décision.**
- Le jeton est conservé **en mémoire** par `keycloak-js`, jamais dans `localStorage`. Seul un indicateur
  non sensible (« une session a été ouverte ») est gardé dans `sessionStorage` pour retrouver la session après
  un rechargement.
- Le jeton est renouvelé automatiquement avant son expiration.
- En développement, Vite relaie `/api` vers l'API : le navigateur voit une seule origine, donc l'API
  n'a aucune règle CORS à ouvrir.
- Le filtrage des menus par rôle reste de l'ergonomie : l'API refuse de toute façon.

**Conséquences.** Un script injecté ne trouve pas de jeton à lire dans le stockage persistant. Il pourrait
toutefois appeler l'API pendant la session : c'est le risque résiduel d'une XSS (voir le modèle de menaces).

## 11. Une configuration Keycloak reproductible, sans secret

**Contexte.** Sans export, la configuration n'existe que dans la base de données de la machine du
développeur.

**Décision.** Le realm est exporté **sans comptes** (`keycloak/realm-export.json`). Le script
`keycloak/build-import.js` ajoute les six comptes de démonstration avec leurs identifiants fixes et produit
`keycloak/realm-medicare.json`, importé au démarrage par `start-dev --import-realm`.

**Conséquences.**
- Cloner le dépôt et lancer `docker compose up -d` suffit à retrouver le realm.
- Un export avec comptes contiendrait les hachages de mots de passe et les secrets OTP : ils ne sont donc
  jamais exportés. Les médecins se réenrôlent après un import neuf.
- Les mots de passe de démonstration figurent en clair dans le fichier d'import (Keycloak les hache) :
  acceptable pour un jeu de données local, jamais en production.

## 12. Un journal d'audit minimal, en mémoire

**Décision.** Chaque décision prise dans un contrôleur est enregistrée : horodatage, acteur, rôle, action,
ressource, résultat (`ALLOWED`, `DENIED`, `NOT_FOUND`). Seul l'administrateur peut le lire.

**Conséquences.** La traçabilité des accès aux dossiers est démontrée. En contrepartie, le journal est
perdu au redémarrage et ne contient pas les refus du filtrage par rôle ; un vrai système l'enverrait vers
un stockage persistant et protégé en écriture.
