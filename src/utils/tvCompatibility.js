// src/utils/tvCompatibility.js

/* eslint-disable no-restricted-globals */

// Polyfill globalThis local (caso não tenha carregado)
if (typeof globalThis === 'undefined') {
  if (typeof window !== 'undefined') {
    window.globalThis = window;
  } else if (typeof window.self !== 'undefined') {
    window.globalThis = window.self;
  } else if (typeof global !== 'undefined') {
    global.globalThis = global;
  } else {
    this.globalThis = this;
  }
}

/* eslint-enable no-restricted-globals */

// Detectar se está em uma TV Samsung
export const isSamsungTV = () => {
  try {
    const ua = navigator.userAgent || '';
    return ua.includes('SmartTV') || 
           ua.includes('Samsung') || 
           ua.includes('Tizen') ||
           (ua.includes('Linux') && ua.includes('TV'));
  } catch (e) {
    return false;
  }
};

// Fetch com fallback para XHR (mais compatível com TVs)
export const tvFetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    // Tentar fetch primeiro
    if (typeof window !== 'undefined' && window.fetch && !isSamsungTV()) {
      fetch(url, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then(resolve)
        .catch(reject);
      return;
    }

    // Fallback para XMLHttpRequest
    try {
      const xhr = new XMLHttpRequest();
      const method = options.method || 'GET';
      xhr.open(method, url, true);
      
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Erro ao parsear JSON'));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Erro de rede'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Timeout da requisição'));
      };
      
      xhr.timeout = 30000;
      xhr.send(options.body || null);
      
    } catch (e) {
      reject(e);
    }
  });
};

// SpeechSynthesis compatível com TV
export const safeSpeak = (text, onEnd) => {
  if (typeof window === 'undefined') {
    if (onEnd) onEnd();
    return null;
  }
  
  if (!window.speechSynthesis) {
    console.log('SpeechSynthesis não suportado');
    if (onEnd) onEnd();
    return null;
  }
  
  try {
    try {
      window.speechSynthesis.cancel();
    } catch(e) {}
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.volume = 1;
    
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch(e) {
        console.error('Erro ao falar:', e);
        if (onEnd) onEnd();
      }
    }, 100);
    
    return utterance;
  } catch (e) {
    console.error('Erro no SpeechSynthesis:', e);
    if (onEnd) onEnd();
    return null;
  }
};