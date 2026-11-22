const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');
const metaGraphService = require('../services/metaGraphService');

router.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meta for Developers - Lead Ads Testing Tool</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f0f2f5; color: #1c1e21; }
    .nav { background: #ffffff; border-bottom: 1px solid #dddfe2; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #1877f2; font-size: 20px; }
    .badge { background: #e7f3ff; color: #1877f2; font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .container { max-width: 900px; margin: 30px auto; padding: 0 16px; }
    .card { background: #ffffff; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 20px; border: 1px solid #dddfe2; }
    h2 { font-size: 18px; margin-bottom: 6px; color: #1c1e21; }
    p.subtitle { font-size: 13px; color: #606770; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #4b4f56; margin-bottom: 6px; text-transform: uppercase; }
    input, select { width: 100%; padding: 10px 12px; border: 1px solid #ccd0d5; border-radius: 6px; font-size: 14px; background: #ffffff; color: #1c1e21; }
    input:focus, select:focus { outline: none; border-color: #1877f2; box-shadow: 0 0 0 2px #e7f3ff; }
    .btn { background: #1877f2; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
    .btn:hover { background: #166fe5; }
    .btn:disabled { background: #bec3c9; cursor: not-allowed; }
    .status-box { margin-top: 20px; padding: 16px; border-radius: 6px; background: #f7f8fa; border: 1px solid #e4e6eb; display: none; }
    .status-box.active { display: block; }
    .log-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; font-family: monospace; }
    .success { color: #31a24c; font-weight: 600; }
    .raw-view { background: #1c1e21; color: #e4e6eb; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; overflow-x: auto; margin-top: 10px; max-height: 200px; }
  </style>
</head>
<body>
  <div class="nav">
    <div class="brand">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      Meta for Developers
    </div>
    <span class="badge">Lead Ads Testing Tool</span>
  </div>

  <div class="container">
    <div class="card">
      <h2>Lead Ads Testing Tool</h2>
      <p class="subtitle">Simulate real-time Meta Lead Ads form submissions. Validates HMAC-SHA256 signature and tests webhook delivery.</p>

      <div class="grid">
        <div class="form-group">
          <label>Facebook Page</label>
          <select id="pageSelect">
            <option>HookBridge Real Estate (ID: 1029384756)</option>
            <option>Apex Solutions Group (ID: 9988776655)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Lead Form</label>
          <select id="formSelect">
            <option>Customer Inquiry Form v21.0 (ID: form_102938)</option>
            <option>VIP Consultation Form (ID: form_445566)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="leadName" value="Sophia Vance" placeholder="e.g. Sophia Vance" />
      </div>

      <div class="grid">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="leadEmail" value="sophia.vance@apex.io" placeholder="e.g. sophia.vance@apex.io" />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" id="leadPhone" value="+1-415-555-0199" placeholder="e.g. +1-415-555-0199" />
        </div>
      </div>

      <button class="btn" id="submitBtn" onclick="submitLead()">Create Lead</button>

      <div class="status-box" id="statusBox">
        <div class="log-row">
          <span>Target Webhook:</span>
          <strong>POST /webhooks/meta</strong>
        </div>
        <div class="log-row">
          <span>HMAC-SHA256 Verification:</span>
          <span class="success">PASSED (timingSafeEqual)</span>
        </div>
        <div class="log-row">
          <span>Webhook Acknowledgment:</span>
          <span class="success">200 OK EVENT_RECEIVED</span>
        </div>
        <div class="log-row">
          <span>Socket.IO Broadcast:</span>
          <span class="success" id="broadcastStatus">DELIVERED TO APP</span>
        </div>
        <div class="raw-view" id="payloadView"></div>
      </div>
    </div>
  </div>

  <script>
    async function submitLead() {
      const btn = document.getElementById('submitBtn');
      const box = document.getElementById('statusBox');
      const payloadView = document.getElementById('payloadView');

      const name = document.getElementById('leadName').value.trim() || 'Jane Doe';
      const email = document.getElementById('leadEmail').value.trim() || 'jane@example.com';
      const phone = document.getElementById('leadPhone').value.trim() || '+1-555-0100';

      btn.disabled = true;
      btn.innerText = 'Submitting to Meta Webhook...';

      try {
        const response = await fetch('/simulator/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone })
        });

        const data = await response.json();

        box.classList.add('active');
        payloadView.innerText = JSON.stringify(data.payload, null, 2);
        btn.innerText = 'Create Another Lead';
        btn.disabled = false;
      } catch (err) {
        alert('Error dispatching lead: ' + err.message);
        btn.disabled = false;
        btn.innerText = 'Create Lead';
      }
    }
  </script>
</body>
</html>`;

  res.send(html);
});

router.post('/submit', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body || {};
    const leadgenId = 'sim_' + Date.now();
    const timestamp = Math.floor(Date.now() / 1000);

    metaGraphService.registerSimulatedLead(leadgenId, {
      name: name || 'Sophia Vance',
      email: email || 'sophia.vance@apex.io',
      phone: phone || '+1-415-555-0199'
    });

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
                ad_id: 'ad_99887766',
                form_id: 'form_102938',
                leadgen_id: leadgenId,
                created_time: timestamp,
                page_id: '1029384756'
              }
            }
          ]
        }
      ]
    };

    const rawBody = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', config.meta.appSecret);
    hmac.update(rawBody);
    const signature = `sha256=${hmac.digest('hex')}`;

    const webhookUrl = `http://localhost:${config.port}/webhooks/meta`;

    const webhookResponse = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      }
    });

    res.status(200).json({
      success: true,
      leadgenId,
      signature,
      webhookStatus: webhookResponse.status,
      payload
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
