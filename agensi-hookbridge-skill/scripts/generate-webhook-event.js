#!/usr/bin/env node

const crypto = require('crypto');

function generateWebhookEvent(leadgenId = 'lead_' + Date.now(), secret = 'test_secret_123') {
  const timestamp = Math.floor(Date.now() / 1000);

  const payload = {
    object: 'page',
    entry: [
      {
        id: '1029384756',
        time: timestamp,
        changes: [
          {
            field: 'leadgen',
            value: {
              ad_id: 'ad_4455667788',
              form_id: 'form_9988776655',
              leadgen_id: String(leadgenId),
              created_time: timestamp,
              page_id: '1029384756'
            }
          }
        ]
      }
    ]
  };

  const rawBody = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const signature = 'sha256=' + hmac.digest('hex');

  return {
    payload,
    rawBody,
    signature,
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature
    }
  };
}

if (require.main === module) {
  const leadId = process.argv[2] || 'sim_' + Date.now();
  const secret = process.argv[3] || 'test_meta_app_secret_123456';

  const event = generateWebhookEvent(leadId, secret);

  console.log('Generated Meta Lead Ads Webhook Event');
  console.log('-------------------------------------');
  console.log('Signature Header:', event.signature);
  console.log('Payload JSON:');
  console.log(JSON.stringify(event.payload, null, 2));
}

module.exports = {
  generateWebhookEvent
};
