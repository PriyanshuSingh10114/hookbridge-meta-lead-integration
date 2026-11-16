const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedSockets = new Set();
  }

  /**
   * Initialize Socket.IO instance attached to the Express HTTP server
   * @param {import('http').Server} httpServer
   * @param {string|string[]} corsOrigin
   */
  init(httpServer, corsOrigin = '*') {
    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', socket => {
      this.connectedSockets.add(socket.id);
      console.log(
        `[SOCKET] Client connected: ${socket.id} (Total active clients: ${this.connectedSockets.size})`
      );

      // Send initial acknowledgement to the connected client
      socket.emit('connected', {
        message: 'Connected to HookBridge Real-Time Lead Gateway',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      socket.on('disconnect', reason => {
        this.connectedSockets.delete(socket.id);
        console.log(
          `[SOCKET] Client disconnected: ${socket.id} (Reason: ${reason}). Remaining active: ${this.connectedSockets.size}`
        );
      });

      socket.on('error', err => {
        console.error(`[SOCKET ERROR] Socket ${socket.id}:`, err.message);
      });
    });

    console.log('[SOCKET] Socket.IO server initialized successfully');
    return this.io;
  }

  /**
   * Broadcast a newly persisted lead to all connected clients
   * @param {Object} lead - Normalized and persisted Lead document
   */
  broadcastNewLead(lead) {
    if (!this.io) {
      console.warn('[SOCKET WARNING] Cannot broadcast lead: Socket.IO not initialized');
      return false;
    }

    const payload = {
      event: 'new_lead',
      leadId: lead.leadId,
      lead: {
        id: lead._id,
        leadId: lead.leadId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        fieldData: lead.fieldData,
        pageId: lead.pageId,
        formId: lead.formId,
        submittedAt: lead.submittedAt,
        receivedAt: lead.receivedAt,
        source: lead.source,
        isTestLead: lead.isTestLead
      },
      timestamp: new Date().toISOString()
    };

    this.io.emit('new_lead', payload);
    console.log(
      `[SOCKET BROADCAST] Emitted 'new_lead' for leadId=${lead.leadId} to ${this.connectedSockets.size} active client(s)`
    );
    return true;
  }

  /**
   * Get count of currently connected clients
   */
  getConnectedCount() {
    return this.connectedSockets.size;
  }
}

// Export singleton instance
module.exports = new SocketService();
