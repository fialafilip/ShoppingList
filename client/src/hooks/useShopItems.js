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
      queryClient.invalidateQueries(['items', shop._id]);
      socketClient.emitItemChange('added', shop._id, data);
    },
  });

  // Update item mutation
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
        userName: user.name,
        shopId: shop._id,
        familyId: shop.familyId,
      });
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
  };
}
