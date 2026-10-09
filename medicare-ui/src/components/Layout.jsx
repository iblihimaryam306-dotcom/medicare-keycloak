import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getIdentity, getRole, logout } from "../auth.js";
import { Icon, Logo, RoleBadge } from "../ui.jsx";
import { initials } from "../util.js";

const NAV = [
  { to: "/app", label: "Tableau de bord", icon: "home", roles: null, end: true },
  {
    to: "/app/appointments",
    label: { PATIENT: "Mes rendez-vous", DOCTOR: "Mon agenda", SECRETARY: "Tous les rendez-vous" },
    icon: "calendar",
    roles: ["PATIENT", "DOCTOR", "SECRETARY"],
  },
  { to: "/app/records", label: "Mes dossiers", icon: "file", roles: ["PATIENT"] },
  { to: "/app/patients", label: "Mes patients", icon: "users", roles: ["DOCTOR"] },
  { to: "/app/audit", label: "Journal d'audit", icon: "clipboard", roles: ["ADMIN"] },
  { to: "/app/token", label: "Mon jeton", icon: "key", roles: null },
  { to: "/app/lab", label: "Laboratoire de sécurité", icon: "flask", roles: null },
];

export default function Layout() {
  const role = getRole();
  const me = getIdentity();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  if (!role) {
    return (
      <div className="boot">
        <div className="card narrow">
          <h2 className="card-title">
            <Icon name="alert" /> Aucun rôle MediCare
          </h2>
          <p className="muted">
            Ton compte est authentifié mais ne porte aucun rôle du client <code>medicare-api</code>. L'API refusera toute
            requête. Vérifie le groupe de l'utilisateur dans Keycloak.
          </p>
          <button className="btn" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const items = NAV.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <div className="shell">
      <aside className={"sidebar" + (open ? " open" : "")}>
        <div className="brand">
          <Logo size={34} />
          <div>
            <div className="brand-name">MediCare</div>
            <div className="brand-sub">Portail sécurisé</div>
          </div>
        </div>

        <nav className="nav" aria-label="Navigation principale">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <Icon name={i.icon} />
              <span>{typeof i.label === "string" ? i.label : i.label[role]}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-card">
          <div className="avatar">{initials(me.name)}</div>
          <div className="user-meta">
            <div className="user-name">{me.name}</div>
            <RoleBadge role={role} />
          </div>
          <button className="icon-btn" onClick={logout} title="Se déconnecter" aria-label="Se déconnecter">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Icon name="menu" />
          </button>
          <div className="topbar-right">
            <span className="chip">
              <Icon name="shield" size={14} /> Session protégée · PKCE
            </span>
            <RoleBadge role={role} />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
        <footer className="foot">Projet pédagogique de cybersécurité · toutes les données sont fictives</footer>
      </div>
    </div>
  );
}
