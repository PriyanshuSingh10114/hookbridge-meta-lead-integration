const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulator.controller');

router.get('/simulator', simulatorController.renderSimulatorPage);
router.post('/api/simulator/submit', simulatorController.submitSimulatedLead);

module.exports = router;
