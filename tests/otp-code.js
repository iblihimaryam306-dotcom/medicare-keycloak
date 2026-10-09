const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const user = process.argv[2] || "doctor1";
const file = path.join(__dirname, "otp-secrets.json.local");

if (!fs.existsSync(file)) {
  console.log("Fichier introuvable : tests/otp-secrets.json.local");
  process.exit(1);
}
const key = JSON.parse(fs.readFileSync(file, "utf8"))[user];
if (!key) {
  console.log("Aucune cle enregistree pour " + user);
  process.exit(1);
}

function base32Decode(s) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of s.replace(/[\s=]/g, "").toUpperCase()) {
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

const counter = Math.floor(Date.now() / 1000 / 30);
const buf = Buffer.alloc(8);
buf.writeBigUInt64BE(BigInt(counter));
const h = crypto.createHmac("sha1", base32Decode(key)).update(buf).digest();
const o = h[h.length - 1] & 0x0f;
const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];

console.log(user + " : " + String(code % 1000000).padStart(6, "0") + "  (encore valable " + (30 - (Math.floor(Date.now() / 1000) % 30)) + " s)");