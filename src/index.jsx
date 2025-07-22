import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const Connected = Lowcoder.connect(App);

export function mount(targetId = 'root') {
  const root = ReactDOM.createRoot(document.getElementById(targetId));
  root.render(<Connected />);
}