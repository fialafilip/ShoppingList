import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

function NotificationPrompt() {
  const { t } = useLanguage();
  const [permission, setPermission] = useState(Notification.permission);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestPermission = async () => {
    try {
      setIsSubscribing(true);
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Get VAPID public key from server
        const response = await fetch('http://localhost:5000/api/push/vapidPublicKey');
        const { publicKey } = await response.json();

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Send subscription to server
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
    } finally {
      setIsSubscribing(false);
    }
  };

  if (permission === 'granted') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-indigo-100"
      >
        <div className="flex items-start gap-3">
          <div className="bg-indigo-50 rounded-lg p-2">
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-700 mb-3">{t('notifications.prompt')}</p>
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={requestPermission}
                disabled={isSubscribing}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubscribing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Bell className="w-4 h-4" />
                    </motion.div>
                    <span>{t('notifications.allow')}...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>{t('notifications.allow')}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NotificationPrompt;
