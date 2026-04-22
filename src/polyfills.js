// src/polyfills.js

// Garantir que globalThis existe (para componentes React)
if (typeof globalThis === 'undefined') {
  if (typeof window !== 'undefined') {
    window.globalThis = window;
  } else if (typeof window.self !== 'undefined') {
    window.globalThis = window.self;
  } else if (typeof global !== 'undefined') {
    global.globalThis = global;
  } else {
    /* eslint-disable no-invalid-this */
    this.globalThis = this;
    /* eslint-enable no-invalid-this */
  }
}

// Polyfill para requestAnimationFrame (se necessário)
if (typeof requestAnimationFrame === 'undefined') {
  window.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 16);
  };
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

console.log('✅ Polyfills carregados no React');