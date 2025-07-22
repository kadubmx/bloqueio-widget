import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const Connected = window.Lowcoder
  ? window.Lowcoder.connect(App)
  : (p) => <App {...p} />;

export function mount(targetId = 'root', props = {}) {
  const el = document.getElementById(targetId);
  if (!el) return console.error(`#${targetId} não encontrado`);
  ReactDOM.createRoot(el).render(<Connected {...props} />);
}
