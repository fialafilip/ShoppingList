import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useShops() {
  const queryClient = useQueryClient();

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/api/shops', {
        withCredentials: true,
      });
      return data;
    },
  });

  const createShop = useMutation({
    mutationFn: async (newShop) => {
      const { data } = await axios.post('http://localhost:5000/api/shops', newShop, {
        withCredentials: true,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
    },
  });

  const updateShop = useMutation({
    mutationFn: async (shop) => {
      const { data } = await axios.patch(`http://localhost:5000/api/shops/${shop._id}`, shop, {
        withCredentials: true,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
    },
  });

  const deleteShop = useMutation({
    mutationFn: async (shopId) => {
      await axios.delete(`http://localhost:5000/api/shops/${shopId}`, {
        withCredentials: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shops']);
    },
  });

  return {
    shops,
    isLoading,
    createShop,
    updateShop,
    deleteShop,
  };
}
