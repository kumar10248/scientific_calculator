// Service Worker for Scientific Calculator PWA
const CACHE_NAME = "scientific-calculator-v1.0.0";
const CACHE_VERSION = "v1.0.0";

// Assets to cache for offline functionality
const assetsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./utils.css",
  "./manifest.json",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css",
  "https://cdn.jsdelivr.net/npm/mathjs@11.11.0/lib/browser/math.js"
];

// INSTALL EVENT - Cache all assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Caching app shell");
      return cache.addAll(assetsToCache).catch((error) => {
        console.error("[ServiceWorker] Cache addAll failed:", error);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    }).then(() => {
      console.log("[ServiceWorker] Installed successfully");
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// ACTIVATE EVENT - Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches
            return cacheName.startsWith("scientific-calculator-") && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log("[ServiceWorker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log("[ServiceWorker] Activated successfully");
      return self.clients.claim(); // Take control immediately
    })
  );
});

// FETCH EVENT - Cache-first strategy with network fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version
        console.log("[ServiceWorker] Serving from cache:", event.request.url);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      console.log("[ServiceWorker] Fetching from network:", event.request.url);
      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched response for future use
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error("[ServiceWorker] Fetch failed:", error);
        
        // Return offline page if available
        return caches.match("./index.html");
      });
    })
  );
});

// BACKGROUND SYNC (for future offline analytics)
self.addEventListener("sync", (event) => {
  console.log("[ServiceWorker] Background sync:", event.tag);
  if (event.tag === "sync-analytics") {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Placeholder for analytics sync
  console.log("[ServiceWorker] Syncing analytics...");
}

// PUSH NOTIFICATIONS (for future update notifications)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New update available!",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: "explore",
        title: "Open Calculator"
      },
      {
        action: "close",
        title: "Close"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification("Scientific Calculator", options)
  );
});

// NOTIFICATION CLICK
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});

// MESSAGE EVENT - For communication with main app
self.addEventListener("message", (event) => {
  console.log("[ServiceWorker] Message received:", event.data);
  
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data.type === "CACHE_VERSION") {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log("[ServiceWorker] Loaded successfully");
