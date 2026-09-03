import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { DemoTriple } from "./ui/PassAndPlay";
import "./styles.css";

registerSW({ immediate: true });

const root = document.getElementById("root");
if (!root) throw new Error("missing root");

const demo = new URLSearchParams(window.location.search).has("demo");

createRoot(root).render(
  <StrictMode>
    {demo ? <DemoTriple /> : <App />}
  </StrictMode>,
);
