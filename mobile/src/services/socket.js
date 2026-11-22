import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../config/env';

class SocketClient {
  constructor() {
    this.socket = null;
  }

  connect({ onConnect, onDisconnect, onConnectError, onNewLead } = {}) {
    if (this.socket) {
      if (this.socket.connected) return this.socket;
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      if (onConnect) onConnect(this.socket.id);
    });

    this.socket.on('disconnect', reason => {
      if (onDisconnect) onDisconnect(reason);
    });

    this.socket.on('connect_error', error => {
      if (onConnectError) onConnectError(error);
    });

    this.socket.on('new_lead', payload => {
      if (onNewLead) onNewLead(payload);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return Boolean(this.socket && this.socket.connected);
  }
}

export default new SocketClient();

