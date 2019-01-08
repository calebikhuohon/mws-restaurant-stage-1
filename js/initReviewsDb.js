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