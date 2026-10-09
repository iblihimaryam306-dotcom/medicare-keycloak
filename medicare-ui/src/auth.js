import Keycloak from "keycloak-js";
import { KEYCLOAK, API_CLIENT, ROLE_PRIORITY } from "./config.js";

export const keycloak = new Keycloak(KEYCLOAK);

// Indice non sensible : « cet onglet a déjà ouvert une session ».
// Il permet de retrouver la session après un rechargement sans écran de connexion,
// puisque le jeton lui-même n'est JAMAIS stocké (ni localStorage, ni sessionStorage).
const HINT = "medicare.sso";

export async function initAuth() {
  const hadSession = sessionStorage.getItem(HINT) === "1";
  try {
    const authenticated = await keycloak.init({
      onLoad: hadSession ? "check-sso" : undefined,
      pkceMethod: "S256", // Authorization Code + PKCE (S256)
      checkLoginIframe: false,
    });
    if (authenticated) sessionStorage.setItem(HINT, "1");
    else sessionStorage.removeItem(HINT);

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.login());
    };
    return { authenticated, error: null };
  } catch (error) {
    return { authenticated: false, error };
  }
}

export function login() {
  sessionStorage.setItem(HINT, "1");
  return keycloak.login({ redirectUri: window.location.origin + "/app" });
}

export function logout() {
  sessionStorage.removeItem(HINT);
  return keycloak.logout({ redirectUri: window.location.origin + "/" });
}

export function getRoles() {
  return keycloak.tokenParsed?.resource_access?.[API_CLIENT]?.roles ?? [];
}

export function getRole() {
  const roles = getRoles();
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
}

export function getIdentity() {
  const t = keycloak.tokenParsed || {};
  const username = t.preferred_username || "";
  return {
    username,
    name: t.name || username,
    email: t.email || "",
    sub: t.sub || "",
  };
}
