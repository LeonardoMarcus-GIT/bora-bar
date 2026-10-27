import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import QrCodePage from "./pages/QrCodePage.jsx";
import StandalonePage from "./pages/StandalonePage.jsx";
import "./styles/index.css";

// /r/<id> = página avulsa do estabelecimento (QR Code / link no Instagram):
// mesmo visual da página do bar, sem o app Bora Bar em volta.
// /r/<id>/qr = cartão com QR Code para imprimir.
const standaloneMatch = window.location.pathname.match(/^\/r\/([^/]+)\/?$/);
const qrMatch = window.location.pathname.match(/^\/r\/([^/]+)\/qr\/?$/);

const root = createRoot(document.getElementById("root"));


if (qrMatch) {
  document.body.classList.add("is-qr-page");
}

root.render(
  <React.StrictMode>
    {qrMatch ? (
      <QrCodePage barId={decodeURIComponent(qrMatch[1])} />
    ) : standaloneMatch ? (
      <StandalonePage barId={decodeURIComponent(standaloneMatch[1])} />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
