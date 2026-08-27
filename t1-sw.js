var CACHE_NAME = "dpec-gu-t1-v3";
var APP_FILES = [
  "dpec_gu_t1-1.html",
  "t1-manifest.json",
  "gu-icon-192.png",
  "gu-icon-512.png"
];

function isOwnFile(url) {
  for (var i = 0; i < APP_FILES.length; i++) {
    if (url.indexOf(APP_FILES[i]) !== -1) return true;
  }
  return false;
}

function isHtmlFile(url) {
  return url.indexOf("dpec_gu_t1-1.html") !== -1;
}

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_FILES.map(function (f) { return "./" + f; }));
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// IMPORTANTE: solo respondemos desde cache para los archivos propios de
// esta app. Cualquier otra request (de otra herramienta del mismo sitio,
// una imagen tomada con la camara, etc.) la dejamos pasar sin tocar.
self.addEventListener("fetch", function (event) {
  var url = event.request.url;
  if (!isOwnFile(url)) {
    return; // no interceptar: deja que el navegador maneje la request normal
  }

  // El HTML principal: red primero (para tomar cambios nuevos apenas hay
  // internet), y si no hay conexion, cae a la copia guardada.
  if (isHtmlFile(url)) {
    event.respondWith(
      fetch(event.request).then(function (fresh) {
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, fresh.clone()); });
        return fresh;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Iconos y manifest: cambian poco, cache primero est\u00e1 bien.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
