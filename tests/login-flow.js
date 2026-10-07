const crypto = require("crypto");
const http = require("http");

const KC = process.env.KEYCLOAK_BASE || "http://localhost:8080";
const PORT = Number(process.env.PORT || 3000);
const REALM_URL = KC + "/realms/medicare/protocol/openid-connect";
const REDIRECT_URI = "http://localhost:" + PORT + "/";

const b64url = (buf) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (jwt) => {
  const [h, p] = jwt.split(".");
  const parse = (s) => JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  return { header: parse(h), payload: parse(p) };
};

const verifier = b64url(crypto.randomBytes(32));
const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
const state = b64url(crypto.randomBytes(8));

const loginUrl = REALM_URL + "/auth?" + new URLSearchParams({
  client_id: "medicare-ui",
  response_type: "code",
  redirect_uri: REDIRECT_URI,
  scope: "openid profile email",
  state: state,
  code_challenge: challenge,
  code_challenge_method: "S256",
}).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/") { res.writeHead(404); res.end(); return; }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (error) {
    console.error("\nKeycloak a renvoye une erreur :", error, url.searchParams.get("error_description"));
    res.end("Erreur : " + error); finish(1); return;
  }
  if (!code) { res.end("En attente du code..."); return; }
  if (returnedState !== state) {
    console.error("\nREFUS : le state recu ne correspond pas a celui envoye (protection CSRF).");
    res.end("State invalide"); finish(1); return;
  }
  console.log("\nRedirection recue. state verifie : OK. Echange du code en cours...");

  const tokenRes = await fetch(REALM_URL + "/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "medicare-ui",
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  const data = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("Echec (" + tokenRes.status + ") :", data);
    res.end("Echec de l'echange, voir le terminal."); finish(1); return;
  }

  console.log("Champs recus :", Object.keys(data).join(", "));
  console.log("Duree de vie de l'access token (s) :", data.expires_in);
  for (const name of ["access_token", "id_token"]) {
    if (data[name]) {
      const { header, payload } = decode(data[name]);
      console.log("\n=== " + name + " : header ===\n" + JSON.stringify(header, null, 2));
      console.log("=== " + name + " : payload ===\n" + JSON.stringify(payload, null, 2));
    }
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end("<h1>Connexion reussie</h1><p>Retourne dans le terminal pour lire les tokens. Tu peux fermer cet onglet.</p>");
  finish(0);
});

function finish(codeExit) { setTimeout(() => { server.close(); process.exit(codeExit); }, 200); }

server.on("error", (e) => {
  console.error("Impossible d'ecouter sur le port " + PORT + " :", e.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log("code_verifier :", verifier);
  console.log("code_challenge:", challenge);
  console.log("state         :", state);
  console.log("\nOuvre cette URL dans ton navigateur et connecte-toi (patient1 / patient1) :\n\n" + loginUrl);
  console.log("\nEn attente de la redirection sur " + REDIRECT_URI + " (5 minutes max)...");
});

setTimeout(() => { console.error("\nDelai depasse (5 minutes)."); process.exit(1); }, 5 * 60 * 1000);