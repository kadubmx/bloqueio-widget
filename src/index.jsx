import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Verificar se Lowcoder existe antes de usar
const Connected = typeof Lowcoder !== 'undefined' ? Lowcoder.connect(App) : App;

export function mount(targetId = 'root') {
  const element = document.getElementById(targetId);
  if (!element) {
    console.error(`Element with id ${targetId} not found`);
    return;
  }
  
  const root = ReactDOM.createRoot(element);
  root.render(React.createElement(Connected));
}

// Garantir que seja exposto globalmente
if (typeof window !== 'undefined') {
  window.BloqueioWidget = { mount };
}