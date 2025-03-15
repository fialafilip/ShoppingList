import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketClient from '../socket';

export function useSocketConnection(shop, user) {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up socket connection for shop:', shop._id);

    socketClient.connect(user._id);
    socketClient.joinShop(shop._id, user._id);

    const handleItemChange = ({ type, item, userId }) => {
      console.log('Received item change:', { type, item, userId });

      if (userId !== user._id) {
        console.log('Updating data for type:', type);
        queryClient.setQueryData(['items', shop._id], (oldData) => {
          if (!oldData) {
            return [item];
          }

          switch (type) {
            case 'updated':
              return oldData.map((oldItem) => (oldItem._id === item._id ? item : oldItem));
            case 'added':
              return [...oldData, item];
            case 'deleted':
              return oldData.filter((oldItem) => oldItem._id !== item._id);
            default:
              return oldData;
          }
        });
      }
    };

    socketClient.socket?.on('itemChange', handleItemChange);

    return () => {
      console.log('Cleaning up socket connection');
      socketClient.socket?.off('itemChange', handleItemChange);
      socketClient.disconnect();
    };
  }, [shop._id, user._id, queryClient]);
}
