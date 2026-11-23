const express = require('express');
const crypto = require('crypto');

const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

const verifyWebhookSignature = (req, res, next) => {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return next();
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) {
    return res.status(401).json({ error: 'Missing X-Hub-Signature-256 header' });
  }

  const [prefix, signature] = signatureHeader.split('=');
  if (prefix !== 'sha256' || !signature) {
    return res.status(401).json({ error: 'Invalid signature format' });
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    return res.status(400).json({ error: 'Missing raw payload buffer' });
  }

  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return res.status(403).json({ error: 'Invalid webhook signature' });
  }

  next();
};

app.get('/webhooks/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden: Token mismatch');
});

app.post('/webhooks/meta', verifyWebhookSignature, (req, res) => {
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  if (body?.object === 'page' && Array.isArray(body.entry)) {
    body.entry.forEach(entry => {
      entry.changes?.forEach(change => {
        if (change.field === 'leadgen' && change.value?.leadgen_id) {
          const leadgenId = change.value.leadgen_id;
          console.log('Async Leadgen Event Captured:', leadgenId);
        }
      });
    });
  }
});

module.exports = app;
