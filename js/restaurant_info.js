let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */



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
  // fill reviews
  fillReviewsHTML();
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
  ul.appendChild(createReviewForm());
  container.appendChild(ul);
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

  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.className = 'reviews_date';
  li.appendChild(date);

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
 * Create a form to allow the user create a review
 */

createReviewForm = () => {
  const form = document.createElement('form');
  form.setAttribute('method', "post");
  form.setAttribute('action', "http://localhost:1337/reviews/")

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
  reviewText.setAttribute('name', 'comment');
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
  date.innerHTML = new Date().toLocaleDateString();
  date.name = 'date';
  form.appendChild(date);

  const button = document.createElement('button');
  button.type = 'submit';
  button.innerText = 'Submit Review';
  form.appendChild(button);

  form.addEventListener('submit', event => {
    event.preventDefault();
    
    const headers = new Headers();
    headers.set('Accept', 'application/json');

    if(!navigator.onLine) {
      failedPostListener();
    }
    //get form data
    const formData = new FormData();
    formData.append(form[0].name, form[0].value);
    formData.append(form[1].name, form[1].value);
    formData.append(form[2].name, form[2].value);
    formData.append(form[3].name, form[3].value);

    //make request
    fetch('http://localhost:1337/reviews/', {
      method: 'POST',
      headers,
      body: formData
    })
  });

  document.getElementById('reviews-list').appendChild(form);
  return form;


}

failedPostListener = () => {
  navigator.serviceWorker.addEventListener('message', event => {
    const form = document.getElementById('form');

    //display message from service worker
    alert(event.data.message);

    idb.open('reviews', 1).then(db => {
      const tx = db.transaction('form_data', 'readwrite');
      const store = tx.objectStore('form_data');
      store.put({
        name: `${form[0].value}`,
        comment: `${form[1].value}`,
        rating: `${form[2].value}`,
        date: `${form[3].value}`
      });
    });
  });
}

/**
 * listen for network status
 */





window.addEventListener('online', handleConnectionChange = (event) => {
  if (event.type === 'online') {
    const headers = new Headers();
    headers.set('Accept', 'application/json');

    return idb.open('reviews', 1).then(db => {
      const tx = db.transaction([form_data], 'readonly');
      const store = tx.objectStore('form_data');
      return store.getAll();
    }).then(data => {
      const formData = new FormData();
      formData.append('name', data['name']);
      formData.append('comment', data['comment']);
      formData.append('rating', data['rating']);
      formData.append('date', data['date']);

      fetch('', {
        method: 'POST',
        headers,
        body: formData
      }).then(() => {
        //delete locally stored data after successful post to server
        idb.open('reviews', 1).then(db => {
          const tx = db.transaction('form_data', 'readwrite');
          const store = tx.objectStore('form_data');
          store.clear();
        })
      })
    });

  }
});

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