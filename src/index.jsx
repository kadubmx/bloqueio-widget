import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Função de mount que usa React do ambiente
function mount(targetId = 'root') {
  const element = document.getElementById(targetId);
  if (!element) {
    console.error(`Element with id ${targetId} not found`);
    return;
  }
  
  // Usar React do window se disponível
  const ReactToUse = window.React || React;
  const ReactDOMToUse = window.ReactDOM || ReactDOM;
  
  console.log('Usando React:', ReactToUse);
  console.log('Usando ReactDOM:', ReactDOMToUse);
  
  // Verificar se Lowcoder está disponível
  const ConnectedApp = (typeof Lowcoder !== 'undefined' && Lowcoder.connect) 
    ? Lowcoder.connect(App) 
    : App;
  
  try {
    // Tentar usar createRoot primeiro
    if (ReactDOMToUse.createRoot) {
      const root = ReactDOMToUse.createRoot(element);
      root.render(ReactToUse.createElement(ConnectedApp));
    } else if (ReactDOMToUse.render) {
      // Fallback para React 17
      ReactDOMToUse.render(ReactToUse.createElement(ConnectedApp), element);
    } else {
      console.error('Nenhum método de render encontrado');
    }
    console.log('Widget montado com sucesso');
  } catch (error) {
    console.error('Erro ao montar widget:', error);
  }
}

// Exportar para IIFE
export { mount };

// Garantir exposição global
if (typeof window !== 'undefined') {
  window.BloqueioWidget = { mount };
}