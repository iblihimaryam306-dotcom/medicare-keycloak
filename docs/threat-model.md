# Modèle de menaces

Ce document recense les menaces envisagées pour MediCare, la contre-mesure mise en place, la **preuve**
(le test qui la vérifie) et le **risque résiduel**. Les mots « testé » et « observé » ne désignent que ce
qui a réellement été exécuté sur le projet.

## Actifs et frontières de confiance

| Actif | Pourquoi il compte |
|---|---|
| Dossiers médicaux (fictifs ici) | Données de santé, les plus sensibles |
| Identités et mots de passe | Permettent d'usurper un utilisateur |
| Jetons d'accès (JWT) | Preuve d'identité présentée à l'API, valable 5 minutes |
| Clés de signature de Keycloak | Leur compromission permettrait de forger des jetons |
| Secrets OTP des médecins | Second facteur d'authentification |

| Frontière | De part et d'autre |
|---|---|
| Navigateur et Keycloak | L'utilisateur saisit ses identifiants uniquement chez Keycloak |
| Navigateur et API | L'API ne fait pas confiance à l'interface : elle vérifie le jeton à chaque requête |
| API et Keycloak | L'API ne reçoit que les clés **publiques** de Keycloak (JWKS) |

## Menaces, contre-mesures et preuves

| # | Menace | Contre-mesure | Preuve | Risque résiduel |
|---|---|---|---|---|
| 1 | Interception du code d'autorisation | PKCE `S256` : le code est inutilisable sans le `code_verifier` | `code_verifier` incorrect : `invalid_grant`, `PKCE verification failed` | Faible. PKCE ne protège pas contre un poste déjà compromis |
| 2 | Rejeu d'un code d'autorisation | Code à usage unique côté Keycloak | Deuxième échange du même code refusé (journal Keycloak) | Faible |
| 3 | Falsification du jeton (rôle modifié) | Signature RS256 vérifiée avec la clé publique | Payload modifié, signature conservée : `401`, `Invalid signature` | Faible tant que la clé privée de Keycloak reste secrète |
| 4 | Jeton valide mais destiné à une autre API | Validation de l'audience `medicare-api` | Audience incorrecte : `401`, `The aud claim is not valid` | Faible |
| 5 | Jeton inventé ou absent | L'API exige un jeton valide hors `/api/health` | Sans jeton : `401` ; faux jeton : `401`, `Malformed token` | Aucun |
| 6 | Élévation verticale (mauvais rôle) | RBAC dans `SecurityConfig`, une zone par rôle | Matrice 4 rôles × 4 zones, 16 cas conformes | Faible |
| 7 | **IDOR** : lire la donnée d'un autre utilisateur avec le bon rôle | Comparaison du `sub` signé au propriétaire ou à la relation de soin | `patient2` sur `/api/records/1` : `403` ; `doctor1` sur le dossier 2 : `403` | Voir la menace 12 (fuite d'existence) |
| 8 | Abus de privilèges (secrétaire ou admin lisant le médical) | Séparation des tâches : ces rôles n'ont pas accès aux dossiers | `secretary1` et `admin1` sur `/api/records/1` : `403` | Faible |
| 9 | Vol du mot de passe d'un médecin | MFA TOTP conditionnel au rôle `DOCTOR` | Patient connecté sans code ; médecin invité à enregistrer un OTP puis à le saisir | Le flux Password du client de test contourne l'écran de connexion (menace 13) |
| 10 | Vol du jeton par XSS | Jeton en mémoire, jamais dans `localStorage` ; durée de vie 5 minutes | Conception (non testé par une attaque XSS) | Un script injecté peut appeler l'API pendant la session. Aucune politique CSP n'est définie dans cette version |
| 11 | CSRF | L'API est sans état : le jeton est envoyé dans l'en-tête `Authorization`, pas dans un cookie, donc le navigateur ne l'ajoute pas tout seul | Conception ; CSRF désactivé volontairement côté API | Faible tant que l'API n'utilise aucun cookie de session |
| 12 | Énumération des identifiants de dossiers | Aucune | **Observé** : un dossier existant mais interdit donne `403`, un dossier inexistant donne `404` (ex. `/api/records/2` et `/api/records/999` pour `patient1`) | **Moyen.** Un attaquant peut distinguer les numéros utilisés. Correctif simple : répondre `404` dans les deux cas |
| 13 | Contournement du MFA par le flux Password | Le client `medicare-test` n'a aucune URL et sert aux tests | Un médecin dont l'OTP est enregistré obtient « Invalid user credentials » sans code TOTP | **Moyen en production.** Un médecin sans OTP enregistré obtient un jeton avec son seul mot de passe : supprimer ce client hors développement |
| 14 | Répudiation (nier un accès) | Journal d'audit des décisions au niveau de l'objet | Le journal contient des `DENIED` sur `record/1` après le test IDOR | Journal en mémoire, perdu au redémarrage ; les refus du filtre par rôle n'y figurent pas |
| 15 | Jeton valide après désactivation du compte | Durée de vie courte (5 minutes observées) | Conception | Un jeton déjà émis reste accepté jusqu'à son expiration : la validation locale ne consulte pas Keycloak |
| 16 | Force brute sur les mots de passe | Aucune configurée | Non testé | **Élevé en production.** À activer dans Keycloak (Realm settings, Security defenses) |
| 17 | Écoute du réseau | Aucune : tout passe en HTTP local | Non testé | **Élevé hors poste local.** TLS obligatoire en production |
| 18 | Secrets dans le dépôt | `.gitignore` sur `*.local`, `.env`, `*.pem`, `*.key` ; export du realm sans comptes | Vérifié sur le dépôt publié : aucun secret OTP, aucun client confidentiel | Les mots de passe de démonstration sont publics par construction |

## Ce qui est volontairement hors périmètre

- Disponibilité et déni de service (limitation de débit, journalisation centralisée).
- Chiffrement des données au repos et sauvegardes : il n'y a pas de base métier dans cette version.
- Conformité réglementaire sur les données de santé (consentement, durée de conservation).
- Durcissement de Keycloak pour la production : HTTPS, base dédiée, comptes d'administration nominatifs,
  suppression de l'administrateur temporaire, surveillance des événements.
- Récupération de compte (mot de passe oublié, perte de l'appareil OTP).

## Améliorations par ordre de priorité

1. Répondre `404` aussi bien pour un dossier inexistant que pour un dossier interdit (menace 12).
2. Supprimer le client `medicare-test` et le flux Password hors développement (menace 13).
3. Journaliser aussi les refus du filtre par rôle et envoyer le journal vers un stockage persistant (menace 14).
4. Activer la protection contre la force brute dans Keycloak (menace 16).
5. Passer en HTTPS et quitter `start-dev` (menace 17).
6. Ajouter une politique CSP et des en-têtes de sécurité à l'interface (menace 10).
7. Prévoir des codes de récupération pour les médecins qui perdent leur appareil OTP.
