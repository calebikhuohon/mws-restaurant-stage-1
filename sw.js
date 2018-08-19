const CACHE_NAME = 'restaurant-site-cache-v1';

const urlsToCache = [
    './',
    './images',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js',
    './index.html',
    './restaurant.html',
    './css/styles.css',
    './data/restaurants.json',
    '//normalize-css.googlecode.com/svn/trunk/normalize.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://api.mapbox.com/mapbox-gl-js/v0.47.0/mapbox-gl.js',
    'https://api.mapbox.com/mapbox-gl-js/v0.47.0/mapbox-gl.css'
];


self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[Service worker] caching all files');
            cache.addAll(urlsToCache);
        }).then(() => self.skipWaiting()).catch(err => console.log('error occured while caching files: ', err))
    );
});

self.addEventListener('fetch', (event) => {
    console.log(event.request.url)

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request)
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