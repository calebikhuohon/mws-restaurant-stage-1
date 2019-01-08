/**
 * Common database helper functions.
 */

/**
 * IndexDB initialization
 */

const dbPromise = idb.open('restaurants', 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      return upgradeDB.createObjectStore('restaurants', {
        keyPath: "id"
      });

  }
});

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    //return `https://calebikhuohon.github.io/mws-restaurant-stage-1/data/restaurants.json`;
    return `http://localhost:${port}/restaurants`;
  }

  static setFavoriteRestaurant() {
    const favButton = document.getElementById('favorite');
    return favButton.addEventListener('click', () => {
      const restaurant_id = Number(getParameterByName('id'));
      const url = DBHelper.DATABASE_URL;
      let query = false;
      const classNames = Array.from(favButton.classList);

      if (classNames.includes('add-fav')) {
        query = true;
        favButton.innerHTML = '<span>♥</span>Remove from favourites';
        favButton.classList.remove('add-fav');
        favButton.classList.add('remove-fav');
      } else {
        favButton.innerHTML = '<span>♡</span>Add to favourites';
        favButton.classList.remove('remove-fav');
        favButton.classList.add('add-fav');
      }

      fetch(`${url}/${restaurant_id}/?is_favorite=${query}`, {
          method: 'PUT'
        }).then(res => res.json())
        .then(resObj => {
          dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            store.put(resObj);
            return tx.complete;
          }).catch(err => console.log('error in adding favourite restaurant to iDB', err))
        }).catch(err => console.log(err));
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200 && navigator.onLine) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json;

        restaurants.map(restaurant => {
          dbPromise.then(db => {
              let tx = db.transaction('restaurants', 'readwrite');
              let restaurantStore = tx.objectStore('restaurants');
              restaurantStore.put(restaurant);
              return tx.complete;

            }).then(() => console.log('query added to db'))
            .catch(err => console.log('adding query to db failed', err));
        })

        callback(null, restaurants);
      } else if (!navigator.onLine) {

        console.log('offline. Query will be fetched from idb');
        dbPromise.then(db => {

          let tx = db.transaction('restaurants', 'readwrite');
          let restaurantStore = tx.objectStore('restaurants');
          return restaurantStore.get('all')
            .then(res => {
              console.log('data fetched from idb');
              callback(null, res);
            });
        });
      } else {
        // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */

  static imageUrlForRestaurant(restaurant) {

    let images = `./images/${restaurant.photograph}`;

    return {
      small: `${images}-600_small.jpg`,
      medium: `${images}-900_medium.jpg`,
      large: `${images}-1600_large.jpg`
    };
    // return (`/img/${restaurant.photograph}`);
  }


  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  

    const marker = new L.marker([
      restaurant.latlng.lat,
      restaurant.latlng.lng
    ], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    });

    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}