import { useState } from 'react';
import { Users, LogOut, Menu, X, Store, Plus, Edit2, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import FamilyManager from './FamilyManager';
import FamilySwitcher from './FamilySwitcher';
import { EditShopForm } from './shop-list/EditShopForm';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

function Header({
  user,
  shops,
  selectedShop,
  editingShop,
  onShopSelect,
  onShopAdd,
  onShopEdit,
  onShopEditSubmit,
  onShopEditCancel,
  onShopDelete,
}) {
  const { t } = useLanguage();
  const [showFamilyManager, setShowFamilyManager] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/auth/logout', {}, { withCredentials: true });
      queryClient.setQueryData(['user'], null);
      queryClient.invalidateQueries(['user']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleShopSelect = (shop) => {
    onShopSelect(shop);
    setIsMenuOpen(false);
  };

  const handleAddShop = (e) => {
    e.preventDefault();
    if (newShopName.trim()) {
      onShopAdd({
        name: newShopName,
        icon: '🏪',
      });
      setNewShopName('');
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b md:static fixed top-0 left-0 right-0 z-[100] shadow-sm backdrop-blur-lg bg-white/90"
      >
        <div className="container mx-auto px-3">
          <div className="flex justify-between items-center h-14">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <motion.h1
                className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {t('app.name')}
              </motion.h1>
              <div className="hidden md:block">
                <FamilySwitcher currentFamilyId={user?.currentFamilyId} />
              </div>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFamilyManager(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t('family.manage')}</span>
              </motion.button>
              <div className="flex items-center gap-2">
                <motion.img
                  src={user?.picture}
                  alt={user?.name}
                  className="w-7 h-7 rounded-lg ring-1 ring-indigo-100"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700"
                  title={t('auth.logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu - mounted at root level */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-14 bottom-0 right-0 w-[85%] max-w-md bg-white z-[999] overflow-y-auto shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* User profile section */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50">
                  <div className="flex items-center gap-3 mb-3">
                    <motion.img
                      src={user?.picture}
                      alt={user?.name}
                      className="w-10 h-10 rounded-lg ring-2 ring-white/50 shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    />
                    <div>
                      <h2 className="font-medium text-gray-900">{user?.name}</h2>
                      <p className="text-xs text-gray-600">{t('auth.loggedInAs')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="bg-white/50 rounded-lg p-1 backdrop-blur-sm flex-1">
                      <FamilySwitcher currentFamilyId={user?.currentFamilyId} />
                    </div>
                    <div className="ml-2">
                      <LanguageSwitcher />
                    </div>
                  </div>
                </div>

                {/* Main menu content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Shop list section */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        {t('shops.title')}
                      </h2>
                      {selectedShop && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleShopSelect(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>{t('shops.cancelSelection')}</span>
                        </motion.button>
                      )}
                    </div>

                    {/* Add shop form */}
                    <form onSubmit={handleAddShop} className="mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newShopName}
                          onChange={(e) => setNewShopName(e.target.value)}
                          placeholder={t('shops.new')}
                          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm bg-white/50"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1.5 rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow text-sm font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('shops.add')}</span>
                        </motion.button>
                      </div>
                    </form>

                    <div className="space-y-1.5">
                      {shops?.map((shop) => (
                        <motion.div
                          key={shop._id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          {editingShop?._id === shop._id ? (
                            <EditShopForm
                              shop={editingShop}
                              onSave={onShopEditSubmit}
                              onCancel={onShopEditCancel}
                            />
                          ) : (
                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`group flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                                selectedShop?._id === shop._id
                                  ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 shadow-sm'
                                  : 'border border-gray-100'
                              }`}
                            >
                              <button
                                onClick={() => handleShopSelect(shop)}
                                className="flex items-center gap-2 flex-1 text-left"
                              >
                                <span className="text-xl">{shop.icon}</span>
                                <span className="font-medium text-sm text-gray-700">
                                  {shop.name}
                                </span>
                              </button>
                              <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => onShopEdit(shop)}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                  title={t('shops.edit')}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => onShopDelete(shop._id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title={t('shops.delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                      {(!shops || shops.length === 0) && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-6"
                        >
                          <Store className="w-10 h-10 mx-auto mb-2 text-indigo-200" />
                          <p className="text-sm text-gray-500">{t('shops.empty')}</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="border-t border-gray-100 p-4 space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setShowFamilyManager(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl text-indigo-700 font-medium hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <span>{t('family.manage')}</span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-red-50 rounded-xl text-red-600 font-medium hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5" />
                      <span>{t('auth.logout')}</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add padding to main content on mobile */}
      <div className="md:pt-0 pt-14">
        {showFamilyManager && <FamilyManager onClose={() => setShowFamilyManager(false)} />}
      </div>
    </>
  );
}

Header.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    picture: PropTypes.string,
    currentFamilyId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ]),
    pendingSetup: PropTypes.bool,
  }),
  shops: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    })
  ),
  selectedShop: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }),
  editingShop: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }),
  onShopSelect: PropTypes.func.isRequired,
  onShopAdd: PropTypes.func.isRequired,
  onShopEdit: PropTypes.func.isRequired,
  onShopEditSubmit: PropTypes.func.isRequired,
  onShopEditCancel: PropTypes.func.isRequired,
  onShopDelete: PropTypes.func.isRequired,
};

export default Header;
