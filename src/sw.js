const CACHE_NAME =
  `typewritesomething@${process.env.npm_package_version}-${process.env.git_hash}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // problematic files for firefox
        cache.addAll([
          "/static/audio/keypress.mp3",
          "/static/audio/return.mp3",
        ]);

        return cache.addAll([
          "/",
          "/dist/main.js",
          "/favicon.ico",
          "/index.html",
          "/manifest.json",
          "/static/style.css",
          "/static/fonts/specialelite-webfont.woff2",
          "/static/img/handmadepaper.png",
          "/static/img/logo-on-bg-36.png",
          "/static/img/logo-on-bg-96.png",
          "/static/img/logo-on-bg-180.png",
          "/static/img/logo-on-bg-512.png",
          "/static/img/logo-on-bg.png",
        ]);
      })
      .then(self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => cacheName !== CACHE_NAME);
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response);
          });

          return response.clone();
        });
      }),
    );
  }
});
