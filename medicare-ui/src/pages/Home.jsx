import { DEMO_ACCOUNTS, SECURITY_FEATURES } from "../roles.js";
import { login } from "../auth.js";
import { Icon, Logo, RoleBadge } from "../ui.jsx";

export default function Home({ authError }) {
  return (
    <div className="landing">
      <nav className="nav-public">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-name">MediCare</div>
            <div className="brand-sub">Portail médical sécurisé</div>
          </div>
        </div>
        <button className="btn" onClick={login}>
          <Icon name="lock" size={16} /> Se connecter
        </button>
      </nav>

      {authError && (
        <div className="banner">
          <div className="notice bad">
            <Icon name="alert" /> Keycloak est injoignable ({authError}). Vérifie que le conteneur tourne sur le port 8080.
          </div>
        </div>
      )}

      <header className="hero">
        <svg className="hero-cross" width="300" height="300" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M26 6h12v20h20v12H38v20H26V38H6V26h20z" fill="#fff" />
        </svg>
        <h1>
          Des données de santé <em>protégées</em> à chaque requête.
        </h1>
        <p className="lead">
          MediCare est un portail de rendez-vous médicaux dont l'identité et les accès reposent sur Keycloak : chaque
          utilisateur ne voit que ce que son rôle et sa relation de soin l'autorisent.
        </p>
        <div className="hero-actions">
          <button className="btn big light" onClick={login}>
            Se connecter <Icon name="arrow" size={16} />
          </button>
          <a className="btn big outline-light" href="#securite">
            Voir les protections
          </a>
        </div>
        <div className="hero-tags">
          <span>OAuth 2.0</span>
          <span>OpenID Connect</span>
          <span>PKCE S256</span>
          <span>JWT RS256</span>
          <span>RBAC</span>
          <span>MFA TOTP</span>
        </div>
      </header>

      <section className="section" id="securite">
        <h2>Six protections, vérifiées par 27 tests automatiques</h2>
        <p className="muted">
          Le moindre privilège et la séparation des tâches sont appliqués côté serveur, pas seulement dans cette interface.
        </p>
        <div className="grid cols-3">
          {SECURITY_FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="stat-icon">
                <Icon name={f.icon} size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Comment une requête est protégée</h2>
        <p className="muted">Le mot de passe n'est saisi que chez Keycloak. L'API ne fait confiance qu'à un jeton signé.</p>
        <div className="flow">
          <div className="flow-node">
            <strong>1. Navigateur</strong>
            <span>Génère un défi PKCE et redirige vers Keycloak.</span>
          </div>
          <div className="flow-arrow">
            <Icon name="arrow" />
          </div>
          <div className="flow-node">
            <strong>2. Keycloak</strong>
            <span>Authentifie (+ code TOTP pour les médecins) et émet un jeton signé.</span>
          </div>
          <div className="flow-arrow">
            <Icon name="arrow" />
          </div>
          <div className="flow-node">
            <strong>3. API Spring Boot</strong>
            <span>Vérifie signature, audience, rôle, puis le propriétaire de la donnée.</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Comptes de démonstration</h2>
        <p className="muted">Environnement local uniquement. Le mot de passe est identique au nom d'utilisateur.</p>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Particularité</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ACCOUNTS.map((a) => (
                  <tr key={a.user}>
                    <td className="mono">{a.user}</td>
                    <td>
                      <RoleBadge role={a.role} />
                    </td>
                    <td className="muted">{a.note || "Mot de passe seul"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="landing-foot">Projet pédagogique de cybersécurité · toutes les données sont fictives</footer>
    </div>
  );
}
