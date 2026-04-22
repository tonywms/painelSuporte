// src/index.js
import './polyfills'; // <-- ADICIONAR ESTA LINHA NO INÍCIO
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Garantir que ReactDOM funciona em navegadores antigos
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
}

reportWebVitals();