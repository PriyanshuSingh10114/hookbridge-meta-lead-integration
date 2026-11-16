const mongoose = require('mongoose');
const socketService = require('../services/socketService');
const config = require('../config');

const getHealth = (req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = mongoStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'HookBridge Meta Lead Ads Integration',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbState,
      connected: mongoose.connection.readyState === 1
    },
    realtime: {
      socketClientsConnected: socketService.getConnectedCount()
    },
    metaIntegration: {
      graphApiVersion: config.meta.graphApiVersion,
      hasVerifyToken: Boolean(config.meta.verifyToken),
      hasPageAccessToken: Boolean(config.meta.pageAccessToken),
      hasAppSecret: Boolean(config.meta.appSecret)
    }
  });
};

module.exports = {
  getHealth
};

