import { useApi } from "../useApi.js";
import { Async, Icon } from "../ui.jsx";

/** Ouvre un dossier médical par son numéro. Le contrôle d'accès est fait par l'API (anti-IDOR). */
export default function RecordViewer({ id }) {
  const res = useApi(id ? `/api/records/${id}` : null);
  if (!id) return null;

  return (
    <div className="record-viewer">
      <Async
        res={res}
        deniedText="Tu as le bon rôle, mais ce dossier n'est pas celui d'un patient dont tu as la charge : l'API applique un contrôle d'accès par objet (anti-IDOR)."
      >
        {(r) => (
          <article className="record">
            <div className="record-head">
              <span className="record-icon">
                <Icon name="file" size={20} />
              </span>
              <div>
                <h3>Dossier médical n° {r.id}</h3>
                <p className="muted">
                  Patient : <strong>{r.patient}</strong> · Médecin : <strong>{r.doctor}</strong>
                </p>
              </div>
            </div>
            <dl className="record-body">
              <dt>Diagnostic</dt>
              <dd>{r.diagnosis}</dd>
              <dt>Notes</dt>
              <dd>{r.notes}</dd>
            </dl>
          </article>
        )}
      </Async>
    </div>
  );
}
