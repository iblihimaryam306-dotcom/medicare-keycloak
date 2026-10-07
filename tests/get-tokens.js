const fs = require("fs");
const path = require("path");

const BASE = process.env.KEYCLOAK_BASE || "http://localhost:8080";
const TOKEN_URL = BASE + "/realms/medicare/protocol/openid-connect/token";
const USERS = ["patient1", "patient2", "doctor1", "doctor2", "secretary1", "admin1"];

(async () => {
  const tokens = {};
  let failures = 0;
  for (const user of USERS) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "medicare-test",
        username: user,
        password: user,
        scope: "openid",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      failures++;
      console.log("FAIL  " + user.padEnd(11) + " " + data.error + " : " + data.error_description);
      continue;
    }
    tokens[user] = data.access_token;
    console.log("OK    " + user.padEnd(11) + " token obtenu (valable " + data.expires_in + " s)");
  }
  fs.writeFileSync(path.join(__dirname, "tokens.json.local"), JSON.stringify(tokens, null, 2));
  console.log(failures === 0
    ? "\nTokens ecrits dans tests/tokens.json.local (ignore par Git)."
    : "\n" + failures + " compte(s) en echec : verifie le client medicare-test et les mots de passe.");
  process.exitCode = failures === 0 ? 0 : 1;
})();