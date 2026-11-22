const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const socketService = require('./services/socketService');

const server = http.createServer(app);

socketService.init(server, config.cors.origin);

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

const startServer = async () => {
  await connectDatabase();

  server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port} (${config.nodeEnv})`);
    console.log(`Webhook endpoint: http://localhost:${config.port}/webhooks/meta`);
    console.log(`Graph API version: ${config.meta.graphApiVersion}`);
  });
};

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
