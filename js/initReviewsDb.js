const reviewsDbPromise = idb.open('restaurant_reviews', 2, db => {
 
    if (!db.objectStoreNames.contains("deferred-reviews")) {
      db.createObjectStore("deferred-reviews", {
        keyPath: "id"
      });
    }
  });