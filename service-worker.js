const CACHE_NAME = "werkstatt-lager-v2";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


// --------------------------------------------------
// INSTALLATION
// --------------------------------------------------

self.addEventListener(
    "install",
    event => {

        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(cache => {
                    return cache.addAll(
                        APP_FILES
                    );
                })
        );

        self.skipWaiting();

    }
);


// --------------------------------------------------
// AKTIVIERUNG
// Alte Cache-Versionen entfernen
// --------------------------------------------------

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                cacheName =>
                                    cacheName !== CACHE_NAME
                            )
                            .map(
                                cacheName =>
                                    caches.delete(
                                        cacheName
                                    )
                            )

                    );

                })
                .then(() => {
                    return self.clients.claim();
                })

        );

    }
);


// --------------------------------------------------
// DATEIEN LADEN
//
// Strategie:
// 1. Wenn Internet vorhanden:
//    aktuelle Datei vom Server laden
// 2. Neue Datei im Cache speichern
// 3. Wenn kein Internet vorhanden:
//    Datei aus dem Cache laden
// --------------------------------------------------

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !== "GET"
        ) {
            return;
        }


        const requestUrl =
            new URL(
                event.request.url
            );


        // Nur Dateien unserer eigenen App behandeln
        if (
            requestUrl.origin !==
            self.location.origin
        ) {
            return;
        }


        event.respondWith(

            fetch(
                event.request
            )
                .then(networkResponse => {

                    if (
                        networkResponse &&
                        networkResponse.status === 200
                    ) {

                        const responseCopy =
                            networkResponse.clone();


                        caches
                            .open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseCopy
                                );

                            });

                    }


                    return networkResponse;

                })
                .catch(async () => {

                    const cachedResponse =
                        await caches.match(
                            event.request
                        );


                    if (
                        cachedResponse
                    ) {

                        return cachedResponse;

                    }


                    if (
                        event.request.mode ===
                        "navigate"
                    ) {

                        return caches.match(
                            "./index.html"
                        );

                    }


                    return new Response(
                        "Offline",
                        {
                            status: 503,
                            statusText:
                                "Offline"
                        }
                    );

                })

        );

    }
);