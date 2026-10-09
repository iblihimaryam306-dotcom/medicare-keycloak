export const KEYCLOAK = {
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: "medicare",
  clientId: "medicare-ui",
};

// Le client Keycloak qui porte les rôles (PATIENT, DOCTOR, SECRETARY, ADMIN)
export const API_CLIENT = "medicare-api";

// Ordre de priorité si un compte porte plusieurs rôles
export const ROLE_PRIORITY = ["ADMIN", "DOCTOR", "SECRETARY", "PATIENT"];
