const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const WEBHOOK_URL = `http://localhost:${PORT}/webhooks/meta`;
const APP_SECRET = process.env.META_APP_SECRET || 'test_meta_app_secret_123456';

const simulatedLeadgenId = `sim_${Date.now()}`;
const timestamp = Math.floor(Date.now() / 1000);

const testPayload = {
  object: 'page',
  entry: [
    {
      id: '1029384756',
      time: timestamp,
      changes: [
        {
          field: 'leadgen',
          value: {
            ad_id: 'ad_99887766',
            form_id: 'form_11223344',
            leadgen_id: simulatedLeadgenId,
            created_time: timestamp,
            page_id: '1029384756'
          }
        }
      ]
    }
  ]
};

const rawBody = JSON.stringify(testPayload);
const hmac = crypto.createHmac('sha256', APP_SECRET);
hmac.update(rawBody);
const signature = `sha256=${hmac.digest('hex')}`;

async function run() {
  try {
    const res = await axios.post(WEBHOOK_URL, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      }
    });

    console.log(`Webhook sent (${res.status} ${res.data}) - Leadgen ID: ${simulatedLeadgenId}`);
  } catch (err) {
    if (err.response) {
      console.error(`Webhook error (${err.response.status}):`, err.response.data);
    } else {
      console.error('Webhook error:', err.message);
    }
  }
}

run();
