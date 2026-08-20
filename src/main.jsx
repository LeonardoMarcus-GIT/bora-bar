import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import SideRays from "./components/SideRays.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
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
    />
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
