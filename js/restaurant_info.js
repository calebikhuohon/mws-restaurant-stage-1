let restaurant;
var newMap;

const reviewsDbPromise = idb.open('restaurant_reviews', 2, db => {

  if (!db.objectStoreNames.contains('reviews')) {
    const reviewdb = db.createObjectStore('reviews', {
      keyPath: 'unique',
      autoIncrement: true 
    });
    reviewdb.createIndex("restaurant_id", "restaurant_id");
  }


  if (!db.objectStoreNames.contains("deferred-reviews")) {
    db.createObjectStore("deferred-reviews", {
      keyPath: "id"
    });
  }
});

document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiY2FsZWJpa2h1b2hvbiIsImEiOiJjamtlZmVzaW8zenBtM3FtcW9xbm5qcjV3In0.AQLRZAE3loBBmHxLkA1WUw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imageList = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.getElementById('restaurant-img');

  image.src = imageList.medium;
  image.className = 'restaurant-img';
  image.alt = `${restaurant.name} Restaurant`;
  image.title = `${restaurant.name} Restaurant`;
  image.srcset = `${imageList.small} 350w, ${imageList.medium} 500vw, ${imageList.large} 800w`;
  image.sizes = `(min-width: 800px) 30vw, (min-width: 500px) and (max-width: 699px) 20vw, 10vw`;


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  //get all reviews
  reviewsDbPromise.then(db => {
    const tx = db.transaction('reviews');
    let store = tx.objectStore('reviews');
    //store = store.index('restaurant_id');

    return store.getAll(parseInt(restaurant.id));
  }).then(reviews => {
    if (reviews.length > 0) {
      console.log("got reviews from IDB");
      // fill reviews
      fillReviewsHTML(reviews);
    } else {
      // no reviews in IDB
      const url = `http://localhost:1337/reviews/?restaurant_id=${restaurant.id}`;
      // get  reviews online to render and save them to IDB
      fetch(url)
        .then(res => res.json())
        .then(reviews => {
          reviews = reviews.map(review => {
            const unique = Math.random().toString(36).substr(1, 9);
            return {
              id: review.id,
              restaurant_id: review.restaurant_id,
              unique: unique,
              name: review.name,
              rating: review.rating,
              comments: review.comments,
              createdAt: review.createdAt,
              updatedAt: review.updatedAt
            };
          });

          reviewsDbPromise.then(db => {
              const tx = db.transaction("reviews", "readwrite");
              let store = tx.objectStore("reviews");

              for (review of reviews) {
                store.put(review);
              }
              return tx.complete;
            }).then(() => console.log('reviews saved to IDB'))
            .catch(err => console.log('unable to save'));

          // fill reviews
          fillReviewsHTML(reviews);

        }).catch(err => console.log(err));
    }
  }).catch(err => console.log(err));
}


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet! Create a review';
    container.appendChild(noReviews);
    container.appendChild(createReviewForm());
    return;
  }

  const ul = document.getElementById('reviews-list');

  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  container.appendChild(createReviewForm());

  //add form handler
  const form = document.getElementById('form');

  let name = document.getElementById('name');
  let rating = document.getElementById('rating');
  let comment = document.getElementById('comment');
  

  form.addEventListener('submit', event => {
    event.preventDefault();


    if (name.value === '' || comment.value === '' || rating.value === '') {
      toast('all fields are required');

      return;
    }

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      if (navigator.onLine) {

        const review = {
          name: name.value,
          rating: rating.value,
          comments: comment.value,
          restaurant_id: self.restaurant.id,
          date: new Date().toLocaleDateString()
        };

        //make request
        fetch('http://localhost:1337/reviews/', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify(review)
          })
          .then(res => res.json())
          .then(data => {
            // udate reviews list
            updateReviewsHTML(data);
            toast("Sucessfully added your review"); // show success message

            const unique = Math.random().toString(36).substr(2, 9);
            // add unique property to data response
            data.unique = unique;

            // save review in IDB 
            reviewsDbPromise.then(db => {
                const tx = db.transaction('reviews', 'readwrite');
                const store = tx.objectStore('reviews');
                store.put(data);
                return tx.complete;
              }).then(() => console.log('review saved to idb'))
              .catch(error => console.log(error));

            // set input fields to empty
            name.value = "";
            rating.value = "";
            comment.value = "";
          }).catch(err => console.log(err));

      } else { // user is offline
        // set background sync
        navigator.serviceWorker.ready
          .then(sw => {
            const date = new Date().toISOString();
            const review = {
              id: date,
              name: name.value,
              rating: rating.value,
              comments: comment.value,
              restaurant_id: self.restaurant.id,
              date: new Date().toLocaleDateString()
            };

            // save deferred review to IDB
            reviewsDbPromise.then(db => {
                
                const tx = db.transaction('deferred-reviews', 'readwrite');
                const store = tx.objectStore('deferred-reviews');
                store.put(review);
                return tx.complete;
              })
              .then(() => {
                sw.sync.register("sync-new-reviews");
              })
              .then(() => {
                toast("Review saved for background syncing");
                review.createdAt = date;
                updateReviewsHTML(review);
                // set input fields to empty
                name.value = "";
                rating.value = "";
                comment.value = "";
              })
              .catch(err => console.log(err));

            const unique = Math.random().toString(36).substr(1, 9);
            review.unique = unique;

            reviewsDbPromise.then(db => {
                const tx = db.transaction('reviews', 'readwrite');
                const store = tx.objectStore('reviews');
                store.put(review);
                return tx.complete;
              }).then(() => console.log('review saved to idb'))
              .catch(error => console.log(error));
          })
          .catch(error => console.log(error))
      }

    } else {
      if (navigator.onLine) {
        const review = {
          name: name.value,
          rating: rating.value,
          comments: comment.value,
          restaurant_id: self.restaurant.id,
          date: new Date().toLocaleDateString()
        };

        fetch('http://localhost:1337/reviews/', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify(review)
          })
          .then(res => res.json())
          .then(data => {
            // udate reviews list
            updateReviewsHTML(data);
            toast("Sucessfully added your review"); // show success message

            const unique = Math.random().toString(36).substr(2, 9);
            // add unique property to data response
            data.unique = unique;

            // save review in IDB 
            reviewsDbPromise.then(db => {
                const tx = db.transaction('reviews', 'readwrite');
                const store = tx.objectStore('reviews');
                store.put(data);
                return tx.complete;
              }).then(() => console.log('review saved to idb'))
              .catch(error => console.log(error));

            // set input fields to empty
            name.value = "";
            rating.value = "";
            comment.value = "";
          }).catch(err => console.log(err));

      } else {
        // does not support backgroud syncing and user is offline
        toast("Sorry you cannot add review offline");
      }

    }

  });

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = 'reviews_name';
  name.innerHTML = review.name;
  li.appendChild(name);

  // const date = document.createElement('p');
  // date.innerHTML = review.date;
  // date.className = 'reviews_date';
  // li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'reviews_rating';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'reviews_comments';
  li.appendChild(comments);

  return li;
}


/**
 * update reviews
 */

updateReviewsHTML = review => {
  const ul = document.getElementById("reviews-list");

  ul.appendChild(createReviewHTML(review));
}


toast = message => {
  // Get the snackbar DIV
  const x = document.querySelector(".toast");
  x.innerHTML = message;
  // Add the "show" class
  x.classList.add("show");
  // After 3 seconds, remove the show class from DIV
  setTimeout(() => x.classList.remove("show"), 3000);
};

/**
 * Create a form to allow the user create a review
 */

createReviewForm = () => {
  const form = document.createElement('form');
  form.setAttribute('method', "post");
  form.setAttribute('id', 'form');

  //label for reviewer's name
  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', 'name');
  nameLabel.innerHTML = 'Name: ';
  form.appendChild(nameLabel);

  //Input for reviewer's name
  nameInput = document.createElement('input');
  nameInput.setAttribute('id', 'name');
  nameInput.type = 'text';
  nameInput.setAttribute('placeholder', 'Please enter your name');
  nameInput.setAttribute('autocomplete', 'given-name');
  nameInput.setAttribute('name', 'name');
  form.appendChild(nameInput);


  //label for reviewer's comment
  const commentLabel = document.createElement('label');
  commentLabel.setAttribute('for', 'comment');
  commentLabel.innerHTML = 'Comment: ';
  form.appendChild(commentLabel);

  //text area for reviewer's comment
  const reviewText = document.createElement('textarea');
  reviewText.setAttribute('id', 'comment');
  reviewText.setAttribute('name', 'comments');
  reviewText.setAttribute('class', 'comment');
  form.appendChild(reviewText);

  //label for rating
  const ratingLabel = document.createElement('label');
  ratingLabel.setAttribute('for', 'rating');
  ratingLabel.innerHTML = 'Rating: ';
  form.appendChild(ratingLabel);

  //input for rating
  const ratingInput = document.createElement('input');
  ratingInput.setAttribute('type', 'number');
  ratingInput.setAttribute('id', 'rating');
  ratingInput.setAttribute('name', 'rating');
  ratingInput.setAttribute('min', '1');
  ratingInput.setAttribute('max', '5');
  form.appendChild(ratingInput);

  
  //date
  const date = document.createElement('p');
  date.setAttribute('id','date');
  date.setAttribute('name', 'date');
  date.innerHTML = new Date().toLocaleDateString();
  form.appendChild(date);  

  const button = document.createElement('button');
  button.type = 'submit';
  button.innerText = 'Submit Review';
  form.appendChild(button);

  //document.getElementById('reviews-list').appendChild(form);
  return form;
}


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

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