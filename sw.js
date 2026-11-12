/* ============================================================
   sw.js — Service Worker de "Bar La Esquina"
   Estrategia: cache-first (primero la caché, después la red).
   ============================================================ */

/* ------------------------------------------------------------
   1) CONSTANTES
   - VERSION: cambiarla (v2, v3...) fuerza a crear una caché
     nueva y a borrar las anteriores en el próximo "activate".
   - CACHE_NOMBRE: nombre único de la caché de esta versión.
   - ARCHIVOS: todo lo que queremos guardar offline la primera
     vez que se instala el service worker.
   ------------------------------------------------------------ */
const VERSION = "v2";
const CACHE_NOMBRE = `bar-la-esquina-${VERSION}`;

const ARCHIVOS = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    "./icono-192.png",
    "./icono-512.png"
];


/* ------------------------------------------------------------
   2) EVENTO INSTALL
   Se dispara la primera vez que el navegador registra el SW,
   o cuando cambia el archivo sw.js (el navegador detecta que
   es distinto y lo reemplaza).
   Acá abrimos la caché y guardamos todos los ARCHIVOS.
   ------------------------------------------------------------ */
self.addEventListener("install", (evento) => {
    // event.waitUntil evita que el navegador termine el install
    // antes de que la caché esté llena. Si algo falla, el SW
    // no se instala y no rompemos nada.
    evento.waitUntil(
        caches.open(CACHE_NOMBRE).then((cache) => {
            // addAll descarga todo en paralelo y falla si UNO solo falla.
            return cache.addAll(ARCHIVOS);
        })
    );
});


/* ------------------------------------------------------------
   3) EVENTO ACTIVATE
   Se dispara cuando el SW nuevo toma el control (después del
   install, o cuando se cierra la última pestaña con el SW
   anterior).
   Acá limpiamos cachés viejas: dejamos SOLO la de esta VERSION.
   ------------------------------------------------------------ */
self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys().then((nombres) => {
            // Recorremos todas las cachés existentes y borramos
            // las que NO sean la actual.
            return Promise.all(
                nombres
                    .filter((nombre) => nombre !== CACHE_NOMBRE)
                    .map((nombre) => caches.delete(nombre))
            );
        })
    );
});


/* ------------------------------------------------------------
   4) EVENTO FETCH
   Se dispara cada vez que la app pide un recurso (HTML, CSS,
   JS, imágenes, etc.).
   Estrategia "primero la caché":
     - Si el recurso está en la caché → lo devolvemos.
     - Si no está → lo pedimos a la red y lo devolvemos tal cual.
   ------------------------------------------------------------ */
self.addEventListener("fetch", (evento) => {
    // Ignoramos métodos que no sean GET (POST, PUT, etc.).
    // Solo tiene sentido cachear lecturas.
    if (evento.request.method !== "GET") return;

    evento.respondWith(
        caches.match(evento.request).then((respuestaCache) => {
            // 1) ¿Está en la caché? Devolvemos la copia guardada.
            if (respuestaCache) {
                return respuestaCache;
            }

            // 2) No está: vamos a internet.
            return fetch(evento.request);
        })
    );
});
