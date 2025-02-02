import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Users, Store, Edit2, Trash2, X, Check, Plus, LogOut  } from 'lucide-react';
import ShopItems from './ShopItems';
import FamilyManager from './FamilyManager';

function ShopList({ user }) {
  const [newShopName, setNewShopName] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [editingShop, setEditingShop] = useState(null);
  const [showFamilyManager, setShowFamilyManager] = useState(false);
  const queryClient = useQueryClient();

  const shopIcons = ['🏪', '🛒', '💊', '🔨', '📚', '🥖', '🏥', '🎮', '👕', '🐱', '🌺', '🍷'];
 

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/api/shops', {
        withCredentials: true
      });
      return data;
    }
  });

  const createShop = useMutation({
    mutationFn: async (newShop) => {
      const { data } = await axios.post('http://localhost:5000/api/shops', newShop, {
        withCredentials: true
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
      setNewShopName('');
    }
  });

  const updateShop = useMutation({
    mutationFn: async (shop) => {
      const { data } = await axios.patch(`http://localhost:5000/api/shops/${shop._id}`, shop, {
        withCredentials: true
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
      setEditingShop(null);
    }
  });

  const deleteShop = useMutation({
    mutationFn: async (shopId) => {
      await axios.delete(`http://localhost:5000/api/shops/${shopId}`, {
        withCredentials: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
      if (selectedShop?._id === editingShop?._id) {
        setSelectedShop(null);
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newShopName.trim()) {
      createShop.mutate({
        name: newShopName,
        icon: '🏪'
      });
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (editingShop && editingShop.name.trim()) {
      updateShop.mutate(editingShop);
    }
  };

  const handleDelete = (shop) => {
    if (confirm(`Opravdu chcete smazat obchod "${shop.name}"?`)) {
      deleteShop.mutate(shop._id);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/auth/logout', {}, {
        withCredentials: true
      });
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  

  if (isLoading) {
    return <div className="p-4">Načítám...</div>;
  }

  // src/components/ShopList.jsx - hlavní změny v UI
return (
  <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="container mx-auto px-4">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Nákupní seznamy</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFamilyManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-gray-700"
            >
              <Users size={20} />
              <span>Rodina</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <LogOut size={20} />
              <span>Odhlásit</span>
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Levý panel s obchody */}
        <section className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="Název nového obchodu..."
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <Plus size={20} />
                  <span>Přidat</span>
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {shops?.map((shop) => (
                <div key={shop._id}>
                  {editingShop?._id === shop._id ? (
                    <form onSubmit={handleEdit} className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={editingShop.name}
                          onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                          className="flex-1 p-2 border rounded-lg"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            type="submit"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Check size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingShop(null)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {shopIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setEditingShop({ ...editingShop, icon })}
                            className={`p-3 rounded-lg hover:bg-blue-100 transition-colors ${
                              editingShop.icon === icon ? 'bg-blue-200' : 'bg-blue-50'
                            }`}
                          >
                            <span className="text-2xl">{icon}</span>
                          </button>
                        ))}
                      </div>
                    </form>
                  ) : (
                    <div
                      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedShop?._id === shop._id
                          ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                          : 'bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedShop(shop)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{shop.icon}</span>
                          <span className="font-medium text-gray-800">{shop.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShop(shop);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(shop);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {shops?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Store className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Zatím nemáte žádné obchody</p>
                </div>
              )}
            </div>
          </div>
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
    {showFamilyManager && (
      <FamilyManager onClose={() => setShowFamilyManager(false)} />
    )}
  </main>
);
          }

export default ShopList;