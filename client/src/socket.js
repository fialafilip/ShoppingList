// src/socket.js
import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.io = io;
    this.pendingJoins = new Set();
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect(userId) {
    if (!userId) {
      console.error('[LOCK] No userId provided for socket connection');
      return Promise.reject(new Error('No userId provided'));
    }

    this.userId = userId;

    if (this.socket) {
      if (this.connected) {
        return Promise.resolve();
      } else {
        console.log('[LOCK] Socket exists but not connected, cleaning up...');
        this.socket.close();
        this.socket = null;
      }
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('[LOCK] Creating socket connection for user:', userId);
        this.socket = this.io('http://localhost:5000', {
          auth: { userId },
          withCredentials: true,
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: this.maxReconnectAttempts,
          timeout: 10000,
        });

        // Set up a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            console.error('[LOCK] Socket connection timeout');
            this.socket.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          console.log('[LOCK] Socket connected successfully');
          this.connected = true;
          this.reconnectAttempts = 0;

          // Rejoin all pending shops
          this.pendingJoins.forEach(({ shopId, userId }) => {
            this.joinShop(shopId, userId);
          });
          this.pendingJoins.clear();

          resolve();
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          console.error('[LOCK] Socket connection error:', error);
          this.connected = false;
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[LOCK] Max reconnection attempts reached');
            reject(error);
          } else {
            console.log(
              `[LOCK] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
            );
            // The socket.io-client will handle reconnection automatically
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[LOCK] Socket disconnected:', reason);
          this.connected = false;

          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            setTimeout(() => {
              console.log('[LOCK] Server initiated disconnect, attempting to reconnect...');
              this.connect(this.userId);
            }, 2000);
          }
        });

        this.socket.on('error', (error) => {
          console.error('[LOCK] Socket error:', error);
          this.connected = false;
        });
      } catch (error) {
        clearTimeout(connectionTimeout);
        console.error('[LOCK] Socket initialization error:', error);
        this.connected = false;
        reject(error);
      }
    });
  }

  joinShop(shopId, userId) {
    if (!shopId || !userId) {
      console.error('[LOCK] Invalid joinShop parameters:', { shopId, userId });
      return;
    }

    if (!this.socket || !this.connected) {
      console.log('[LOCK] Socket not connected, adding to pending joins:', { shopId, userId });
      this.pendingJoins.add({ shopId, userId });
      return;
    }

    console.log('[LOCK] Joining shop:', { shopId, userId });
    this.socket.emit('joinShop', { shopId, userId });
  }

  emitItemChange(type, shopId, data) {
    if (!this.socket || !this.connected) {
      console.warn('[LOCK] Socket not connected, cannot emit change');
      return;
    }

    if (!type || !shopId || !data) {
      console.error('[LOCK] Invalid itemChange parameters:', { type, shopId, data });
      return;
    }

    const payload = {
      type,
      item: {
        ...data,
        userName: data.userName || data.lockedByName,
      },
      shopId,
      userId: data.userId || this.userId,
      userName: data.userName || data.lockedByName,
      familyId: data.familyId,
    };

    console.log('[LOCK] Emitting item change:', {
      type: payload.type,
      itemId: payload.item._id,
      userId: payload.userId,
      userName: payload.userName,
    });
    this.socket.emit('itemChange', payload);
  }

  onItemChange(callback) {
    if (!this.socket) {
      console.warn('[LOCK] Socket not initialized, cannot listen for changes');
      return;
    }
    this.socket.on('itemChange', callback);
    console.log('[LOCK] Registered item change listener');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.pendingJoins.clear();
      this.userId = null;
      this.reconnectAttempts = 0;
    }
  }
}

// Create and export a single instance
const socketClient = new SocketClient();
export default socketClient;
