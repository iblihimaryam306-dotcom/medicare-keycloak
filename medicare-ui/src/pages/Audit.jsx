import { useMemo, useState } from "react";
import { useApi } from "../useApi.js";
import { Async, Card, Icon, OutcomeBadge, PageHeader, RoleBadge, Stat } from "../ui.jsx";
import { formatIso } from "../util.js";

export default function Audit() {
  const res = useApi("/api/admin/audit");
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const list = Array.isArray(res.data) ? [...res.data].reverse() : [];
    return list.filter((e) => {
      const denied = String(e.outcome).startsWith("DENIED");
      if (filter === "ALLOWED" && denied) return false;
      if (filter === "DENIED" && !denied) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return [e.actor, e.action, e.resource, e.outcome].some((x) => String(x).toLowerCase().includes(q));
    });
  }, [res.data, filter, query]);

  const all = Array.isArray(res.data) ? res.data : [];
  const denied = all.filter((e) => String(e.outcome).startsWith("DENIED")).length;

  return (
    <>
      <PageHeader
        title="Journal d'audit"
        subtitle="Chaque décision d'accès est enregistrée. L'administrateur voit qui a été autorisé ou refusé, sans accéder aux dossiers médicaux."
        actions={
          <button className="btn ghost small" onClick={res.reload}>
            <Icon name="refresh" size={15} /> Actualiser
          </button>
        }
      />

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <Stat label="Événements" value={res.ok ? all.length : "—"} icon="clipboard" />
        <Stat label="Autorisés" value={res.ok ? all.length - denied : "—"} icon="check" tone="blue" />
        <Stat label="Refusés" value={res.ok ? denied : "—"} icon="x" tone="red" />
      </div>

      <Card>
        <div className="filters">
          {[
            ["ALL", "Tous"],
            ["ALLOWED", "Autorisés"],
            ["DENIED", "Refusés"],
          ].map(([k, label]) => (
            <button key={k} className={"pill" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
          <input
            className="input"
            style={{ marginLeft: "auto", minWidth: 200 }}
            placeholder="Rechercher (acteur, action…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher dans le journal"
          />
        </div>
        <Async res={res} emptyText="Le journal est vide.">
          {() =>
            rows.length === 0 ? (
              <div className="empty">Aucun événement ne correspond au filtre.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Heure</th>
                      <th>Acteur</th>
                      <th>Rôle</th>
                      <th>Action</th>
                      <th>Ressource</th>
                      <th>Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e, i) => (
                      <tr key={e.time + i}>
                        <td className="mono">{formatIso(e.time)}</td>
                        <td>{e.actor}</td>
                        <td>
                          <RoleBadge role={e.role} />
                        </td>
                        <td className="mono">{e.action}</td>
                        <td className="mono">{e.resource}</td>
                        <td>
                          <OutcomeBadge outcome={e.outcome} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Async>
      </Card>
    </>
  );
}
