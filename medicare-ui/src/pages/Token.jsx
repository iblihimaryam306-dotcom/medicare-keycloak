import { useEffect, useState } from "react";
import { getRole, getRoles, keycloak } from "../auth.js";
import { Card, Icon, PageHeader, RoleBadge } from "../ui.jsx";
import { formatIso } from "../util.js";

function fmtEpoch(s) {
  return s ? formatIso(s * 1000) : "—";
}

export default function Token() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const t = keycloak.tokenParsed || {};
  const lifetime = Math.max((t.exp ?? 0) - (t.iat ?? 0), 1);
  const remaining = Math.max((t.exp ?? 0) + (keycloak.timeSkew ?? 0) - now, 0);
  const pct = Math.min(100, Math.round((remaining / lifetime) * 100));
  const aud = Array.isArray(t.aud) ? t.aud : t.aud ? [t.aud] : [];

  async function renew() {
    setRefreshing(true);
    try {
      await keycloak.updateToken(-1); // force un renouvellement
    } catch {
      /* si le renouvellement échoue, onTokenExpired renverra vers la connexion */
    }
    setRefreshing(false);
    setNow(Math.floor(Date.now() / 1000));
  }

  return (
    <>
      <PageHeader
        title="Mon jeton d'accès"
        subtitle="Ce que Keycloak a émis pour toi, lu dans le JWT. L'API se base uniquement sur ces informations signées."
        actions={
          <button className="btn ghost small" onClick={renew} disabled={refreshing}>
            <Icon name="refresh" size={15} /> Renouveler maintenant
          </button>
        }
      />

      <div className="grid cols-2">
        <Card title="Identité et rôles" icon="users">
          <dl className="kv">
            <dt>Utilisateur</dt>
            <dd>{t.preferred_username || "—"}</dd>
            <dt>Nom</dt>
            <dd>{t.name || "—"}</dd>
            <dt>Rôle(s) API</dt>
            <dd style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {getRoles().length === 0 && "—"}
              {getRoles().map((r) => (
                <RoleBadge key={r} role={r} />
              ))}
            </dd>
            <dt>Identifiant (sub)</dt>
            <dd className="mono">{t.sub || "—"}</dd>
          </dl>
        </Card>

        <Card title="Validité" icon="pulse">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30 }}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </div>
          <div className="meter">
            <span style={{ width: pct + "%" }} />
          </div>
          <p className="muted" style={{ fontSize: 13.5 }}>
            Émis à {fmtEpoch(t.iat)} · expire à {fmtEpoch(t.exp)}. Le jeton est renouvelé automatiquement avant son
            expiration ; il reste uniquement en mémoire du navigateur.
          </p>
        </Card>
      </div>

      <Card title="Revendications vérifiées par l'API" icon="shield">
        <dl className="kv">
          <dt>Émetteur (iss)</dt>
          <dd className="mono">{t.iss || "—"}</dd>
          <dt>Audience (aud)</dt>
          <dd style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {aud.map((a) => (
              <span key={a} className={"badge " + (a === "medicare-api" ? "st-ok" : "")}>
                {a}
              </span>
            ))}
          </dd>
          <dt>Client émetteur (azp)</dt>
          <dd className="mono">{t.azp || "—"}</dd>
          <dt>Rôle retenu par l'interface</dt>
          <dd>
            <RoleBadge role={getRole()} />
          </dd>
        </dl>
        <h3 style={{ margin: "20px 0 10px", fontSize: 15 }}>Comment l'API accepte ou refuse ce jeton</h3>
        <ol className="steps">
          <li>
            <span>
              <strong>Signature</strong> : vérifiée avec la clé publique de Keycloak (JWKS). Si le contenu est modifié, la
              signature ne correspond plus : 401.
            </span>
          </li>
          <li>
            <span>
              <strong>Émetteur et expiration</strong> : le jeton doit venir du realm <code>medicare</code> et ne pas être
              périmé.
            </span>
          </li>
          <li>
            <span>
              <strong>Audience</strong> : <code>medicare-api</code> doit figurer dans <code>aud</code>, sinon un jeton émis
              pour une autre API serait accepté à tort.
            </span>
          </li>
          <li>
            <span>
              <strong>Rôle puis propriétaire</strong> : le rôle est lu dans <code>resource_access</code>, puis l'identifiant{" "}
              <code>sub</code> sert à vérifier que la donnée t'appartient.
            </span>
          </li>
        </ol>
      </Card>

      <Card>
        <details>
          <summary>Voir le contenu décodé du jeton (payload)</summary>
          <pre className="json">{JSON.stringify(t, null, 2)}</pre>
        </details>
        <p className="muted" style={{ fontSize: 13 }}>
          Le jeton brut n'est pas affiché : il ne doit pas apparaître dans une capture d'écran.
        </p>
      </Card>
    </>
  );
}
