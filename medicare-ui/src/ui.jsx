import { login } from "./auth.js";

const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  flask: '<path d="M9 2h6M10 2v7.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V2"/><path d="M7 15h10"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  clipboard:
    '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  alert:
    '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  play: '<path d="m6 3 14 9-14 9z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
};

export function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }}
    />
  );
}

export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg)" />
      <path d="M26 14h12v12h12v12H38v12H26V38H14V26h12z" fill="#fff" />
    </svg>
  );
}

const ROLE_CLASS = {
  PATIENT: "role-patient",
  DOCTOR: "role-doctor",
  SECRETARY: "role-secretary",
  ADMIN: "role-admin",
};
const ROLE_LABEL = { PATIENT: "Patient", DOCTOR: "Médecin", SECRETARY: "Secrétaire", ADMIN: "Administrateur" };

export function RoleBadge({ role }) {
  if (!role) return null;
  return <span className={"badge " + (ROLE_CLASS[role] || "")}>{ROLE_LABEL[role] || role}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    PENDING: ["badge st-pending", "En attente"],
    CONFIRMED: ["badge st-ok", "Confirmé"],
  };
  const [cls, label] = map[status] || ["badge", status];
  return <span className={cls}>{label}</span>;
}

export function OutcomeBadge({ outcome }) {
  const denied = String(outcome).startsWith("DENIED");
  return (
    <span className={"badge " + (denied ? "st-denied" : "st-ok")}>
      <Icon name={denied ? "x" : "check"} size={12} /> {outcome}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, icon, children, className = "" }) {
  return (
    <section className={"card " + className}>
      {title && (
        <h2 className="card-title">
          {icon && <Icon name={icon} size={18} />} {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, icon, tone = "teal" }) {
  return (
    <div className={"stat tone-" + tone}>
      <div className="stat-icon">
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function DeniedBox({ title = "Accès refusé", children }) {
  return (
    <div className="denied" role="alert">
      <Icon name="lock" size={26} />
      <div>
        <h3>{title}</h3>
        <div className="denied-text">{children}</div>
      </div>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="skeleton-list" aria-busy="true">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton short" />
    </div>
  );
}

/** Affiche l'état d'une requête useApi : chargement, erreurs HTTP, vide, puis le contenu. */
export function Async({ res, children, emptyText = "Aucune donnée à afficher.", deniedText }) {
  if (res.loading) return <Skeleton />;
  if (res.status === 0)
    return <DeniedBox title="API injoignable">Vérifie que l'API Spring Boot tourne sur le port 9080.</DeniedBox>;
  if (res.status === 401)
    return (
      <DeniedBox title="Session expirée ou jeton refusé (401)">
        <button className="btn" onClick={login}>
          Se reconnecter
        </button>
      </DeniedBox>
    );
  if (res.status === 403)
    return (
      <DeniedBox title="Accès refusé par l'API (403)">
        {deniedText || "Ton rôle ou ton identité ne t'autorise pas à accéder à cette ressource."}
      </DeniedBox>
    );
  if (res.status === 404) return <DeniedBox title="Ressource introuvable (404)">Cet élément n'existe pas.</DeniedBox>;
  if (!res.ok) return <DeniedBox title={"Erreur " + res.status}>La requête a échoué.</DeniedBox>;
  if (Array.isArray(res.data) && res.data.length === 0) return <div className="empty">{emptyText}</div>;
  return children(res.data);
}
