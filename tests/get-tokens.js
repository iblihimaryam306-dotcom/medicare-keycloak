const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = process.env.KEYCLOAK_BASE || "http://localhost:8080";
const TOKEN_URL = BASE + "/realms/medicare/protocol/openid-connect/token";
const USERS = ["patient1", "patient2", "doctor1", "doctor2", "secretary1", "admin1"];
const SECRETS_FILE = path.join(__dirname, "otp-secrets.json.local");

// Secrets OTP des comptes qui ont le MFA (fichier ignore par Git)
const secrets = fs.existsSync(SECRETS_FILE)
  ? JSON.parse(fs.readFileSync(SECRETS_FILE, "utf8"))
  : {};

function base32Decode(s) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = s.replace(/[\s=]/g, "").toUpperCase();
  let bits = "";
  for (const c of clean) {
    const v = alphabet.indexOf(c);
    if (v === -1) throw new Error("caractere base32 invalide : " + c);
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// TOTP RFC 6238 : SHA-1, 6 chiffres, pas de 30 s
function totp(secret) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 1000000).padStart(6, "0");
}

(async () => {
  const tokens = {};
  let failures = 0;
  for (const user of USERS) {
    const params = {
      grant_type: "password",
      client_id: "medicare-test",
      username: user,
      password: user,
      scope: "openid",
    };
    const hasOtp = Boolean(secrets[user]);
    if (hasOtp) params.totp = totp(secrets[user]);

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });
    const data = await res.json();
    if (!res.ok) {
      failures++;
      console.log("FAIL  " + user.padEnd(11) + " " + data.error + " : " + data.error_description);
      continue;
    }
    tokens[user] = data.access_token;
    console.log(
      "OK    " + user.padEnd(11) + " token obtenu (valable " + data.expires_in + " s)" +
        (hasOtp ? " + code TOTP" : "")
    );
  }
  fs.writeFileSync(path.join(__dirname, "tokens.json.local"), JSON.stringify(tokens, null, 2));
  console.log(
    failures === 0
      ? "\nTokens ecrits dans tests/tokens.json.local (ignore par Git)."
      : "\n" + failures + " compte(s) en echec : verifie le client medicare-test, les mots de passe et tests/otp-secrets.json.local."
  );
  process.exitCode = failures === 0 ? 0 : 1;
})();