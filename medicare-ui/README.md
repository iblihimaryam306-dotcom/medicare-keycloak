# medicare-ui

Interface React du portail MediCare. Elle se connecte à Keycloak (Authorization Code + PKCE S256) et appelle l'API Spring Boot avec le jeton obtenu.

## Prérequis

- Node.js 20 ou plus récent
- Keycloak qui tourne sur `http://localhost:8080` (realm `medicare`, client `medicare-ui`)
- L'API Spring Boot qui tourne sur `http://localhost:9080`

## Lancer

```
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

Le port 3000 est imposé (`strictPort`) : c'est le seul que le client Keycloak `medicare-ui` accepte. Ne lance donc pas `tests/login-flow.js` en même temps.

## Comptes de démonstration

Le mot de passe est identique au nom d'utilisateur.

| Utilisateur | Rôle | Particularité |
|---|---|---|
| patient1, patient2 | Patient | |
| doctor1, doctor2 | Médecin | code TOTP exigé |
| secretary1 | Secrétaire | |
| admin1 | Administrateur | |

Pour un médecin, calcule le code avec la clé enregistrée dans `tests/otp-secrets.json.local` :

```
node tests/totp.js <clé base32>
```

## Choix de sécurité

- Le jeton reste en mémoire : jamais dans `localStorage` ni `sessionStorage`. Seul un indice non sensible (« une session a été ouverte ») est gardé pour retrouver la session après un rechargement.
- Le jeton est renouvelé automatiquement avant son expiration.
- Les appels `/api/...` passent par le serveur de développement Vite (proxy vers le port 9080) : le navigateur ne voit qu'une origine, aucune règle CORS n'est nécessaire.
- Le filtrage des menus par rôle n'est que de l'ergonomie. La vraie protection est dans l'API (`SecurityConfig` et contrôleurs).

## Structure

```
src/
  auth.js        connexion PKCE, rôles, identité
  api.js         appels à l'API avec le jeton
  useApi.js      hook de chargement
  ui.jsx         composants communs (badges, cartes, états d'erreur)
  roles.js       description des rôles et des protections
  components/    Layout, RecordViewer
  pages/         Home, Dashboard, Appointments, Records, Patients, Audit, Token, Lab
```

## Pages

- Accueil publique : protections et comptes de démonstration
- Tableau de bord par rôle
- Rendez-vous, dossiers, patients, journal d'audit (selon le rôle)
- Mon jeton : identité, rôles, audience, validité, contenu décodé
- Laboratoire de sécurité : accès interdits tentés en direct avec comparaison attendu / obtenu
