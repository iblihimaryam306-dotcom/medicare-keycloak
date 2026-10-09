export const ROLE_INFO = {
  PATIENT: {
    label: "Patient",
    tagline: "Accès à ses propres rendez-vous et dossiers",
    can: ["Voir ses rendez-vous", "Lire ses propres dossiers médicaux"],
    cannot: [
      "Lire le dossier d'un autre patient (anti-IDOR)",
      "Confirmer un rendez-vous",
      "Consulter le journal d'audit",
    ],
  },
  DOCTOR: {
    label: "Médecin",
    tagline: "Accès aux dossiers de ses patients, avec double authentification",
    can: [
      "Voir son agenda",
      "Lister les patients dont il a la charge",
      "Lire le dossier d'un patient en relation de soin",
    ],
    cannot: [
      "Lire le dossier d'un patient suivi par un autre médecin",
      "Confirmer un rendez-vous",
      "Consulter le journal d'audit",
    ],
  },
  SECRETARY: {
    label: "Secrétaire",
    tagline: "Gestion des rendez-vous, sans accès au contenu médical",
    can: ["Voir tous les rendez-vous", "Confirmer un rendez-vous"],
    cannot: ["Ouvrir un dossier médical (séparation des tâches)", "Consulter le journal d'audit"],
  },
  ADMIN: {
    label: "Administrateur",
    tagline: "Supervision et audit, sans accès au contenu médical",
    can: ["Consulter le journal d'audit (autorisé / refusé)"],
    cannot: ["Voir les rendez-vous", "Ouvrir un dossier médical (séparation des tâches)"],
  },
};

export const SECURITY_FEATURES = [
  {
    icon: "key",
    title: "Authorization Code + PKCE",
    text: "Aucun mot de passe ne transite par l'application : la connexion se fait chez Keycloak, protégée par un défi PKCE (S256).",
  },
  {
    icon: "shield",
    title: "Jeton signé et vérifié",
    text: "Chaque appel porte un JWT signé RS256. L'API vérifie signature, émetteur, expiration et audience.",
  },
  {
    icon: "users",
    title: "Contrôle par rôle (RBAC)",
    text: "Quatre rôles, des zones d'API distinctes : un mauvais rôle reçoit un 403 avant même d'atteindre les données.",
  },
  {
    icon: "file",
    title: "Contrôle par objet (anti-IDOR)",
    text: "Avoir le bon rôle ne suffit pas : un patient ne lit que son dossier, un médecin que ceux de ses patients.",
  },
  {
    icon: "lock",
    title: "MFA obligatoire pour les médecins",
    text: "Un code à usage unique (TOTP) est exigé uniquement pour le rôle DOCTOR, via un flux d'authentification conditionnel.",
  },
  {
    icon: "clipboard",
    title: "Journal d'audit",
    text: "Chaque décision d'accès, autorisée ou refusée, est enregistrée et consultable par l'administrateur.",
  },
];

export const DEMO_ACCOUNTS = [
  { user: "patient1", role: "PATIENT", note: "" },
  { user: "patient2", role: "PATIENT", note: "" },
  { user: "doctor1", role: "DOCTOR", note: "+ code TOTP" },
  { user: "doctor2", role: "DOCTOR", note: "+ code TOTP" },
  { user: "secretary1", role: "SECRETARY", note: "" },
  { user: "admin1", role: "ADMIN", note: "" },
];
