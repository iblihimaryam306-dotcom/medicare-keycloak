import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { initAuth } from "./auth.js";
import "./styles.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <div className="boot">
    <div className="spinner" />
  </div>
);

initAuth().then(({ error }) => {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App authError={error ? String(error.message || error) : null} />
      </BrowserRouter>
    </React.StrictMode>
  );
});
