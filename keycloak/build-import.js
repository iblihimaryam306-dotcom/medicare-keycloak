// Fabrique keycloak/realm-medicare.json a partir de l'export partiel (realm-export.json)
// en y ajoutant les 6 comptes de demonstration, avec leurs identifiants (sub) FIXES.
//
// Pourquoi des identifiants fixes : l'API relie les donnees metier (relations de soin,
// rendez-vous, dossiers) au "sub" du jeton. Des comptes recrees avec d'autres identifiants
// verraient des listes vides.
//
// Usage (depuis la racine du projet) :  node keycloak\build-import.js
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "realm-export.json");
const OUT = path.join(__dirname, "realm-medicare.json");

// Comptes de DEMONSTRATION : mot de passe = nom d'utilisateur. Local uniquement.
const USERS = [
  { id: "fd1eeb9e-4f6b-481b-8f2f-9a285c6a7dab", username: "patient1", firstName: "Amine", lastName: "Benali", group: "PATIENTS" },
  { id: "133b2c02-1caa-43d9-ae1d-0d18592c5256", username: "patient2", firstName: "Salma", lastName: "Idrissi", group: "PATIENTS" },
  { id: "3116b0f0-8025-4287-afc7-eb1be07b146d", username: "doctor1", firstName: "Youssef", lastName: "Alaoui", group: "DOCTORS" },
  { id: "bf376d63-27b9-4e34-8423-ce4793adc926", username: "doctor2", firstName: "Nadia", lastName: "Tazi", group: "DOCTORS" },
  { id: "faf2d0f2-6e38-4833-b500-5b084e9baa77", username: "secretary1", firstName: "Hanane", lastName: "Chraibi", group: "SECRETARIES" },
  { id: "f8be320a-4e68-409c-8ab8-b17f993a2aab", username: "admin1", firstName: "Karim", lastName: "Fassi", group: "ADMINS" },
];

function fail(msg) {
  console.log("ERREUR : " + msg);
  process.exit(1);
}

if (!fs.existsSync(SRC)) fail("fichier introuvable : keycloak/realm-export.json");
const realm = JSON.parse(fs.readFileSync(SRC, "utf8"));

if (realm.realm !== "medicare") fail("le realm exporte s'appelle '" + realm.realm + "', attendu 'medicare'");
if (!(realm.clients || []).some((c) => c.clientId === "medicare-ui")) fail("client medicare-ui absent de l'export");
if (!realm.browserFlow || !String(realm.browserFlow).includes("doctor-mfa")) fail("le flux MFA n'est pas lie au navigateur");

const groups = new Set((realm.groups || []).map((g) => g.name));
for (const g of ["PATIENTS", "DOCTORS", "SECRETARIES", "ADMINS"]) {
  if (!groups.has(g)) fail("groupe absent de l'export : " + g + " (active 'Include groups and roles')");
}

if (Array.isArray(realm.users) && realm.users.length > 0) {
  console.log("Remarque : l'export contenait deja des comptes ; ils sont remplaces (jamais d'identifiants exportes dans Git).");
}

realm.users = USERS.map((u) => ({
  id: u.id,
  username: u.username,
  enabled: true,
  emailVerified: true,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.username + "@medicare.test",
  groups: ["/" + u.group],
  credentials: [{ type: "password", value: u.username, temporary: false }],
}));

fs.writeFileSync(OUT, JSON.stringify(realm, null, 2));
console.log("Ecrit : keycloak/realm-medicare.json (" + realm.users.length + " comptes, " + (realm.clients || []).length + " clients)");