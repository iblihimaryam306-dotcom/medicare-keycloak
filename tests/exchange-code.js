const [code, verifier] = process.argv.slice(2);
if (!code || !verifier) {
  console.error("Usage : node tests/exchange-code.js <code> <code_verifier>");
  process.exit(1);
}

const TOKEN_URL = "http://localhost:8080/realms/medicare/protocol/openid-connect/token";

const decode = (jwt) => {
  const [h, p] = jwt.split(".");
  const parse = (s) => JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  return { header: parse(h), payload: parse(p) };
};

(async () => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "medicare-ui",
    code: code,
    redirect_uri: "http://localhost:3000/",
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();

  if (!res.ok) {
    console.error("Echec (" + res.status + ") :", data);
    process.exit(1);
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
})();