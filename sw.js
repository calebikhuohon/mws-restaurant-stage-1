importScripts("/js/idb.js");
importScripts("/js/indexDB.js");
importScripts("/js/dbhelper.js");

const CACHE_NAME = 'restaurant-site-cache-v2';

const urlsToCache = [
    './',
    '/manifest.json',
    './images',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'js/idb.js',
    './index.html',
    './restaurant.html',
    './css/styles.css',
    'https://normalize-css.googlecode.com/svn/trunk/normalize.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://api.mapbox.com/mapbox-gl-js/v0.47.0/mapbox-gl.js',
    'https://api.mapbox.com/mapbox-gl-js/v0.47.0/mapbox-gl.css'
];


self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[Service worker] caching all files');
            cache.addAll(urlsToCache);
        }).then(() => self.skipWaiting()).catch(err => console.log('error occured while caching files: ', err))
    );
});

self.addEventListener('fetch', event => {

    if (event.request.method === 'POST') {
        event.respondWith(
            //try to send form data to server
            fetch(event.request)
            .catch(() => {
                //If unsuccessful, post a message to notify user
                self.clients.matchAll().then(function (clients) {
                    clients.forEach(function (client) {
                        client.postMessage({
                            msg: "Post unsuccessful! Server will be updated when connection is re-established.",
                            url: event.request.url
                        });
                    });
                });
            })
        );
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(res => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, res.clone());
                    return res;
                });
            });
        })
    );
});


self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keyList => {
            Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME) {
                        caches.delete(key);
                        console.log(`deleted ${key}`)
                    }
                })
            );
        })
    );
})