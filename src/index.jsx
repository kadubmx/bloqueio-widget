import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/* Lowcoder.connect existe dentro do Lowcoder; fora dele criamos mock */
const Connected = window.Lowcoder
  ? window.Lowcoder.connect(App)
  : (p) => React.createElement(App, p);

/** Monta o widget no elemento indicado */
export function mount(targetId = 'root', props = {}) {
  const el = document.getElementById(targetId);
  if (!el) { 
    console.error(`#${targetId} não encontrado`); 
    return; 
  }
  
  try {
    const root = ReactDOM.createRoot(el);
    root.render(React.createElement(Connected, props));
  } catch (error) {
    console.error('Erro ao montar o widget:', error);
    // Fallback para React 17
    if (ReactDOM.render) {
      ReactDOM.render(React.createElement(Connected, props), el);
    }
  }
}

// Garantir que o widget seja exposto no window quando carregado via IIFE
if (typeof window !== 'undefined') {
  window.BloqueioWidget = { mount };
}