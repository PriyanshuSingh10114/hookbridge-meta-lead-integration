const crypto = require('crypto');
const config = require('../config');
const { MetaGraphService } = require('../services/metaGraphService');
const webhookController = require('./webhook.controller');

const renderSimulatorPage = (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meta for Developers | Lead Ads Testing Tool</title>
  <style>
    html, body, div, p, span, form, input, select, button, h2 { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #F0F2F5; color: #1C1E21; min-height: 100vh; }
    .nav-bar { background-color: #0866FF; color: #FFFFFF; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .nav-left { display: flex; align-items: center; gap: 12px; }
    .meta-logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .nav-title { font-size: 15px; color: #E4E6EB; font-weight: 500; border-left: 1px solid rgba(255,255,255,0.3); padding-left: 12px; }
    .nav-badge { background-color: rgba(255,255,255,0.2); font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    
    .container { max-width: 960px; margin: 28px auto; padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .container { grid-template-columns: 1fr; } }
    
    .card { background: #FFFFFF; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; border: 1px solid #CED0D4; }
    .card-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: #050505; }
    .card-desc { font-size: 13px; color: #65676B; margin-bottom: 20px; line-height: 1.4; }
    
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #050505; margin-bottom: 6px; }
    select, input { width: 100%; padding: 10px 12px; border: 1px solid #CED0D4; border-radius: 6px; font-size: 14px; color: #1C1E21; background: #FFFFFF; outline: none; }
    select:focus, input:focus { border-color: #0866FF; box-shadow: 0 0 0 2px rgba(8,102,255,0.2); }
    
    .btn-primary { width: 100%; background: #0866FF; color: #FFFFFF; border: none; padding: 12px; border-radius: 6px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s ease; margin-top: 8px; }
    .btn-primary:hover { background: #0055D6; }
    .btn-primary:active { transform: scale(0.99); }
    
    .log-box { background: #18191A; border-radius: 6px; color: #E4E6EB; padding: 16px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; font-size: 12px; min-height: 280px; max-height: 380px; overflow-y: auto; line-height: 1.5; }
    .log-entry { margin-bottom: 8px; word-break: break-all; }
    .log-timestamp { color: #8A8D91; }
    .log-success { color: #31A24C; font-weight: 600; }
    .log-info { color: #2D88FF; }
    .log-warning { color: #F5C33B; }
    
    .status-banner { margin-top: 16px; padding: 12px 14px; border-radius: 6px; background: #E7F3FF; border: 1px solid #1877F2; display: flex; align-items: center; justify-content: space-between; }
    .status-text { font-size: 13px; color: #1877F2; font-weight: 600; }
    .status-indicator { width: 10px; height: 10px; border-radius: 50%; background: #31A24C; display: inline-block; margin-right: 6px; animation: pulse 2s infinite; }
    
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
  </style>
</head>
<body>
  <div class="nav-bar">
    <div class="nav-left">
      <span class="meta-logo">∞ Meta</span>
      <span class="nav-title">Lead Ads Testing Tool</span>
    </div>
    <span class="nav-badge">Simulator Engine v21.0</span>
  </div>

  <div class="container">
    <div class="card">
      <h2 class="card-title">Create Test Lead</h2>
      <p class="card-desc">Simulate a customer submitting a Meta Lead Ad form. The signed webhook notification will immediately dispatch to your HookBridge server.</p>

      <form id="leadForm">
        <div class="form-group">
          <label>Facebook Page</label>
          <select id="pageSelect">
            <option value="1029384756">HookBridge Official Page (ID: 1029384756)</option>
            <option value="2048591823">Nexus Enterprise Solutions (ID: 2048591823)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Lead Ad Form</label>
          <select id="formSelect">
            <option value="form_11223344">Consultation & Contact Form (ID: form_11223344)</option>
            <option value="form_99887766">Product Demo Request Form (ID: form_99887766)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="nameInput" value="Marcus Vance" required>
        </div>

        <div class="form-group">
          <label>Work Email</label>
          <input type="email" id="emailInput" value="marcus.vance@apexlogistics.com" required>
        </div>

        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" id="phoneInput" value="+1-415-555-0198" required>
        </div>

        <button type="submit" class="btn-primary" id="submitBtn">Create & Dispatch Lead</button>
      </form>

      <div class="status-banner">
        <span class="status-text"><span class="status-indicator"></span> Webhook Ingress: /webhooks/meta</span>
        <span style="font-size: 11px; color: #65676B;">Port 5000</span>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Live Webhook Log</h2>
      <p class="card-desc">Monitors cryptographic signature generation, HTTP webhook acknowledgment, and Socket.IO broadcast.</p>

      <div class="log-box" id="logBox">
        <div class="log-entry">
          <span class="log-timestamp">[System Ready]</span> Simulator initialized. Keep your React Native app open side-by-side to observe real-time updates.
        </div>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('leadForm');
    const logBox = document.getElementById('logBox');
    const submitBtn = document.getElementById('submitBtn');

    function log(message, type = 'info') {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      const time = new Date().toLocaleTimeString();
      let colorClass = 'log-info';
      if (type === 'success') colorClass = 'log-success';
      if (type === 'warning') colorClass = 'log-warning';
      
      entry.innerHTML = '<span class="log-timestamp">[' + time + ']</span> <span class="' + colorClass + '">' + message + '</span>';
      logBox.appendChild(entry);
      logBox.scrollTop = logBox.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.innerText = 'Signing & Dispatching...';

      const payload = {
        name: document.getElementById('nameInput').value.trim(),
        email: document.getElementById('emailInput').value.trim(),
        phone: document.getElementById('phoneInput').value.trim(),
        pageId: document.getElementById('pageSelect').value,
        formId: document.getElementById('formSelect').value
      };

      log('Constructing Meta webhook payload for lead: ' + payload.name, 'info');

      try {
        const response = await fetch('/api/simulator/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
          log('Generated HMAC-SHA256: ' + data.signature.substring(0, 28) + '...', 'info');
          log('Webhook dispatched: POST /webhooks/meta (200 OK EVENT_RECEIVED)', 'success');
          log('Backend Pipeline: Lead ' + data.leadgenId + ' saved to MongoDB', 'success');
          log('Socket.IO: Emitted "new_lead" -> Check React Native Dashboard!', 'success');
        } else {
          log('Error: ' + (data.error || 'Failed to dispatch lead'), 'warning');
        }
      } catch (err) {
        log('Connection error: ' + err.message, 'warning');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create & Dispatch Lead';
      }
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};

const submitSimulatedLead = async (req, res, next) => {
  try {
    const { name, email, phone, company, formId, pageId } = req.body || {};
    const leadgenId = 'sim_' + Date.now();

    MetaGraphService.mockLeads.set(leadgenId, {
      id: leadgenId,
      created_time: Math.floor(Date.now() / 1000),
      form_id: formId || 'form_11223344',
      ad_id: 'ad_99887766',
      field_data: [
        { name: 'full_name', values: [name] },
        { name: 'email', values: [email] },
        { name: 'phone_number', values: [phone] },
        { name: 'company_name', values: [company] }
      ]
    });

    const webhookPayload = {
      object: 'page',
      entry: [
        {
          id: pageId || '1029384756',
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: 'leadgen',
              value: {
                ad_id: 'ad_99887766',
                form_id: formId || 'form_11223344',
                leadgen_id: leadgenId,
                created_time: Math.floor(Date.now() / 1000),
                page_id: pageId || '1029384756'
              }
            }
          ]
        }
      ]
    };

    const rawBody = Buffer.from(JSON.stringify(webhookPayload));
    const hmac = crypto.createHmac('sha256', config.meta.appSecret);
    hmac.update(rawBody);
    const signature = `sha256=${hmac.digest('hex')}`;

    webhookController.processLeadEventAsync(leadgenId, {
      page_id: pageId || '1029384756',
      form_id: formId || 'form_11223344',
      ad_id: 'ad_99887766',
      created_time: Math.floor(Date.now() / 1000)
    });

    res.status(200).json({
      success: true,
      leadgenId,
      signature,
      message: 'Simulated lead webhook processed and broadcasted',
      data: {
        name: name || 'Marcus Vance',
        email: email || 'marcus.vance@apexlogistics.com',
        phone: phone || '+1-415-555-0198'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderSimulatorPage,
  submitSimulatedLead
};
