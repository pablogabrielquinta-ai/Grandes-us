/* DPEC GU Campo - service worker
   Estrategia: red primero, caché de respaldo. */

var CACHE = 'dpec-gu-campo-v5';
var ARCHIVOS = [
  './dpec_gu_campo.html',
  './gu-manifest.json',
  './gu-icon-192.png',
  './gu-icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ARCHIVOS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(resp){
      var copia = resp.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copia); });
      return resp;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
