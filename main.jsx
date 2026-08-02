import React from "react";
import { createRoot } from "react-dom/client";
import App from "./StudyForge.jsx";

// Phase 2: if the Supabase env is configured (on Vercel), wire the real backend
// into StudyForge's seams via a global. Without env, backendReady is false and
// the app runs on Phase-1 mocks — so this file is safe in every environment.
import { backendReady } from "./src/lib/supabaseClient.js";
import * as SF_API from "./src/lib/api.js";
if (backendReady) globalThis.SF_API = SF_API;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
