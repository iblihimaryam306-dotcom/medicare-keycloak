const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [user, ...keyParts] = process.argv.slice(2);
const rawKey = keyParts.join("");
if (!user || !rawKey) {
  console.log("Usage : node tests\\otp-enroll.js <utilisateur> <cle base32>");
  process.exit(1);
}
const key = rawKey.replace(/\s/g, "").toUpperCase();

function base32Decode(s) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of s.replace(/=/g, "")) {
    const v = alphabet.indexOf(c);
    if (v === -1) {
      console.log("Cle invalide : caractere '" + c + "' non autorise en base32.");
      process.exit(1);
    }
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totp(secret) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 0x0f;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1000000).padStart(6, "0");
}

const code = totp(key);

const file = path.join(__dirname, "otp-secrets.json.local");
const secrets = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
secrets[user] = key;
fs.writeFileSync(file, JSON.stringify(secrets, null, 2));

const left = 30 - (Math.floor(Date.now() / 1000) % 30);
console.log("Cle enregistree pour " + user + " dans tests/otp-secrets.json.local");
console.log("Code actuel : " + code + "  (encore valable " + left + " s)");