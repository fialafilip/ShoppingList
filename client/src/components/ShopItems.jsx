// src/components/ShopItems.jsx
import { useState, useEffect  } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Plus, Check, X, SortAsc, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { socket } from '../socket';

function ShopItems({ shop, user  }) {
  const [newItemName, setNewItemName] = useState('');
 const [newItemQuantity, setNewItemQuantity] = useState(1);
 const [newItemUnit, setNewItemUnit] = useState('ks');
 const [editingItem, setEditingItem] = useState(null);
 const [sortBy, setSortBy] = useState('custom');
 const [activeEditors, setActiveEditors] = useState({}); 
 const queryClient = useQueryClient();

 useEffect(() => {
  // Připojení k místnosti shopu
  socket.emit('joinShop', { shopId: shop._id, userId: user._id });

  // Poslech na změny od ostatních uživatelů
  socket.on('itemUpdate', ({ type, data, userId }) => {
    if (userId !== user._id) {
      queryClient.invalidateQueries(['items', shop._id]);
    }
  });

  // Cleanup při odpojení
  return () => {
    socket.off('itemUpdate');
  };
}, [shop._id, user._id]);

 const units = [
  { value: 'ks', label: 'ks' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
  { value: 'balení', label: 'balení' }
];

 const { data: items = [], isLoading } = useQuery({
   queryKey: ['items', shop._id],
   queryFn: async () => {
     const { data } = await axios.get(`http://localhost:5000/api/shops/${shop._id}/items`, {
       withCredentials: true
     });
     return data;
   }
 });

 const addItem = useMutation({
  mutationFn: async (newItem) => {
    const { data } = await axios.post(`http://localhost:5000/api/shops/${shop._id}/items`, newItem, {
      withCredentials: true
    });
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries(['items', shop._id]);
    socket.emit('itemChanged', {
      shopId: shop._id,
      type: 'added',
      data,
      userId: user._id
    });
  }
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
    socket.emit('itemChanged', {
      shopId: shop._id,
      type: 'updated',
      data,
      userId: user._id
    });
    setEditingItem(null); // Ukončení editace po úspěšné aktualizaci
  }
});

  const deleteItem = useMutation({
    mutationFn: async (itemId) => {
      await axios.delete(
        `http://localhost:5000/api/shops/${shop._id}/items/${itemId}`,
        { withCredentials: true }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['items', shop._id]);
      socket.emit('itemChanged', {
        shopId: shop._id,
        type: 'deleted',
        data,
        userId: user._id
      });
    }
  });

  const reorderItems = useMutation({
    mutationFn: async ({ itemId, newOrder }) => {
      const { data } = await axios.patch(
        `http://localhost:5000/api/shops/${shop._id}/items/${itemId}/reorder`,
        { order: newOrder },
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['items', shop._id]);
      socket.emit('itemChanged', {
        shopId: shop._id,
        type: 'reordered',
        data,
        userId: user._id
      });
    }
  });

  const toggleItem = useMutation({
    mutationFn: async (item) => {
      const { data } = await axios.patch(
        `http://localhost:5000/api/shops/${shop._id}/items/${item._id}`,
        { completed: !item.completed },
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['items', shop._id]);
      socket.emit('itemChanged', {
        shopId: shop._id,
        type: 'toggled',
        data,
        userId: user._id
      });
    }
});

// Když začneme editovat položku
const handleStartEditing = (item) => {
  setEditingItem(item);
  socket.emit('startEditing', {
    shopId: shop._id,
    itemId: item._id,
    userId: user._id
  });
};

// Když skončíme s editací
const handleStopEditing = () => {
  if (editingItem) {
    socket.emit('stopEditing', {
      shopId: shop._id,
      itemId: editingItem._id
    });
  }
  setEditingItem(null);
};

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItemName.trim()) {
      addItem.mutate({
        name: newItemName,
        quantity: newItemQuantity,
        unit: newItemUnit
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
          unit: editingItem.unit 
        }
      });
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    const itemsCopy = Array.from(items);
    const [reorderedItem] = itemsCopy.splice(sourceIndex, 1);
    itemsCopy.splice(destinationIndex, 0, reorderedItem);

    reorderItems.mutate({
      itemId: reorderedItem._id,
      newOrder: destinationIndex
    });
  };

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'completed':
      case 'custom':
        // Nejdřív podle dokončení, pak podle vlastního pořadí
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return (a.order || 0) - (b.order || 0);
      default:
        return 0;
    }
});
  const itemVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: { duration: 0.2 }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
 
  return (
    <div className="p-6">
      {/* Formulář pro přidání položky */}
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
            placeholder="Přidat novou položku..."
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
              {units.map(unit => (
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

      {/* Seznam položek */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="items">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              <AnimatePresence>
              {sortedItems.map((item, index) => (
        <Draggable key={item._id} draggableId={item._id} index={index}>
          {(provided, snapshot) => (
            <motion.div
                     ref={provided.innerRef}
                     {...provided.draggableProps}
                     {...provided.dragHandleProps}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ 
                       opacity: 1, 
                       y: 0,
                       transition: {
                         type: "spring",
                         stiffness: 500,
                         damping: 30
                       }
                     }}
                     exit={{ opacity: 0, y: 20 }}
                     layout // Toto zajistí plynulou animaci při změně pozice
                     className={`bg-white rounded-xl border p-4 ${
                       snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                     }`}
                     >
                     {editingItem?._id === item._id ? (
                          <form onSubmit={handleEdit} className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                              className="flex-1 min-w-[200px] p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <input
                              type="number"
                              value={editingItem.quantity}
                              onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                              min="0.1"
                              step="0.1"
                              className="w-20 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                              value={editingItem.unit}
                              onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                              className="w-24 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              {units.map(unit => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                              <Check size={20} />
                            </button>
                            <button
                              type="button"
                              onClick={handleStopEditing}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            >
                              <X size={20} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-3">
                            <input
  type="checkbox"
  checked={item.completed}
  onChange={() => toggleItem.mutate(item)}
  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
/>
                            <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item.name}
                            </span>
                            <span className="text-gray-500">
                              {item.quantity} {item.unit}
                            </span>
                            {activeEditors[item._id] && (
                    <span className="text-sm text-blue-500 animate-pulse">
                      Upravuje uživatel...
                    </span>
                  )}
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStartEditing(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      disabled={!!activeEditors[item._id]}
                    >
                      <Edit2 size={16} />
                    </button>
                              <button
                                onClick={() => {
                                  if (confirm('Opravdu chcete smazat tuto položku?')) {
                                    deleteItem.mutate(item._id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
    </div>
  );
}

export default ShopItems;