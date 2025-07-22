import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/* Lowcoder.connect só existe *dentro* do Lowcoder.
   Se estiver testando fora, criamos um mock vazio. */
const LowcoderGlobal = window.Lowcoder || {
  connect: (C) => (props) => <C {...props} />,
};

const Connected = LowcoderGlobal.connect(App);

/* monta o app no elemento informado */
function mount(targetId = 'root', props = {}) {
  const el = document.getElementById(targetId);
  if (!el) return console.error(`elemento #${targetId} inexistente`);
  ReactDOM.createRoot(el).render(<Connected {...props} />);
}

/* 👉 exporta mount como *default*  – é isso que vira window.BloqueioWidget */
export default { mount };
