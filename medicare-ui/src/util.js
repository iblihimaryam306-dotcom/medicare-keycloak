export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatIso(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function initials(name) {
  return (
    String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

export const HTTP_LABELS = {
  0: "API injoignable",
  200: "OK",
  401: "Non authentifié",
  403: "Interdit",
  404: "Introuvable",
};

// --- Outils base64url (pour la démonstration de falsification de jeton) ---
function b64uDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function b64uEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Modifie le contenu du jeton (rôle ADMIN) en gardant la signature d'origine. */
export function forgeToken(token) {
  const [header, payload, signature] = token.split(".");
  const data = JSON.parse(b64uDecode(payload));
  data.resource_access = { "medicare-api": { roles: ["ADMIN"] } };
  return [header, b64uEncode(JSON.stringify(data)), signature].join(".");
}
