const crypto = require('crypto');
const config = require('../config');

/**
 * Middleware to verify X-Hub-Signature-256 header sent by Meta.
 * Ensures the payload originated from Meta using the configured META_APP_SECRET.
 */
const verifyWebhookSignature = (req, res, next) => {
  const appSecret = config.meta.appSecret;

  // If no app secret is set (e.g. initial dev setup), warn and proceed
  if (!appSecret) {
    console.warn(
      '[SECURITY WARNING] META_APP_SECRET is not configured. Webhook signature verification skipped.'
    );
    return next();
  }

  const signatureHeader = req.headers['x-hub-signature-256'];

  if (!signatureHeader) {
    console.error('[SECURITY ERROR] Missing X-Hub-Signature-256 header in webhook payload');
    return res.status(401).json({
      success: false,
      error: 'Missing X-Hub-Signature-256 header'
    });
  }

  const [prefix, signature] = signatureHeader.split('=');

  if (prefix !== 'sha256' || !signature) {
    console.error('[SECURITY ERROR] Invalid signature format in X-Hub-Signature-256 header');
    return res.status(401).json({
      success: false,
      error: 'Invalid signature format. Expected sha256=<signature>'
    });
  }

  try {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      console.error('[SECURITY ERROR] Webhook signature mismatch');
      return res.status(403).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Signature verified successfully
    next();
  } catch (err) {
    console.error('[SECURITY ERROR] Error verifying webhook signature:', err.message);
    return res.status(403).json({
      success: false,
      error: 'Failed to verify webhook signature'
    });
  }
};

module.exports = verifyWebhookSignature;
