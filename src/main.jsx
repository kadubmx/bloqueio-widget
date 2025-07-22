import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

if (typeof window !== "undefined") {
  window.BloqueioWidget = {
    mount: (id, props = {}) => {
      const root = ReactDOM.createRoot(document.getElementById(id));
      root.render(<App {...props} />);
    }
  };
}
