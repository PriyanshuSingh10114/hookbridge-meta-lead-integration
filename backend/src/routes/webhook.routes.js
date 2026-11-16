const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const verifyWebhookSignature = require('../middleware/verifyWebhookSignature');

// GET /webhooks/meta - Meta Webhook Handshake Verification
router.get('/meta', webhookController.verifyWebhook);

// POST /webhooks/meta - Meta Webhook Notification with HMAC Signature Verification
router.post('/meta', verifyWebhookSignature, webhookController.handleWebhookEvent);

module.exports = router;

