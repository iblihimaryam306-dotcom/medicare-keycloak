import { useState } from "react";
import { api } from "../api.js";
import { getIdentity, getRole, keycloak } from "../auth.js";
import { Card, Icon, PageHeader, RoleBadge } from "../ui.jsx";
import { forgeToken, HTTP_LABELS } from "../util.js";

// expect({ role, username }) renvoie le code HTTP attendu, ou null si on se contente d'observer.
const SCENARIOS = [
  {
    id: "anon",
    title: "Appel sans jeton",
    why: "Aucune identité fournie : l'API doit répondre 401.",
    method: "GET",
    path: "/api/me",
    mode: "anonymous",
    expect: () => 401,
  },
  {
    id: "forged",
    title: "Jeton falsifié (rôle ADMIN injecté)",
    why: "Le contenu du jeton est modifié mais la signature d'origine est conservée : elle ne correspond plus, l'API répond 401.",
    method: "GET",
    path: "/api/admin/audit",
    mode: "forged",
    expect: () => 401,
  },
  {
    id: "rec1",
    title: "Lire le dossier n° 1 (celui de patient1)",
    why: "Seuls patient1 et son médecin (doctor1) y ont accès. Les autres, même avec un bon rôle, reçoivent 403.",
    method: "GET",
    path: "/api/records/1",
    expect: ({ username }) => (["patient1", "doctor1"].includes(username) ? 200 : 403),
  },
  {
    id: "rec2",
    title: "Lire le dossier n° 2 (celui de patient2)",
    why: "Seuls patient2 et son médecin (doctor2) y ont accès.",
    method: "GET",
    path: "/api/records/2",
    expect: ({ username }) => (["patient2", "doctor2"].includes(username) ? 200 : 403),
  },
  {
    id: "rec999",
    title: "Lire un dossier inexistant (n° 999)",
    why: "Secrétaire et administrateur sont refusés avant même la recherche ; les autres obtiennent 404.",
    method: "GET",
    path: "/api/records/999",
    expect: ({ role, username }) => {
      if (role === "SECRETARY" || role === "ADMIN") return 403;
      if (username === "patient1") return 404;
      return null;
    },
  },
  {
    id: "audit",
    title: "Consulter le journal d'audit",
    why: "Zone réservée au rôle ADMIN.",
    method: "GET",
    path: "/api/admin/audit",
    expect: ({ role }) => (role === "ADMIN" ? 200 : 403),
  },
  {
    id: "patients",
    title: "Lister « mes patients »",
    why: "Route réservée au rôle DOCTOR.",
    method: "GET",
    path: "/api/doctors/me/patients",
    expect: ({ role }) => (role === "DOCTOR" ? 200 : 403),
  },
  {
    id: "myrecords",
    title: "Lister « mes dossiers »",
    why: "Route réservée au rôle PATIENT.",
    method: "GET",
    path: "/api/patients/me/records",
    expect: ({ role }) => (role === "PATIENT" ? 200 : 403),
  },
  {
    id: "appointments",
    title: "Lister les rendez-vous",
    why: "Patient, médecin et secrétaire y ont accès (chacun filtré) ; l'administrateur est refusé.",
    method: "GET",
    path: "/api/appointments",
    expect: ({ role }) => (role === "ADMIN" ? 403 : 200),
  },
  {
    id: "confirm",
    title: "Confirmer le rendez-vous n° 1",
    why: "Réservé à la secrétaire. Cette action modifie les données de démonstration (non incluse dans « Tout exécuter »).",
    method: "PUT",
    path: "/api/appointments/1/confirm",
    manual: true,
    expect: ({ role }) => (role === "SECRETARY" ? 200 : 403),
  },
];

async function execute(sc) {
  const started = performance.now();
  let r;
  if (sc.mode === "anonymous") r = await api(sc.path, { method: sc.method, anonymous: true });
  else if (sc.mode === "forged") r = await api(sc.path, { method: sc.method, bearer: forgeToken(keycloak.token) });
  else r = await api(sc.path, { method: sc.method });
  return { status: r.status, ms: Math.round(performance.now() - started) };
}

function codeClass(status) {
  if (status === 200) return "code-pill code-200";
  if (status >= 400 || status === 0) return "code-pill code-4xx";
  return "code-pill";
}

export default function Lab() {
  const role = getRole();
  const me = getIdentity();
  const ctx = { role, username: me.username };
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  async function runOne(sc) {
    const r = await execute(sc);
    setResults((prev) => ({ ...prev, [sc.id]: r }));
  }

  async function runAll() {
    setRunning(true);
    for (const sc of SCENARIOS.filter((s) => !s.manual)) {
      await runOne(sc);
    }
    setRunning(false);
  }

  const done = SCENARIOS.filter((s) => results[s.id]);
  const checked = done.filter((s) => s.expect(ctx) !== null);
  const conform = checked.filter((s) => results[s.id].status === s.expect(ctx));

  return (
    <>
      <PageHeader
        title="Laboratoire de sécurité"
        subtitle="Tente des accès interdits avec ton propre compte et compare la réponse de l'API à ce qui est attendu."
        actions={
          <button className="btn" onClick={runAll} disabled={running}>
            <Icon name="play" size={14} /> {running ? "Exécution…" : "Tout exécuter"}
          </button>
        }
      />

      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="muted">Connecté en tant que</span>
          <strong>{me.username}</strong>
          <RoleBadge role={role} />
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {checked.length > 0 ? (
              <span className={conform.length === checked.length ? "verdict-ok" : "verdict-bad"}>
                {conform.length} / {checked.length} conformes
              </span>
            ) : (
              <span className="muted">Aucun test exécuté</span>
            )}
          </span>
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
          Astuce : reconnecte-toi avec un autre rôle (patient2, doctor1, secretary1, admin1) et relance les tests pour voir
          les réponses changer.
        </p>
      </Card>

      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scénario</th>
                <th>Requête</th>
                <th>Attendu</th>
                <th>Obtenu</th>
                <th>Verdict</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((sc) => {
                const exp = sc.expect(ctx);
                const res = results[sc.id];
                let verdict = <span className="muted">—</span>;
                if (res) {
                  if (exp === null) verdict = <span className="verdict-info">Observé</span>;
                  else if (res.status === exp)
                    verdict = (
                      <span className="verdict-ok">
                        <Icon name="check" size={14} /> Conforme
                      </span>
                    );
                  else
                    verdict = (
                      <span className="verdict-bad">
                        <Icon name="x" size={14} /> Écart
                      </span>
                    );
                }
                return (
                  <tr key={sc.id} className="lab-row">
                    <td>
                      <div className="lab-title">{sc.title}</div>
                      <div className="lab-why">{sc.why}</div>
                    </td>
                    <td className="mono">
                      {sc.method} {sc.path}
                    </td>
                    <td>{exp === null ? <span className="muted">—</span> : <span className={codeClass(exp)}>{exp}</span>}</td>
                    <td>
                      {res ? (
                        <span title={HTTP_LABELS[res.status] || ""}>
                          <span className={codeClass(res.status)}>{res.status}</span>{" "}
                          <span className="muted" style={{ fontSize: 12 }}>
                            {res.ms} ms
                          </span>
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{verdict}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn small ghost" onClick={() => runOne(sc)} disabled={running}>
                        <Icon name="play" size={12} /> Lancer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
