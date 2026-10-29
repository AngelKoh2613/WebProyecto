import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { registerProductionServiceWorker } from "./pwa/register-service-worker";
import "./styles/index.css";

registerProductionServiceWorker();

const rootElement = document.querySelector("#root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
