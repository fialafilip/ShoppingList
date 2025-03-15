self.addEventListener('push', function (event) {
  console.log('Push event received:', event.data?.text());

  const options = {
    body: event.data?.text() || 'Nová aktualizace v nákupním seznamu',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration
      .showNotification('Nákupní Seznam', options)
      .then(() => console.log('Notification shown'))
      .catch((error) => console.error('Error showing notification:', error))
  );
});
