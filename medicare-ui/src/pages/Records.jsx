import { useState } from "react";
import { useApi } from "../useApi.js";
import RecordViewer from "../components/RecordViewer.jsx";
import { Async, Card, Icon, PageHeader } from "../ui.jsx";

export default function Records() {
  const res = useApi("/api/patients/me/records");
  const [openId, setOpenId] = useState(null);

  return (
    <>
      <PageHeader title="Mes dossiers" subtitle="Tes dossiers médicaux. Un autre patient ne peut pas les lire (contrôle par objet)." />
      <div className="grid cols-2">
        <Card title="Liste" icon="file">
          <Async res={res} emptyText="Aucun dossier médical.">
            {(rows) => (
              <div className="record-list">
                {rows.map((r) => (
                  <div className="record-row" key={r.id}>
                    <div>
                      <strong>Dossier n° {r.id}</strong>
                      <div className="muted">
                        {r.doctor} · {r.diagnosis}
                      </div>
                    </div>
                    <button className="btn small ghost" onClick={() => setOpenId(r.id)}>
                      Ouvrir <Icon name="arrow" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Async>
        </Card>
        <Card title="Détail" icon="clipboard">
          {openId ? <RecordViewer id={openId} /> : <div className="empty">Choisis un dossier dans la liste.</div>}
        </Card>
      </div>
    </>
  );
}
