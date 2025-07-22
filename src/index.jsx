import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/* Lowcoder.connect existe dentro do Lowcoder; fora dele criamos mock */
const Connected = window.Lowcoder
  ? window.Lowcoder.connect(App)
  : (p) => <App {...p} />;

/** Monta o widget no elemento indicado */
export function mount(targetId = 'root', props = {}) {
  const el = document.getElementById(targetId);
  if (!el) { console.error(`#${targetId} não encontrado`); return; }
  ReactDOM.createRoot(el).render(<Connected {...props} />);
}
