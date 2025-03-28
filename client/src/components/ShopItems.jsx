// src/components/ShopItems.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Plus, Check, X, SortAsc, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import socketClient from '../socket';

function ShopItems({ shop, user }) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('ks');
  const [editingItem, setEditingItem] = useState(null);
  const [sortBy, setSortBy] = useState('custom');
  const [activeUsers, setActiveUsers] = useState(new Set());
  const queryClient = useQueryClient();

  const units = [
    { value: 'ks', label: 'ks' },
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'l', label: 'l' },
    { value: 'ml', label: 'ml' },
    { value: 'balení', label: 'balení' },
  ];

  useEffect(() => {
    console.log('Setting up socket connection for shop:', shop._id);

    // Připojení
    socketClient.connect(user._id);
    socketClient.joinShop(shop._id, user._id);

    // Definujeme handler pro změny
    const handleItemChange = ({ type, item, userId }) => {
      console.log('Received item change:', { type, item, userId });
      console.log('Current user:', user._id);

      if (userId !== user._id) {
        console.log('Updating data for type:', type);
        queryClient.setQueryData(['items', shop._id], (oldData) => {
          if (!oldData) {
            console.log('No existing data');
            return [item];
          }

          console.log('Current data:', oldData);

          switch (type) {
            case 'updated':
              const newData = oldData.map((oldItem) => (oldItem._id === item._id ? item : oldItem));
              console.log('Updated data:', newData);
              return newData;
            case 'added':
              console.log('Adding new item');
              return [...oldData, item];
            case 'deleted':
              console.log('Removing item');
              return oldData.filter((oldItem) => oldItem._id !== item._id);
            default:
              return oldData;
          }
        });
      }
    };

    // Registrujeme handler
    socketClient.socket?.on('itemChange', handleItemChange);

    // Cleanup
    return () => {
      console.log('Cleaning up socket connection');
      socketClient.socket?.off('itemChange', handleItemChange);
      socketClient.disconnect();
    };
  }, [shop._id, user._id]);

  // Query a Mutations
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', shop._id],
    queryFn: async () => {
      const { data } = await axios.get(`http://localhost:5000/api/shops/${shop._id}/items`, {
        withCredentials: true,
      });
      return data;
    },
  });

  const addItem = useMutation({
    mutationFn: async (newItem) => {
      const { data } = await axios.post(
        `http://localhost:5000/api/shops/${shop._id}/items`,
        newItem,
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: (data) => {
      console.log('Item added, emitting change'); // přidáme logging
      queryClient.invalidateQueries(['items', shop._id]);
      socketClient.emitItemChange('added', shop._id, data);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, updates }) => {
      const { data } = await axios.patch(
        `http://localhost:5000/api/shops/${shop._id}/items/${itemId}`,
        updates,
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['items', shop._id]);
      socketClient.emitItemChange('updated', shop._id, {
        item: data,
        userName: user.name, // přidáme jméno uživatele
        shopId: shop._id, // zajistíme, že shopId je součástí dat
        familyId: shop.familyId, // přidáme familyId
      });
      setEditingItem(null);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId) => {
      await axios.delete(`http://localhost:5000/api/shops/${shop._id}/items/${itemId}`, {
        withCredentials: true,
      });
      return itemId;
    },
    onSuccess: (itemId) => {
      queryClient.invalidateQueries(['items', shop._id]);
      socketClient.emitItemChange('Deleted', shop._id, { _id: itemId });
    },
  });

  // Event handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItemName.trim()) {
      addItem.mutate({
        name: newItemName,
        quantity: newItemQuantity,
        unit: newItemUnit,
      });
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (editingItem && editingItem.name.trim()) {
      updateItem.mutate({
        itemId: editingItem._id,
        updates: {
          name: editingItem.name,
          quantity: editingItem.quantity,
          unit: editingItem.unit,
        },
      });
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const updatedItems = Array.from(items);
    const [reorderedItem] = updatedItems.splice(sourceIndex, 1);
    updatedItems.splice(destinationIndex, 0, reorderedItem);

    // Update order v databázi
    updateItem.mutate({
      itemId: reorderedItem._id,
      updates: { order: destinationIndex },
    });
  };

  // Sorting
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'completed':
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return (a.order || 0) - (b.order || 0);
      case 'custom':
        return (a.order || 0) - (b.order || 0);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Přidání nové položky */}
      <motion.form
        onSubmit={handleSubmit}
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Nová položka..."
            className="flex-1 min-w-[200px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(Number(e.target.value))}
              min="0.1"
              step="0.1"
              className="w-20 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="w-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {units.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Přidat</span>
            </button>
          </div>
        </div>
      </motion.form>

      {/* Řazení */}
      <div className="flex items-center gap-3 mb-6">
        <SortAsc size={20} className="text-gray-400" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="custom">Vlastní pořadí</option>
          <option value="name">Podle názvu</option>
          <option value="date">Podle data</option>
          <option value="completed">Podle stavu</option>
        </select>
      </div>

      {/* Seznam položek */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="items">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              <AnimatePresence>
                {sortedItems.map((item, index) => (
                  <Draggable
                    key={item._id}
                    draggableId={item._id}
                    index={index}
                    isDragDisabled={sortBy !== 'custom'}
                  >
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`
                          bg-white rounded-xl border p-4 transition-shadow
                          ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
                          ${sortBy === 'custom' ? 'cursor-grab active:cursor-grabbing' : ''}
                        `}
                      >
                        {editingItem?._id === item._id ? (
                          <form onSubmit={handleEdit} className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, name: e.target.value })
                              }
                              className="flex-1 min-w-[200px] p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <input
                              type="number"
                              value={editingItem.quantity}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, quantity: Number(e.target.value) })
                              }
                              min="0.1"
                              step="0.1"
                              className="w-20 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                              value={editingItem.unit}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, unit: e.target.value })
                              }
                              className="w-24 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              {units.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItem(null)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <X size={20} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-3">
                            {sortBy === 'custom' && <div className="text-gray-400 px-1">⋮⋮</div>}
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() =>
                                updateItem.mutate({
                                  itemId: item._id,
                                  updates: { completed: !item.completed },
                                })
                              }
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span
                              className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                            >
                              {item.name}
                            </span>
                            <span className="text-gray-500">
                              {item.quantity} {item.unit}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Opravdu chcete smazat tuto položku?')) {
                                    deleteItem.mutate(item._id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </AnimatePresence>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Prázdný stav */}
      {items.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-gray-400 mb-3">
            <ShoppingBag size={48} className="mx-auto" />
          </div>
          <p className="text-gray-500">Zatím nemáte žádné položky</p>
        </motion.div>
      )}
    </div>
  );
}

export default ShopItems;
