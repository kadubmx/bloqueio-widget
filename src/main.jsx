import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

function mount(id, props = {}) {
  const container = document.getElementById(id);
  if (!container) {
    console.error(`Elemento com id="${id}" não encontrado`);
    return;
  }
  const root = ReactDOM.createRoot(container);
  root.render(<App {...props} />);
}

// Exporta explicitamente no window
window.BloqueioWidget = { mount };
