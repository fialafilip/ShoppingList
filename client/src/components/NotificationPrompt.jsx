import { useState, useEffect } from 'react';

function NotificationPrompt() {
  const [permission, setPermission] = useState(Notification.permission);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      console.log('Permission result:', result);
      setPermission(result);

      if (result === 'granted') {
        // Získáme VAPID klíč ze serveru
        const response = await fetch('http://localhost:5000/api/push/vapidPublicKey');
        const { publicKey } = await response.json();

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        console.log('Push subscription:', subscription);

        // Odešleme subscription na server
        await fetch('http://localhost:5000/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Notification setup error:', error);
    }
  };

  if (permission === 'granted') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <p className="mb-2">Chcete dostávat upozornění na změny v nákupním seznamu?</p>
      <button
        onClick={requestPermission}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Povolit notifikace
      </button>
    </div>
  );
}

export default NotificationPrompt;
