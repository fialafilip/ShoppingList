import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegisterSW } from 'virtual:pwa-register/react';
import ShopList from './components/ShopList';
import Login from './components/Login';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState(null);

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
    <QueryClientProvider client={queryClient}>
      {user ? <ShopList user={user} /> : <Login onLogin={setUser} />}

      {/* PWA Update notification */}
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-0 right-0 m-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <div className="mb-4">
              {offlineReady ? (
                <p className="text-gray-700">Aplikace je připravena pro offline použití</p>
              ) : (
                <p className="text-gray-700">Je k dispozici nová verze aplikace</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              {needRefresh && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={() => updateServiceWorker(true)}
                >
                  Aktualizovat
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => close()}
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
}

export default App;
