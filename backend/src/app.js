const express = require('express');
const cors = require('cors');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health.routes');
const leadRoutes = require('./routes/lead.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

// Security and CORS
app.use(
  cors({
    origin: config.cors.origin === '*' ? true : config.cors.origin,
    credentials: true
  })
);

// Capture raw body for Meta HMAC signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// API Routes
app.use('/api', healthRoutes);
app.use('/api', leadRoutes);
app.use('/webhooks', webhookRoutes);

// Catch-all 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;

