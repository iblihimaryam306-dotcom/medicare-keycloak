const fs = require("fs");
const path = require("path");

const BASE = process.env.API_BASE || "http://localhost:9080";
const file = path.join(__dirname, "tokens.json.local");
if (!fs.existsSync(file)) {
  console.error("tests/tokens.json.local introuvable : lance d'abord node tests/get-tokens.js");
  process.exit(1);
}
const tokens = JSON.parse(fs.readFileSync(file, "utf8"));

const ids = (arr) => JSON.stringify(arr.map((x) => x.id));
const scenarios = [
  { who: null, method: "GET", path: "/api/records/1", expect: 401, label: "sans token" },
  { who: "patient1", method: "GET", path: "/api/appointments", expect: 200, check: (b) => ids(b) === "[1,3]", note: "voit ses RDV (1,3)" },
  { who: "patient2", method: "GET", path: "/api/appointments", expect: 200, check: (b) => ids(b) === "[2]", note: "voit ses RDV (2)" },
  { who: "doctor1", method: "GET", path: "/api/appointments", expect: 200, check: (b) => ids(b) === "[1,3]", note: "voit son agenda (1,3)" },
  { who: "doctor2", method: "GET", path: "/api/appointments", expect: 200, check: (b) => ids(b) === "[2]", note: "voit son agenda (2)" },
  { who: "secretary1", method: "GET", path: "/api/appointments", expect: 200, check: (b) => ids(b) === "[1,2,3]", note: "voit tous les RDV" },
  { who: "admin1", method: "GET", path: "/api/appointments", expect: 403, label: "admin refuse" },
  { who: "patient1", method: "PUT", path: "/api/appointments/1/confirm", expect: 403, label: "patient ne confirme pas" },
  { who: "doctor1", method: "PUT", path: "/api/appointments/1/confirm", expect: 403, label: "medecin ne confirme pas" },
  { who: "secretary1", method: "PUT", path: "/api/appointments/2/confirm", expect: 200, check: (b) => b.status === "CONFIRMED", note: "confirme le RDV 2" },
  { who: "secretary1", method: "PUT", path: "/api/appointments/999/confirm", expect: 404, label: "RDV inexistant" },
  { who: "patient1", method: "GET", path: "/api/records/1", expect: 200, label: "patient lit SON dossier" },
  { who: "patient2", method: "GET", path: "/api/records/1", expect: 403, label: "IDOR : patient2 sur le dossier de patient1" },
  { who: "patient2", method: "GET", path: "/api/records/2", expect: 200, label: "patient2 lit SON dossier" },
  { who: "doctor1", method: "GET", path: "/api/records/1", expect: 200, label: "medecin lit le dossier de SON patient" },
  { who: "doctor1", method: "GET", path: "/api/records/2", expect: 403, label: "medecin sans relation de soin" },
  { who: "doctor2", method: "GET", path: "/api/records/2", expect: 200, label: "doctor2 lit le dossier de son patient" },
  { who: "doctor2", method: "GET", path: "/api/records/1", expect: 403, label: "doctor2 sans relation de soin" },
  { who: "secretary1", method: "GET", path: "/api/records/1", expect: 403, label: "secretaire sans acces au medical" },
  { who: "admin1", method: "GET", path: "/api/records/1", expect: 403, label: "admin sans acces au medical" },
  { who: "patient1", method: "GET", path: "/api/records/999", expect: 404, label: "dossier inexistant" },
  { who: "patient1", method: "GET", path: "/api/patients/me/records", expect: 200, check: (b) => ids(b) === "[1]", note: "liste ses dossiers (1)" },
  { who: "doctor1", method: "GET", path: "/api/patients/me/records", expect: 403, label: "route reservee aux patients" },
  { who: "doctor1", method: "GET", path: "/api/doctors/me/patients", expect: 200, check: (b) => JSON.stringify(b.map((p) => p.username)) === '["patient1"]', note: "ses patients : patient1" },
  { who: "patient1", method: "GET", path: "/api/doctors/me/patients", expect: 403, label: "route reservee aux medecins" },
  { who: "patient1", method: "GET", path: "/api/admin/audit", expect: 403, label: "audit refuse a un patient" },
  { who: "admin1", method: "GET", path: "/api/admin/audit", expect: 200,
    check: (b) => b.some((e) => e.outcome.startsWith("DENIED") && e.resource === "record/1"),
    note: "audit contient les refus (DENIED)" },
];

(async () => {
  let failures = 0;
  for (const s of scenarios) {
    const headers = s.who ? { Authorization: "Bearer " + tokens[s.who] } : {};
    const res = await fetch(BASE + s.path, { method: s.method, headers });
    let body = null;
    if (res.status === 200) { try { body = await res.json(); } catch (e) { body = null; } } else { await res.text(); }

    let ok = res.status === s.expect;
    let detail = "";
    if (ok && s.check) { ok = body !== null && s.check(body); detail = ok ? "" : "  <- contenu inattendu"; }
    if (!ok) failures++;
    const who = (s.who || "(anonyme)").padEnd(11);
    const what = (s.method + " " + s.path).padEnd(36);
    console.log((ok ? "PASS" : "FAIL") + "  " + who + what + " obtenu " + res.status + " | attendu " + s.expect + "  " + (s.label || s.note || "") + detail);
    if (res.status === 401 && s.expect !== 401) {
      console.log("      token expire : relance node tests/get-tokens.js puis recommence.");
      process.exitCode = 1; return;
    }
  }
  console.log(failures === 0 ? "\nTOUS LES TESTS PASSENT (" + scenarios.length + ")" : "\n" + failures + " TEST(S) EN ECHEC sur " + scenarios.length);
  process.exitCode = failures === 0 ? 0 : 1;
})();