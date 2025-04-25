import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketClient from '../socket';

export function useSocketConnection(shop, user) {
  const queryClient = useQueryClient();

  const handleItemChange = useCallback(
    (data) => {
      console.log('[LOCK] Received item change:', {
        type: data.type,
        itemId: data.item._id,
        userId: data.userId,
        userName: data.userName,
        lockedBy: data.item.lockedBy,
        lockedByName: data.item.lockedByName,
      });

      if (data.userId !== user._id) {
        // Get current items
        const currentItems = queryClient.getQueryData(['items', shop._id]) || [];

        let updatedItems;
        switch (data.type) {
          case 'locked':
            updatedItems = currentItems.map((item) =>
              item._id === data.item._id
                ? {
                    ...item,
                    lockedBy: data.userId,
                    lockedByName: data.userName,
                    lockedAt: new Date().toISOString(),
                  }
                : item
            );
            console.log('[LOCK] Item locked by:', data.userName);
            break;
          case 'unlocked':
            updatedItems = currentItems.map((item) =>
              item._id === data.item._id
                ? {
                    ...item,
                    lockedBy: null,
                    lockedByName: null,
                    lockedAt: null,
                  }
                : item
            );
            console.log('[LOCK] Item unlocked by:', data.userName);
            break;
          case 'updated':
            updatedItems = currentItems.map((item) =>
              item._id === data.item._id
                ? {
                    ...data.item,
                    lockedBy: null,
                    lockedByName: null,
                    lockedAt: null,
                  }
                : item
            );
            break;
          case 'added':
            updatedItems = [...currentItems, data.item];
            break;
          case 'deleted':
            updatedItems = currentItems.filter((item) => item._id !== data.item._id);
            break;
          default:
            updatedItems = currentItems;
        }

        // Update the cache immediately
        queryClient.setQueryData(['items', shop._id], updatedItems);
      }
    },
    [user._id, shop._id, queryClient]
  );

  useEffect(() => {
    console.log('[LOCK] Setting up socket connection');

    const setupSocket = async () => {
      try {
        await socketClient.connect(user._id);
        socketClient.joinShop(shop._id, user._id);
        socketClient.onItemChange(handleItemChange);
      } catch (error) {
        console.error('[LOCK] Failed to setup socket:', error);
        setTimeout(() => {
          console.log('[LOCK] Retrying socket connection...');
          setupSocket();
        }, 3000);
      }
    };

    setupSocket();

    return () => {
      if (socketClient.socket) {
        socketClient.socket.off('itemChange', handleItemChange);
        socketClient.disconnect();
      }
    };
  }, [shop._id, user._id, handleItemChange]);
}
