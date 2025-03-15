// src/socket.js
import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.io = io; // Přidáme referenci na io
  }

  connect(userId) {
    if (this.socket) return;

    try {
      this.socket = this.io('http://localhost:5000', {
        auth: { userId },
        withCredentials: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.connected = true;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.connected = false;
      });
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }

  joinShop(shopId, userId) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected, cannot join shop');
      return;
    }
    console.log('Joining shop:', shopId);
    this.socket.emit('joinShop', { shopId, userId });
  }

  emitItemChange(type, shopId, item) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected, cannot emit change');
      return;
    }
    console.log('Emitting item change:', type, item);
    this.socket.emit('itemChange', {
      type,
      item,
      shopId,
      userId: this.socket.auth.userId,
    });
  }

  onItemChange(callback) {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected, cannot listen for changes');
      return;
    }
    this.socket.on('itemChange', callback);
    console.log('Registered item change listener');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket disconnected');
    }
  }
}

// Vytvoříme a exportujeme jednu instanci
const socketClient = new SocketClient();
export default socketClient;
