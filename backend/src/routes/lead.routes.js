const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');

// GET /api/leads - Paginated leads list
router.get('/leads', leadController.getLeads);

// GET /api/leads/:id - Single lead details
router.get('/leads/:id', leadController.getLeadById);

module.exports = router;
