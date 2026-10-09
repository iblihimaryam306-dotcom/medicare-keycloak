import { useState } from "react";
import { api } from "../api.js";
import { getRole } from "../auth.js";
import { useApi } from "../useApi.js";
import { Async, Card, Icon, PageHeader, StatusBadge } from "../ui.jsx";
import { formatDateTime } from "../util.js";

const TITLES = {
  PATIENT: ["Mes rendez-vous", "Seuls tes propres rendez-vous sont renvoyés par l'API."],
  DOCTOR: ["Mon agenda", "Seuls les rendez-vous de tes patients sont renvoyés par l'API."],
  SECRETARY: ["Tous les rendez-vous", "La secrétaire gère les rendez-vous mais ne voit jamais le contenu médical."],
};

export default function Appointments() {
  const role = getRole();
  const res = useApi("/api/appointments");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [title, subtitle] = TITLES[role] || ["Rendez-vous", ""];

  async function confirm(id) {
    setBusy(id);
    setNotice(null);
    const r = await api(`/api/appointments/${id}/confirm`, { method: "PUT" });
    setBusy(null);
    if (r.ok) {
      setNotice({ ok: true, text: `Rendez-vous n° ${id} confirmé.` });
      res.reload();
    } else {
      setNotice({ ok: false, text: `Confirmation refusée par l'API (${r.status}).` });
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <button className="btn ghost small" onClick={res.reload}>
            <Icon name="refresh" size={15} /> Actualiser
          </button>
        }
      />
      {notice && (
        <div className={"notice " + (notice.ok ? "ok" : "bad")}>
          <Icon name={notice.ok ? "check" : "x"} size={16} /> {notice.text}
        </div>
      )}
      <Card>
        <Async res={res} emptyText="Aucun rendez-vous pour le moment.">
          {(rows) => (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Médecin</th>
                    <th>Statut</th>
                    {role === "SECRETARY" && <th />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td className="mono">#{a.id}</td>
                      <td>{formatDateTime(a.dateTime)}</td>
                      <td>{a.patient}</td>
                      <td>{a.doctor}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      {role === "SECRETARY" && (
                        <td style={{ textAlign: "right" }}>
                          {a.status === "PENDING" && (
                            <button className="btn small" disabled={busy === a.id} onClick={() => confirm(a.id)}>
                              <Icon name="check" size={14} /> Confirmer
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Async>
      </Card>
    </>
  );
}
