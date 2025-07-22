import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Lowcoder expõe window.Lowcoder; usamos o helper de conexão
const Connected = Lowcoder.connect(App);

/**
 * Monta o widget no elemento indicado.
 *  ‑ targetId: id do elemento container (<div id="root"> …)
 *  ‑ props   : { model, updateModel, runQuery }  que o Lowcoder passa
 */
export function mount(targetId = 'root', props = {}) {
  const container = document.getElementById(targetId);
  if (!container) {
    console.error(`Elemento #${targetId} não encontrado`);
    return;
  }
  const root = ReactDOM.createRoot(container);
  root.render(<Connected {...props} />);
}
