const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedSockets = new Set();
  }

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
      console.log(`[ws] Client connected: ${socket.id} (${this.connectedSockets.size} active)`);

      socket.emit('connected', {
        message: 'Connected to HookBridge Real-Time Lead Gateway',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      socket.on('disconnect', reason => {
        this.connectedSockets.delete(socket.id);
        console.log(`[ws] Client disconnected: ${socket.id} (${reason})`);
      });

      socket.on('error', err => {
        console.error(`[ws] Socket error (${socket.id}):`, err.message);
      });
    });

    return this.io;
  }

  broadcastNewLead(lead) {
    if (!this.io) return false;

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
    return true;
  }

  getConnectedCount() {
    return this.connectedSockets.size;
  }
}

module.exports = new SocketService();
