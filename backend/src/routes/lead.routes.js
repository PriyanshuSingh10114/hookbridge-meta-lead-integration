const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');

// GET /api/leads - Paginated leads list
router.get('/leads', leadController.getLeads);

// POST /api/leads/test - Create & broadcast real-time test lead
router.post('/leads/test', leadController.createTestLead);

// GET /api/leads/:id - Single lead details
router.get('/leads/:id', leadController.getLeadById);

module.exports = router;

