import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../config/env';

class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to HookBridge real-time backend
   * @param {Object} callbacks
   * @param {Function} callbacks.onConnect
   * @param {Function} callbacks.onDisconnect
   * @param {Function} callbacks.onConnectError
   * @param {Function} callbacks.onNewLead
   */
  connect({ onConnect, onDisconnect, onConnectError, onNewLead } = {}) {
    if (this.socket && this.socket.connected) {
      console.log('[MOBILE SOCKET] Already connected');
      return this.socket;
    }

    console.log(`[MOBILE SOCKET] Connecting to gateway: ${SOCKET_SERVER_URL}`);

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log(`[MOBILE SOCKET CONNECTED] Socket ID: ${this.socket.id}`);
      if (onConnect) onConnect(this.socket.id);
    });

    this.socket.on('disconnect', reason => {
      console.warn(`[MOBILE SOCKET DISCONNECTED] Reason: ${reason}`);
      if (onDisconnect) onDisconnect(reason);
    });

    this.socket.on('connect_error', error => {
      console.error(`[MOBILE SOCKET ERROR] ${error.message}`);
      if (onConnectError) onConnectError(error);
    });

    this.socket.on('new_lead', payload => {
      console.log('[MOBILE SOCKET EVENT] Received new_lead:', payload.leadId);
      if (onNewLead) onNewLead(payload);
    });

    return this.socket;
  }

  /**
   * Disconnect and clear listeners
   */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('[MOBILE SOCKET] Disconnected and cleaned up');
    }
  }

  /**
   * Check if currently connected
   */
  isConnected() {
    return Boolean(this.socket && this.socket.connected);
  }
}

export default new SocketClient();

