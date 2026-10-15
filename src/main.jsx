import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import SideRays from "./components/SideRays.jsx";
import StandalonePage from "./components/StandalonePage.jsx";
import "./styles.css";

// /r/<id> = página avulsa do estabelecimento (QR Code / link no Instagram),
// sem a marca e sem o app Bora Bar em volta.
const standaloneMatch = window.location.pathname.match(/^\/r\/([^/]+)\/?$/);

const root = createRoot(document.getElementById("root"));

if (standaloneMatch) {
  document.body.classList.add("is-standalone");
  root.render(
    <React.StrictMode>
      <StandalonePage barId={decodeURIComponent(standaloneMatch[1])} />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <SideRays
        rayColor1="#EAB308"
        rayColor2="#ffc100"
        origin="top-right"
        speed={2.5}
        intensity={2}
        spread={2.7}
        tilt={0}
        saturation={1.5}
        blend={0.75}
        falloff={1.6}
        opacity={1}
        className="bora-side-rays"
      />
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
}
