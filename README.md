# medicare-keycloak

Portail de rendez-vous médicaux **fictif**, sécurisé par [Keycloak](https://www.keycloak.org/)
(OAuth 2.0, OpenID Connect, Authorization Code + PKCE). Projet d'apprentissage IAM.

> **Statut : en cours.** Toutes les données sont fictives. Les comptes de test (mot de passe = nom
> d'utilisateur) sont réservés au développement local.

## Ce qui est réalisé

- [x] Keycloak 26.7.0 et deux bases PostgreSQL avec Docker Compose
- [x] Realm `medicare`, clients `medicare-ui` (public, PKCE `S256`) et `medicare-api`
- [x] Client roles `PATIENT`, `DOCTOR`, `SECRETARY`, `ADMIN`, groupes et utilisateurs de test
- [x] Flux Authorization Code + PKCE exécuté à la main, tokens analysés
- [x] Test négatif : un `code_verifier` incorrect est refusé par Keycloak
- [ ] API Spring Boot (validation JWT, rôles, contrôle d'accès)
- [ ] Frontend React (login OIDC)
- [ ] MFA pour les médecins

## Prérequis

Docker, Node.js 18 ou supérieur.

## Démarrage

```bash
docker compose up -d
```

Console Keycloak : http://localhost:8080 (compte de développement `admin` / `admin`).

## Tester le flux PKCE

```bash
node tests/login-flow.js
```

Le script génère le couple PKCE, affiche l'URL de login et écoute sur `http://localhost:3000/`
(le `redirect_uri` autorisé). Après la connexion (par exemple `patient1` / `patient1`), il vérifie
le `state`, échange le code et affiche les tokens décodés.

## Modèle IAM

| Élément | Valeur |
|---|---|
| Realm | `medicare` |
| `medicare-ui` | Client public, Standard flow, PKCE `S256`, flux Password et Implicit désactivés |
| `medicare-api` | Porte les client roles, aucun flux de connexion |
| Groupes | `PATIENTS`, `DOCTORS`, `SECRETARIES`, `ADMINS` (rôles attribués aux groupes) |

## Limites

Keycloak tourne en mode `start-dev` (HTTP, non destiné à la production) avec des identifiants de
démonstration.