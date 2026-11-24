const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');

router.get('/leads', leadController.getLeads);
router.post('/leads/test', leadController.createTestLead);
router.get('/leads/:id', leadController.getLeadById);
router.patch('/leads/:id', leadController.updateLeadStatus);
router.patch('/leads/:id/status', leadController.updateLeadStatus);

module.exports = router;
