import { Link, Navigate, Route, Routes } from "react-router-dom";
import { keycloak, getRole } from "./auth.js";
import Layout from "./components/Layout.jsx";
import { DeniedBox } from "./ui.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Appointments from "./pages/Appointments.jsx";
import Records from "./pages/Records.jsx";
import Patients from "./pages/Patients.jsx";
import Audit from "./pages/Audit.jsx";
import Token from "./pages/Token.jsx";
import Lab from "./pages/Lab.jsx";

function RequireAuth({ children }) {
  return keycloak.authenticated ? children : <Navigate to="/" replace />;
}

// Contrôle de confort côté interface : la vraie protection est dans l'API (SecurityConfig + contrôleurs).
function RequireRole({ roles, children }) {
  const role = getRole();
  if (roles.includes(role)) return children;
  return (
    <DeniedBox title="Page réservée à d'autres rôles">
      Ton rôle ({role}) n'a pas accès à cette page. Même en forçant l'adresse, l'API refuserait les données (403).{" "}
      <Link to="/app">Retour au tableau de bord</Link>
    </DeniedBox>
  );
}

function NotFound() {
  return (
    <div className="boot">
      <div className="card narrow">
        <h2 className="card-title">Page introuvable</h2>
        <p className="muted">Cette adresse n'existe pas.</p>
        <p style={{ marginTop: 14 }}>
          <Link to="/">Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  );
}

export default function App({ authError }) {
  return (
    <Routes>
      <Route path="/" element={keycloak.authenticated ? <Navigate to="/app" replace /> : <Home authError={authError} />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="appointments"
          element={
            <RequireRole roles={["PATIENT", "DOCTOR", "SECRETARY"]}>
              <Appointments />
            </RequireRole>
          }
        />
        <Route
          path="records"
          element={
            <RequireRole roles={["PATIENT"]}>
              <Records />
            </RequireRole>
          }
        />
        <Route
          path="patients"
          element={
            <RequireRole roles={["DOCTOR"]}>
              <Patients />
            </RequireRole>
          }
        />
        <Route
          path="audit"
          element={
            <RequireRole roles={["ADMIN"]}>
              <Audit />
            </RequireRole>
          }
        />
        <Route path="token" element={<Token />} />
        <Route path="lab" element={<Lab />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
