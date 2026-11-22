const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const verifyWebhookSignature = require('../middleware/verifyWebhookSignature');

router.get('/meta', webhookController.verifyWebhook);
router.post('/meta', verifyWebhookSignature, webhookController.handleWebhookEvent);

module.exports = router;
