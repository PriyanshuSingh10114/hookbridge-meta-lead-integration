const crypto = require('crypto');
const config = require('../config');

// Validates Meta's HMAC-SHA256 signature against the raw request body
const verifyWebhookSignature = (req, res, next) => {
  const appSecret = config.meta.appSecret;

  if (!appSecret) {
    console.warn('[webhook-auth] META_APP_SECRET not set, skipping signature check');
    return next();
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) {
    return res.status(401).json({
      success: false,
      error: 'Missing X-Hub-Signature-256 header'
    });
  }

  const [prefix, signature] = signatureHeader.split('=');
  if (prefix !== 'sha256' || !signature) {
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

    // Use constant-time comparison to prevent timing attacks
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Failed to verify webhook signature'
    });
  }
};

module.exports = verifyWebhookSignature;

