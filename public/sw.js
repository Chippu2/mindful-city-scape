// Mindscape City Service Worker for Notifications and Offline Support

const CACHE_NAME = 'mindscape-city-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  
  notification.close();
  
  // Send message to main app
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        clients[0].postMessage({
          type: 'NOTIFICATION_CLICK',
          action: action,
          tag: notification.tag
        });
        return clients[0].focus();
      } else {
        // Open new window if no clients are open
        return self.clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline activity completion
self.addEventListener('sync', (event) => {
  if (event.tag === 'activity-completion') {
    event.waitUntil(syncActivityCompletions());
  }
});

async function syncActivityCompletions() {
  try {
    // Get pending completions from IndexedDB
    const pendingCompletions = await getPendingCompletions();
    
    for (const completion of pendingCompletions) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/activity-completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completion)
        });
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingCompletion(completion.id);
        }
      } catch (error) {
        console.error('Failed to sync completion:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MindscapeCity', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingCompletions')) {
        db.createObjectStore('pendingCompletions', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offlineActivities')) {
        db.createObjectStore('offlineActivities', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingCompletions() {
  const db = await openDB();
  const transaction = db.transaction(['pendingCompletions'], 'readonly');
  const store = transaction.objectStore('pendingCompletions');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingCompletion(id) {
  const db = await openDB();
  const transaction = db.transaction(['pendingCompletions'], 'readwrite');
  const store = transaction.objectStore('pendingCompletions');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification handling (for future server-sent notifications)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'mindscape-notification',
      requireInteraction: false,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});