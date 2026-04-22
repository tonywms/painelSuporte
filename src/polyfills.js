// src/polyfills.js

// Polyfill para globalThis
if (typeof globalThis === 'undefined') {
  if (typeof window !== 'undefined') {
    window.globalThis = window;
  } else if (typeof self !== 'undefined') {
    self.globalThis = self;
  } else if (typeof global !== 'undefined') {
    global.globalThis = global;
  } else {
    this.globalThis = this;
  }
}

// Polyfill para Array.prototype.flat (se necessário)
if (!Array.prototype.flat) {
  Array.prototype.flat = function(depth = 1) {
    const result = [];
    (function flatten(arr, d) {
      for (let item of arr) {
        if (Array.isArray(item) && d > 0) {
          flatten(item, d - 1);
        } else {
          result.push(item);
        }
      }
    })(this, depth);
    return result;
  };
}

// Polyfill para Promise.allSettled
if (!Promise.allSettled) {
  Promise.allSettled = function(promises) {
    return Promise.all(
      promises.map(p =>
        Promise.resolve(p).then(
          value => ({ status: 'fulfilled', value }),
          reason => ({ status: 'rejected', reason })
        )
      )
    );
  };
}

// Polyfill para Object.fromEntries
if (!Object.fromEntries) {
  Object.fromEntries = function(entries) {
    const obj = {};
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    return obj;
  };
}

// Polyfill para String.prototype.replaceAll
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(search, replacement) {
    return this.split(search).join(replacement);
  };
}

console.log('✅ Polyfills carregados para TV Samsung');