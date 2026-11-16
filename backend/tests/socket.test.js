const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const socketService = require('../src/services/socketService');

describe('Socket.IO Real-Time Gateway Tests', () => {
  let server;
  let clientSocket;
  let port;

  beforeAll(done => {
    server = http.createServer(app);
    socketService.init(server, '*');
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll(done => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    server.close(done);
  });

  it('should allow a client to connect and receive initial connected event', done => {
    clientSocket = Client(`http://localhost:${port}`);

    clientSocket.on('connected', data => {
      expect(data).toBeDefined();
      expect(data.message).toContain('Connected to HookBridge');
      expect(socketService.getConnectedCount()).toBeGreaterThan(0);
      done();
    });
  });

  it('should deliver new_lead event to connected client when broadcastNewLead is called', done => {
    const mockLead = {
      _id: 'mongo_id_555',
      leadId: 'meta_realtime_lead_999',
      name: 'Diana Prince',
      email: 'diana@themyscira.gov',
      phone: '+1-555-WONDER',
      fieldData: [],
      pageId: 'page_123',
      formId: 'form_456',
      submittedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      source: 'Meta Lead Ads',
      isTestLead: false
    };

    clientSocket.on('new_lead', payload => {
      expect(payload).toBeDefined();
      expect(payload.event).toBe('new_lead');
      expect(payload.leadId).toBe('meta_realtime_lead_999');
      expect(payload.lead.name).toBe('Diana Prince');
      expect(payload.lead.email).toBe('diana@themyscira.gov');
      done();
    });

    // Broadcast the lead
    socketService.broadcastNewLead(mockLead);
  });
});
