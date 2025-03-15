import { useState } from 'react';
import PropTypes from 'prop-types';
import { AddItemForm } from './AddItemForm';
import { SortingControl } from './SortingControl';
import { ItemList } from './ItemList';
import { EmptyState } from './EmptyState';
import { useShopItems } from '../../hooks/useShopItems';
import { useSocketConnection } from '../../hooks/useSocketConnection';

export function ShopItems({ shop, user }) {
  const [editingItem, setEditingItem] = useState(null);
  const [sortBy, setSortBy] = useState('custom');

  const { items, isLoading, addItem, updateItem, deleteItem } = useShopItems(shop, user);
  useSocketConnection(shop, user);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const updatedItems = Array.from(items);
    const [reorderedItem] = updatedItems.splice(sourceIndex, 1);
    updatedItems.splice(destinationIndex, 0, reorderedItem);

    updateItem.mutate({
      itemId: reorderedItem._id,
      updates: { order: destinationIndex },
    });
  };

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
      <AddItemForm onAdd={addItem.mutate} />
      <SortingControl sortBy={sortBy} onSortChange={setSortBy} />

      {items.length > 0 ? (
        <ItemList
          items={sortedItems}
          editingItem={editingItem}
          onEditSubmit={(item) => {
            updateItem.mutate({
              itemId: item._id,
              updates: {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
              },
            });
            setEditingItem(null);
          }}
          onEditCancel={() => setEditingItem(null)}
          onToggleComplete={(item) =>
            updateItem.mutate({
              itemId: item._id,
              updates: { completed: !item.completed },
            })
          }
          onEdit={setEditingItem}
          onDelete={(itemId) => {
            if (confirm('Opravdu chcete smazat tuto položku?')) {
              deleteItem.mutate(itemId);
            }
          }}
          onDragEnd={handleDragEnd}
          sortBy={sortBy}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

ShopItems.propTypes = {
  shop: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    familyId: PropTypes.string.isRequired,
  }).isRequired,
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};
