// src/utils/tvCompatibility.js

/* eslint-disable no-restricted-globals */

// Polyfill globalThis local
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

// Fetch com fallback para XHR
export const tvFetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
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

// SpeechSynthesis CORRIGIDO - funciona em PC e TV
export const safeSpeak = (text, onEnd) => {
  if (typeof window === 'undefined') {
    if (onEnd) onEnd();
    return null;
  }
  
  // Verificar se speechSynthesis existe
  if (!window.speechSynthesis) {
    console.log('❌ SpeechSynthesis não suportado neste navegador');
    if (onEnd) onEnd();
    return null;
  }
  
  try {
    // Cancelar qualquer fala anterior
    try {
      window.speechSynthesis.cancel();
    } catch(e) {
      console.log('Erro ao cancelar fala anterior:', e);
    }
    
    // Criar utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.volume = 1;
    utterance.pitch = 1;
    
    // Eventos
    utterance.onstart = () => {
      console.log('🔊 Falando:', text);
    };
    
    utterance.onend = () => {
      console.log('✅ Fala finalizada');
      if (onEnd) onEnd();
    };
    
    utterance.onerror = (event) => {
    console.error('❌ Erro na fala:', event.error);
    
        // Tenta novamente após 1 segundo (usuário pode ter clicado entretanto)
        setTimeout(() => {
            try {
                const retry = new SpeechSynthesisUtterance(text);
                retry.lang = 'pt-BR';
                retry.rate = 0.9;
                retry.onend = onEnd;
                window.speechSynthesis.speak(retry);
                console.log('🔊 Tentativa 2 de falar:', text);
            } catch(e) {
                console.error('❌ Falha na segunda tentativa');
                if (onEnd) onEnd();
            }
        }, 1000);
    };
        // Para TV Samsung, precisa de um delay maior
    const delay = isSamsungTV() ? 200 : 50;
    
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch(e) {
        console.error('Erro ao executar speak:', e);
        if (onEnd) onEnd();
      }
    }, delay);
    
    return utterance;
  } catch (e) {
    console.error('❌ Erro crítico no SpeechSynthesis:', e);
    if (onEnd) onEnd();
    return null;
  }
};