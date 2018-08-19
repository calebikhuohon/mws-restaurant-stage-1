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
                caches.addAll(urlsToCache);
            }).then(() => self.skipWaiting()).catch(err => console.log('error occured while caching files: ', err))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                //cache hit - return response
                if(response) {
                    return response;
                }

                //clone the request
                let fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then((response) => {
                        //Check if we received a valid response
                        if(!response || response.status != 200 ) {
                            return response;
                        }
                    }
                );

                //clone the response 
                let responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;

                
            })
    );
});


self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys(). then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    caches.delete(key);
                    console.log(`deleted ${key}`);
                })
            )
        })
    )
})