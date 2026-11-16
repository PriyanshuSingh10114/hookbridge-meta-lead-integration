const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const socketService = require('./services/socketService');

const server = http.createServer(app);

// Attach Socket.IO to HTTP server
socketService.init(server, config.cors.origin);

// MongoDB connection
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[DATABASE] Connected successfully to MongoDB: ${config.mongoUri}`);
  } catch (err) {
    console.error(`[DATABASE ERROR] Failed to connect to MongoDB (${config.mongoUri}): ${err.message}`);
    console.warn('[DATABASE WARNING] Ensure MongoDB service is running or check MONGODB_URI.');
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DATABASE] MongoDB connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DATABASE] MongoDB connection re-established');
});

// Start HTTP and WebSocket server
const startServer = async () => {
  await connectDatabase();

  server.listen(config.port, () => {
    console.log('====================================================');
    console.log(`  HOOKBRIDGE SERVER RUNNING ON PORT ${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Health Check: http://localhost:${config.port}/api/health`);
    console.log(`  Meta Webhook GET: http://localhost:${config.port}/webhooks/meta`);
    console.log(`  Meta Webhook POST: http://localhost:${config.port}/webhooks/meta`);
    console.log(`  Leads API: http://localhost:${config.port}/api/leads`);
    console.log(`  Graph API Version: ${config.meta.graphApiVersion}`);
    console.log('====================================================');
  });
};

// Graceful shutdown handling
const shutdown = async () => {
  console.log('\n[SERVER] Graceful shutdown initiated...');
  server.close(async () => {
    console.log('[SERVER] HTTP & Socket.IO server closed');
    try {
      await mongoose.connection.close();
      console.log('[DATABASE] MongoDB connection closed');
    } catch (e) {
      console.error('[DATABASE] Error closing MongoDB connection:', e.message);
    }
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (require.main === module) {
  startServer();
}

module.exports = { server, startServer };
