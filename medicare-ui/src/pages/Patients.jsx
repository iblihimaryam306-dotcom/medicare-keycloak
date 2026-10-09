import { useState } from "react";
import { useApi } from "../useApi.js";
import RecordViewer from "../components/RecordViewer.jsx";
import { Async, Card, Icon, PageHeader } from "../ui.jsx";
import { initials } from "../util.js";

export default function Patients() {
  const res = useApi("/api/doctors/me/patients");
  const [input, setInput] = useState("");
  const [openId, setOpenId] = useState(null);

  function open(e) {
    e.preventDefault();
    const n = parseInt(input, 10);
    setOpenId(Number.isFinite(n) && n > 0 ? n : null);
  }

  return (
    <>
      <PageHeader
        title="Mes patients"
        subtitle="Seuls les patients dont tu as la charge apparaissent. Le dossier d'un autre patient est refusé par l'API."
      />
      <div className="grid cols-2">
        <Card title="Patients suivis" icon="users">
          <Async res={res} emptyText="Aucun patient suivi.">
            {(rows) => (
              <div className="record-list">
                {rows.map((p) => (
                  <div className="record-row" key={p.username}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div className="avatar">{initials(p.name)}</div>
                      <div>
                        <strong>{p.name}</strong>
                        <div className="muted mono">{p.username}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Async>
        </Card>

        <Card title="Ouvrir un dossier médical" icon="file">
          <form className="lookup" onSubmit={open}>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="Numéro du dossier"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Numéro du dossier"
            />
            <button className="btn" type="submit">
              Ouvrir <Icon name="arrow" size={14} />
            </button>
          </form>
          <p className="muted" style={{ marginBottom: 14, fontSize: 13.5 }}>
            Essaie le numéro d'un patient qui n'est pas le tien : tu as le bon rôle, mais l'API répond 403.
          </p>
          <RecordViewer id={openId} />
        </Card>
      </div>
    </>
  );
}
