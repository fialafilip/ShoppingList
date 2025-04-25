import { useQuery } from '@tanstack/react-query';
import { useRegisterSW } from 'virtual:pwa-register/react';
import axios from 'axios';
import { ShopList } from './components/shop-list';
import Login from './components/Login';
import NotificationPrompt from './components/NotificationPrompt';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const { t } = useLanguage();
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/auth/user', {
        withCredentials: true,
      });
      return data;
    },
  });

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {user ? <ShopList user={user} /> : <Login />}
      <NotificationPrompt />
      {/* PWA Update notification */}
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-0 right-0 m-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <div className="mb-4">
              {offlineReady ? (
                <p className="text-gray-700">{t('pwa.offlineReady')}</p>
              ) : (
                <p className="text-gray-700">{t('pwa.updateAvailable')}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              {needRefresh && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={() => updateServiceWorker(true)}
                >
                  {t('pwa.update')}
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => close()}
              >
                {t('pwa.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
