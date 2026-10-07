const crypto = require("crypto");

const b64url = (buf) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const verifier = b64url(crypto.randomBytes(32));
const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
const state = b64url(crypto.randomBytes(8));

const base = "http://localhost:8080/realms/medicare/protocol/openid-connect/auth";
const params = new URLSearchParams({
  client_id: "medicare-ui",
  response_type: "code",
  redirect_uri: "http://localhost:3000/",
  scope: "openid profile email",
  state: state,
  code_challenge: challenge,
  code_challenge_method: "S256",
});

console.log("code_verifier :", verifier);
console.log("code_challenge:", challenge);
console.log("state         :", state);
console.log("\nURL a ouvrir dans le navigateur :\n" + base + "?" + params.toString());