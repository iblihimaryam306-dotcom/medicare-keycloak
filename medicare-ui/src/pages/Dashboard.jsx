import { Link } from "react-router-dom";
import { getIdentity, getRole } from "../auth.js";
import { ROLE_INFO } from "../roles.js";
import { useApi } from "../useApi.js";
import { Card, Icon, PageHeader, RoleBadge, Stat } from "../ui.jsx";

const PATH_1 = {
  PATIENT: "/api/appointments",
  DOCTOR: "/api/appointments",
  SECRETARY: "/api/appointments",
  ADMIN: "/api/admin/audit",
};
const PATH_2 = { PATIENT: "/api/patients/me/records", DOCTOR: "/api/doctors/me/patients" };

const SHORTCUTS = {
  PATIENT: [
    { to: "/app/appointments", label: "Voir mes rendez-vous", icon: "calendar" },
    { to: "/app/records", label: "Ouvrir mes dossiers", icon: "file" },
  ],
  DOCTOR: [
    { to: "/app/appointments", label: "Consulter mon agenda", icon: "calendar" },
    { to: "/app/patients", label: "Mes patients et dossiers", icon: "users" },
  ],
  SECRETARY: [{ to: "/app/appointments", label: "Gérer les rendez-vous", icon: "calendar" }],
  ADMIN: [{ to: "/app/audit", label: "Ouvrir le journal d'audit", icon: "clipboard" }],
};

function count(list, fn) {
  return Array.isArray(list) ? list.filter(fn).length : 0;
}

export default function Dashboard() {
  const role = getRole();
  const me = getIdentity();
  const info = ROLE_INFO[role];
  const r1 = useApi(PATH_1[role] ?? null);
  const r2 = useApi(PATH_2[role] ?? null);
  const l1 = r1.data;
  const l2 = r2.data;
  const v = (r, n) => (r.loading ? "…" : r.ok ? n : "—");

  let stats = [];
  if (role === "PATIENT")
    stats = [
      { label: "Rendez-vous", value: v(r1, count(l1, () => true)), icon: "calendar" },
      { label: "Confirmés", value: v(r1, count(l1, (a) => a.status === "CONFIRMED")), icon: "check", tone: "blue" },
      { label: "Dossiers médicaux", value: v(r2, count(l2, () => true)), icon: "file", tone: "amber" },
    ];
  if (role === "DOCTOR")
    stats = [
      { label: "Rendez-vous", value: v(r1, count(l1, () => true)), icon: "calendar" },
      { label: "En attente", value: v(r1, count(l1, (a) => a.status === "PENDING")), icon: "alert", tone: "amber" },
      { label: "Patients suivis", value: v(r2, count(l2, () => true)), icon: "users", tone: "blue" },
    ];
  if (role === "SECRETARY")
    stats = [
      { label: "Rendez-vous", value: v(r1, count(l1, () => true)), icon: "calendar" },
      { label: "À confirmer", value: v(r1, count(l1, (a) => a.status === "PENDING")), icon: "alert", tone: "amber" },
      { label: "Confirmés", value: v(r1, count(l1, (a) => a.status === "CONFIRMED")), icon: "check", tone: "blue" },
    ];
  if (role === "ADMIN")
    stats = [
      { label: "Événements d'audit", value: v(r1, count(l1, () => true)), icon: "clipboard" },
      { label: "Autorisés", value: v(r1, count(l1, (e) => String(e.outcome).startsWith("ALLOWED"))), icon: "check", tone: "blue" },
      { label: "Refusés", value: v(r1, count(l1, (e) => String(e.outcome).startsWith("DENIED"))), icon: "x", tone: "red" },
    ];

  return (
    <>
      <PageHeader
        title={"Bonjour, " + me.name}
        subtitle={info?.tagline}
        actions={<RoleBadge role={role} />}
      />

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      <div className="grid cols-2">
        <Card title="Ce que ton rôle permet" icon="check">
          <ul className="checklist">
            {info?.can.map((t) => (
              <li key={t}>
                <span className="yes">
                  <Icon name="check" size={16} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <h2 className="card-title" style={{ marginTop: 20 }}>
            <Icon name="lock" size={18} /> Ce qui est refusé par l'API
          </h2>
          <ul className="checklist">
            {info?.cannot.map((t) => (
              <li key={t}>
                <span className="no">
                  <Icon name="x" size={16} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Accès rapide" icon="arrow">
          <div className="record-list">
            {(SHORTCUTS[role] || []).map((s) => (
              <Link key={s.to} to={s.to} className="record-row" style={{ textDecoration: "none", color: "inherit" }}>
                <span style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 600 }}>
                  <Icon name={s.icon} /> {s.label}
                </span>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
            <Link to="/app/lab" className="record-row" style={{ textDecoration: "none", color: "inherit" }}>
              <span style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 600 }}>
                <Icon name="flask" /> Tester la sécurité en direct
              </span>
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
