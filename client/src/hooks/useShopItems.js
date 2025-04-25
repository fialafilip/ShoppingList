import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import socketClient from '../socket';

export function useShopItems(shop, user) {
  const queryClient = useQueryClient();

  // Query for fetching items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', shop._id],
    queryFn: async () => {
      const { data } = await axios.get(`http://localhost:5000/api/shops/${shop._id}/items`, {
        withCredentials: true,
      });
      return data;
    },
  });

  // Lock item mutation
  const lockItem = useMutation({
    mutationFn: async (itemId) => {
      console.log('[LOCK] Attempting to lock item:', itemId);
      const { data } = await axios.post(
        `http://localhost:5000/api/shops/${shop._id}/items/${itemId}/lock`,
        {},
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: (data) => {
      console.log('[LOCK] Lock success:', {
        itemId: data._id,
        userId: user._id,
        userName: user.name,
      });

      // Immediately update the cache with the locked item
      const updatedItem = {
        ...data,
        lockedBy: user._id,
        lockedByName: user.name,
        lockedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['items', shop._id], (oldItems) => {
        if (!oldItems) return oldItems;
        return oldItems.map((item) => (item._id === data._id ? updatedItem : item));
      });

      // Emit socket event for real-time updates
      socketClient.emitItemChange('locked', shop._id, updatedItem);
    },
    onError: (error) => {
      console.error('[LOCK] Lock error:', error.response?.data || error);
      if (error.response?.status === 423) {
        alert(`Položku právě upravuje ${error.response.data.lockedBy}`);
      }
    },
  });

  // Unlock item mutation
  const unlockItem = useMutation({
    mutationFn: async (itemId) => {
      console.log('[LOCK] Attempting to unlock item:', itemId);
      const { data } = await axios.post(
        `http://localhost:5000/api/shops/${shop._id}/items/${itemId}/unlock`,
        {},
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: (data) => {
      console.log('[LOCK] Unlock success:', {
        itemId: data._id,
        userId: user._id,
        userName: user.name,
      });

      // Immediately update the cache with the unlocked item
      const updatedItem = {
        ...data,
        lockedBy: null,
        lockedByName: null,
        lockedAt: null,
      };

      queryClient.setQueryData(['items', shop._id], (oldItems) => {
        if (!oldItems) return oldItems;
        return oldItems.map((item) => (item._id === data._id ? updatedItem : item));
      });

      // Emit socket event for real-time updates
      socketClient.emitItemChange('unlocked', shop._id, updatedItem);
    },
    onError: (error) => {
      console.error('[LOCK] Unlock error:', error.response?.data || error);
    },
  });

  // Add item mutation
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
      const updatedItem = {
        ...data,
        userId: user._id,
        userName: user.name,
        shopId: shop._id,
        familyId: shop.familyId,
      };

      queryClient.setQueryData(['items', shop._id], (oldItems) => {
        if (!oldItems) return [updatedItem];
        return [...oldItems, updatedItem];
      });

      socketClient.emitItemChange('added', shop._id, updatedItem);
    },
  });

  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async ({ itemId, updates }) => {
      if (!itemId || !updates) {
        throw new Error('Missing required data for update');
      }

      console.log('[LOCK] Updating item:', { itemId, updates });
      const { data } = await axios.patch(
        `http://localhost:5000/api/shops/${shop._id}/items/${itemId}`,
        { ...updates, userName: user.name },
        { withCredentials: true }
      );
      return { data, updates };
    },
    onMutate: async ({ itemId, updates }) => {
      // If this is an order update, optimistically update the cache
      if ('order' in updates) {
        const previousItems = queryClient.getQueryData(['items', shop._id]);

        if (previousItems) {
          const updatedItems = [...previousItems];
          const itemIndex = updatedItems.findIndex((item) => item._id === itemId);

          if (itemIndex !== -1) {
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], order: updates.order };
            updatedItems.sort((a, b) => (a.order || 0) - (b.order || 0));

            queryClient.setQueryData(['items', shop._id], updatedItems);
          }
        }

        return { previousItems };
      }
    },
    onError: (error, variables, context) => {
      console.error('[LOCK] Update error:', error.response?.data || error);

      // If this was an order update, roll back to the previous state
      if (context?.previousItems) {
        queryClient.setQueryData(['items', shop._id], context.previousItems);
      }

      if (error.response?.status === 423) {
        alert(`Položku právě upravuje ${error.response.data.lockedBy}`);
      } else {
        alert('Nepodařilo se aktualizovat položku. Zkuste to prosím znovu.');
      }
    },
    onSuccess: ({ data, updates }) => {
      if (!data || !data._id) {
        console.error('[LOCK] Invalid response data from update:', data);
        return;
      }

      const updatedItem = {
        ...data,
        userId: user._id,
        userName: user.name,
        shopId: shop._id,
        familyId: shop.familyId,
      };

      console.log('[LOCK] Update success, emitting change:', updatedItem);

      queryClient.setQueryData(['items', shop._id], (oldItems) => {
        if (!oldItems) return oldItems;

        const newItems = oldItems.map((item) => (item._id === data._id ? updatedItem : item));

        // Always sort by order if it's an order update
        if ('order' in updates) {
          return newItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        return newItems;
      });

      try {
        socketClient.emitItemChange('updated', shop._id, updatedItem);
      } catch (error) {
        console.error('[LOCK] Failed to emit item change:', error);
      }
    },
  });

  // Delete item mutation
  const deleteItem = useMutation({
    mutationFn: async (itemId) => {
      await axios.delete(`http://localhost:5000/api/shops/${shop._id}/items/${itemId}`, {
        withCredentials: true,
      });
      return itemId;
    },
    onSuccess: (itemId) => {
      queryClient.invalidateQueries(['items', shop._id]);
      socketClient.emitItemChange('deleted', shop._id, { _id: itemId });
    },
  });

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    lockItem,
    unlockItem,
  };
}
