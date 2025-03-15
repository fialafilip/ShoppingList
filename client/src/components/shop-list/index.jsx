import { useState } from 'react';
import { Store, X } from 'lucide-react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Header } from './Header';
import { ShopSidebar } from './ShopSidebar';
import { ShopItems } from '../shop-items';
import { useShops } from '../../hooks/useShops';
import FamilyManager from '../FamilyManager';

export function ShopList({ user }) {
  const [selectedShop, setSelectedShop] = useState(null);
  const [editingShop, setEditingShop] = useState(null);
  const [showFamilyManager, setShowFamilyManager] = useState(false);

  const { shops, isLoading, createShop, updateShop, deleteShop } = useShops();

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:5000/auth/logout',
        {},
        {
          withCredentials: true,
        }
      );
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return <div className="p-4">Načítám...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <Header onFamilyClick={() => setShowFamilyManager(true)} onLogout={handleLogout} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Levý panel s obchody */}
          <section className="lg:col-span-4">
            <ShopSidebar
              shops={shops}
              selectedShop={selectedShop}
              editingShop={editingShop}
              onShopSelect={setSelectedShop}
              onShopAdd={createShop.mutate}
              onShopEdit={setEditingShop}
              onShopEditSubmit={(shop) => {
                updateShop.mutate(shop);
                setEditingShop(null);
              }}
              onShopEditCancel={() => setEditingShop(null)}
              onShopDelete={(shopId) => {
                deleteShop.mutate(shopId);
                if (selectedShop?._id === shopId) {
                  setSelectedShop(null);
                }
              }}
            />
          </section>

          {/* Pravý panel s položkami */}
          <section className="lg:col-span-8">
            {selectedShop ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <header className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedShop.icon}</span>
                      <h2 className="text-xl font-semibold text-gray-800">{selectedShop.name}</h2>
                    </div>
                    <button
                      onClick={() => setSelectedShop(null)}
                      className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </header>
                <ShopItems shop={selectedShop} user={user} />
              </div>
            ) : (
              <div className="hidden lg:flex items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-center text-gray-500">
                  <Store className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Vyberte obchod ze seznamu</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      {showFamilyManager && <FamilyManager onClose={() => setShowFamilyManager(false)} />}
    </main>
  );
}

ShopList.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};
