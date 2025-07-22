import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const LowcoderAPI = window.Lowcoder || { connect: (C) => (p) => <C {...p} /> };
const Connected   = LowcoderAPI.connect(App);

export function mount(targetId = 'root', props = {}) {
  const el = document.getElementById(targetId);
  if (!el) { console.error(`#${targetId} não encontrado`); return; }
  ReactDOM.createRoot(el).render(<Connected {...props} />);
}