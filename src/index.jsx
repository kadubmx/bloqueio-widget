import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Usa Lowcoder.connect se existir; fora do Lowcoder usa fallback
const LowcoderAPI = window.Lowcoder || { connect: (C) => (p) => <C {...p} /> };
const Connected   = LowcoderAPI.connect(App);

function mount(targetId = 'root', props = {}) {
  const el = document.getElementById(targetId);
  if (!el) { console.error(`#${targetId} não encontrado`); return; }
  ReactDOM.createRoot(el).render(<Connected {...props} />);
}

window.BloqueioWidget = { mount };   // <- define sempre
