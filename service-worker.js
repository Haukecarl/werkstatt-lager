const CACHE_NAME = "werkstatt-lager-v1";

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

        );

        self.clients.claim();

    }
);


// --------------------------------------------------
// DATEIEN LADEN
// --------------------------------------------------

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !== "GET"
        ) {
            return;
        }


        event.respondWith(

            caches
                .match(event.request)
                .then(cachedResponse => {

                    if (cachedResponse) {

                        return cachedResponse;

                    }


                    return fetch(
                        event.request
                    )
                        .then(networkResponse => {

                            if (
                                !networkResponse ||
                                networkResponse.status !== 200
                            ) {

                                return networkResponse;

                            }


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


                            return networkResponse;

                        })
                        .catch(() => {

                            if (
                                event.request.mode ===
                                "navigate"
                            ) {

                                return caches.match(
                                    "./index.html"
                                );

                            }

                        });

                })

        );

    }
);