import { keycloak, login } from "./auth.js";

/**
 * Appelle l'API MediCare et renvoie { status, ok, data } sans jamais lever
 * d'exception sur un code HTTP : les 401 / 403 / 404 sont des réponses normales
 * que l'interface affiche (et que le laboratoire de sécurité compare aux attentes).
 *
 * options.anonymous : n'envoie aucun jeton
 * options.bearer    : envoie ce jeton à la place du vrai (démonstration de falsification)
 */
export async function api(path, { method = "GET", anonymous = false, bearer } = {}) {
  const headers = { Accept: "application/json" };

  if (!anonymous) {
    let token = bearer;
    if (!token) {
      try {
        await keycloak.updateToken(20); // renouvelle si le jeton expire dans < 20 s
      } catch {
        await login();
        return { status: 401, ok: false, data: null };
      }
      token = keycloak.token;
    }
    headers.Authorization = "Bearer " + token;
  }

  try {
    const res = await fetch(path, { method, headers });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  } catch {
    return { status: 0, ok: false, data: null };
  }
}
