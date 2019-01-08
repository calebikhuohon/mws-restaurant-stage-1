importScripts('js/restaurant_info.js');
importScripts('js/idb.js');
importScripts('js/dbhelper.js')
const CACHE_NAME = 'restaurant-site-cache-v2';

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
});

self.addEventListener('sync', event => {
   if (event.tag === 'sync-reviews') {
        event.waitUntil(
            reviewsDbPromise.then(db => {
               const tx = db.transaction('deferred-reviews','readwrite');
               const store = tx.objectStore('deferred-reviews');
               return store.getAll().then(data => {
                   for(let review of data) {
                       fetch('http://localhost:1337/reviews/', {
                           method: 'POST',
                           headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json"
                           },
                           body: JSON.stringify({
                               name: review.name,
                               rating: review.rating,
                               comments: review.comment,
                               restaurant_id: review.restaurant_id
                           })
                       }).then(res => res.json())
                       .then(() => {
                           reviewsDbPromise.then(db => {
                               const tx = db.transaction('deferred-reviews','readwrite');
                               const store = tx.objectStore('deferred-reviews');
                               store.delete(review.id);
                           })
                       }).catch(err => console.log(err))
                   }
               }).catch(err => console.log(err));
            }).catch(err => console.log(err))
        );
   }
})