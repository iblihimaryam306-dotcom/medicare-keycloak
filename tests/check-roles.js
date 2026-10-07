const fs = require("fs");
const path = require("path");

const role = (process.argv[2] || "").toUpperCase();
const ROLES = ["PATIENT", "DOCTOR", "SECRETARY", "ADMIN"];
if (!ROLES.includes(role)) {
  console.error("Usage : node tests/check-roles.js " + ROLES.join(" | "));
  process.exit(1);
}

const BASE = process.env.API_BASE || "http://localhost:9080";
const headerFile = path.join(__dirname, "auth-header.local");
if (!fs.existsSync(headerFile)) {
  console.error("tests/auth-header.local introuvable : lance d'abord node tests/login-flow.js");
  process.exit(1);
}
const auth = fs.readFileSync(headerFile, "utf8").trim().replace(/^Authorization:\s*/i, "");

const call = async (url, withToken) => {
  const res = await fetch(BASE + url, { headers: withToken ? { Authorization: auth } : {} });
  return res;
};

(async () => {
  let failures = 0;
  const check = (label, got, expected) => {
    const ok = got === expected;
    if (!ok) failures++;
    console.log((ok ? "PASS" : "FAIL") + "  " + label.padEnd(46) + " obtenu " + got + " | attendu " + expected);
  };

  check("GET /api/health (public, sans token)", (await call("/api/health", false)).status, 200);
  check("GET /api/patient/ping SANS token", (await call("/api/patient/ping", false)).status, 401);

  const me = await call("/api/me", true);
  check("GET /api/me avec token", me.status, 200);
  if (me.status === 200) {
    const body = await me.json();
    console.log("      utilisateur : " + body.username + " | autorites : " + body.authorities.join(", "));
    check("autorite ROLE_" + role + " presente", body.authorities.includes("ROLE_" + role), true);
  } else {
        console.log("      token expire ou invalide : relance node tests/login-flow.js puis recommence.");
    process.exitCode = 1;
    return;
  }

  for (const zone of ROLES) {
    const expected = zone === role ? 200 : 403;
    const status = (await call("/api/" + zone.toLowerCase() + "/ping", true)).status;
    check("GET /api/" + zone.toLowerCase() + "/ping avec role " + role, status, expected);
  }

  console.log(failures === 0 ? "\nTOUS LES TESTS PASSENT" : "\n" + failures + " TEST(S) EN ECHEC");
  process.exitCode = failures === 0 ? 0 : 1;
})();