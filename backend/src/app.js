const express = require('express');
const cors = require('cors');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const leadRoutes = require('./routes/lead.routes');
const webhookRoutes = require('./routes/webhook.routes');
const simulatorRoutes = require('./routes/simulator.routes');

const app = express();

app.use(
  cors({
    origin: config.cors.origin === '*' ? true : config.cors.origin,
    credentials: true
  })
);

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use('/api', healthRoutes);
app.use('/api', leadRoutes);
app.use('/webhooks', webhookRoutes);
app.use(simulatorRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorHandler);

module.exports = app;
