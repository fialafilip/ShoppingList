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

  const { items, isLoading, addItem, updateItem, deleteItem, lockItem, unlockItem } = useShopItems(
    shop,
    user
  );
  useSocketConnection(shop, user);

  const handleDragEnd = async (result) => {
    if (!result.destination || sortBy !== 'custom') return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    try {
      // Get the dragged item and its current order
      const draggedItem = items[sourceIndex];
      const targetItem = items[destinationIndex];

      // Calculate the new order value
      let newOrder;
      if (destinationIndex === 0) {
        // Moving to the start
        newOrder = (targetItem.order || 0) - 1;
      } else if (destinationIndex === items.length - 1) {
        // Moving to the end
        newOrder = (targetItem.order || 0) + 1;
      } else {
        // Moving between items
        const prevItem = items[destinationIndex - 1];
        const nextItem = items[destinationIndex + 1];
        newOrder =
          destinationIndex > sourceIndex
            ? (targetItem.order || 0) + (nextItem.order || 0) / 2
            : (prevItem.order || 0) + (targetItem.order || 0) / 2;
      }

      // Update the dragged item with its new order
      await updateItem.mutateAsync({
        itemId: draggedItem._id,
        updates: { order: newOrder },
      });
    } catch (error) {
      console.error('Failed to update item order:', error);
    }
  };

  const handleEdit = async (item) => {
    try {
      // Try to lock the item first
      await lockItem.mutateAsync(item._id);
      setEditingItem(item);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Failed to lock item:', error);
    }
  };

  const handleEditSubmit = async (item) => {
    try {
      // Only update the item if it's a final submit (not just a change)
      if (item._id === editingItem._id) {
        setEditingItem(item); // Update the local state immediately
        await updateItem.mutateAsync({
          itemId: item._id,
          updates: {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            userName: user.name,
          },
        });
        setEditingItem(null); // Clear editing state only after successful update
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleEditCancel = async () => {
    if (editingItem) {
      try {
        await unlockItem.mutateAsync(editingItem._id);
      } catch (error) {
        console.error('Failed to unlock item:', error);
      }
    }
    setEditingItem(null);
  };

  // Sort items only if not in custom mode
  const displayedItems =
    sortBy === 'custom'
      ? items
      : [...items].sort((a, b) => {
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
          items={displayedItems}
          editingItem={editingItem}
          onEditSubmit={handleEditSubmit}
          onEditCancel={handleEditCancel}
          onToggleComplete={(item) =>
            updateItem.mutate({
              itemId: item._id,
              updates: { completed: !item.completed },
            })
          }
          onEdit={handleEdit}
          onDelete={(itemId) => {
            if (confirm('Opravdu chcete smazat tuto položku?')) {
              deleteItem.mutate(itemId);
            }
          }}
          onDragEnd={handleDragEnd}
          sortBy={sortBy}
          currentUserId={user._id}
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
    familyId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  }).isRequired,
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};
