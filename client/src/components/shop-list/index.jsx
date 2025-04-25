import { useState } from 'react';
import { Store, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../Header';
import { ShopSidebar } from './ShopSidebar';
import { ShopItems } from '../shop-items';
import { useShops } from '../../hooks/useShops';
import FamilyManager from '../FamilyManager';

export function ShopList({ user }) {
  const [selectedShop, setSelectedShop] = useState(null);
  const [editingShop, setEditingShop] = useState(null);
  const [showFamilyManager, setShowFamilyManager] = useState(false);

  const { shops, isLoading, createShop, updateShop, deleteShop } = useShops();

  const handleAddShop = (newShop) => {
    createShop.mutate(newShop);
  };

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
  };

  const handleShopEdit = (shop) => {
    setEditingShop(shop);
  };

  const handleShopEditSubmit = (shop) => {
    updateShop.mutate(shop);
    setEditingShop(null);
  };

  const handleShopEditCancel = () => {
    setEditingShop(null);
  };

  const handleShopDelete = (shopId) => {
    if (window.confirm('Opravdu chcete smazat tento obchod?')) {
      deleteShop.mutate(shopId);
      if (selectedShop?._id === shopId) {
        setSelectedShop(null);
      }
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Store className="w-12 h-12 text-indigo-500" />
          </motion.div>
          <p className="text-indigo-700 font-medium">Načítám...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50"
    >
      <Header
        user={user}
        shops={shops}
        selectedShop={selectedShop}
        editingShop={editingShop}
        onShopSelect={handleShopSelect}
        onShopAdd={handleAddShop}
        onShopEdit={handleShopEdit}
        onShopEditSubmit={handleShopEditSubmit}
        onShopEditCancel={handleShopEditCancel}
        onShopDelete={handleShopDelete}
      />

      <div className="container mx-auto px-3 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Desktop shop sidebar */}
          <motion.section
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="hidden lg:block lg:col-span-4"
          >
            <ShopSidebar
              shops={shops}
              selectedShop={selectedShop}
              editingShop={editingShop}
              onShopSelect={handleShopSelect}
              onShopAdd={handleAddShop}
              onShopEdit={handleShopEdit}
              onShopEditSubmit={handleShopEditSubmit}
              onShopEditCancel={handleShopEditCancel}
              onShopDelete={handleShopDelete}
            />
          </motion.section>

          {/* Items section */}
          <motion.section
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="col-span-12 lg:col-span-8"
          >
            <AnimatePresence mode="wait">
              {selectedShop ? (
                <motion.div
                  key="shop-items"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-lg rounded-lg shadow-sm border border-white/20"
                >
                  <header className="p-3 border-b border-gray-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.span
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-2xl"
                        >
                          {selectedShop.icon}
                        </motion.span>
                        <motion.h2
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="text-lg font-semibold text-gray-800"
                        >
                          {selectedShop.name}
                        </motion.h2>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedShop(null)}
                        className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50/50 transition-colors"
                      >
                        <X size={18} />
                      </motion.button>
                    </div>
                  </header>
                  <ShopItems shop={selectedShop} user={user} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-center h-80 bg-white/80 backdrop-blur-lg rounded-lg shadow-sm border border-white/20"
                >
                  <div className="text-center text-gray-500">
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Store className="w-12 h-12 mx-auto mb-3 text-indigo-300" />
                    </motion.div>
                    <motion.p
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-indigo-600 text-sm"
                    >
                      Vyberte obchod ze seznamu
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
      {showFamilyManager && <FamilyManager onClose={() => setShowFamilyManager(false)} />}
    </motion.main>
  );
}

ShopList.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};
