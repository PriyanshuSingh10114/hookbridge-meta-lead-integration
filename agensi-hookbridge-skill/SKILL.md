---
name: hookbridge-meta-leads
description: Configure, integrate, test, and troubleshoot secure real-time Meta Lead Ads workflows using Node.js, Express, MongoDB, Socket.IO, and React Native.
---

# HookBridge: Meta Lead Ads Real-Time Integration Skill

## A. Purpose

This skill guides AI coding agents (and developers) through configuring, integrating, testing, and debugging an end-to-end real-time lead synchronization pipeline connecting **Meta Lead Ads** to a **Node.js / Express backend**, persisting to **MongoDB**, and streaming instantly to **React Native** mobile applications over **Socket.IO**.

Meta Lead Ads generate high-intent customer inquiries. However:
1. Meta webhook notifications deliver only an event pointer (`leadgen_id`), not the submitted contact data (for privacy and transport efficiency).
2. Meta enforces a strict 20-second timeout on webhook callbacks.
3. Network retries require race-condition-proof idempotency.
4. Cryptographic HMAC-SHA256 signatures must be verified against raw byte streams to prevent tampering.

This skill equips agents with the exact architectural patterns, code modules, security controls, and diagnostic procedures to implement this pipeline correctly without common pitfalls.

---

## B. When to Use This Skill

Activate this skill whenever a user or task asks to:
- Connect Meta Lead Ads (Facebook / Instagram Lead Ads) to a Node.js / Express backend.
- Set up Meta Webhook subscription verification (`hub.challenge` handshake).
- Implement cryptographic `X-Hub-Signature-256` HMAC validation for inbound Meta payloads.
- Retrieve full customer contact details via Meta Graph API v21.0 using `leadgen_id`.
- Map dynamic Meta `field_data` arrays into canonical application models (Name, Email, Phone, Form answers).
- Persist lead data in MongoDB with idempotent deduplication.
- Push real-time lead updates to React Native, web, or desktop clients using Socket.IO without manual refresh.
- Troubleshoot Meta Graph API error codes (e.g. 190 expired tokens, 200 permission errors, 4/17/32/613 rate limits).
- Test Meta Lead Ads pipelines locally without a live Facebook advertising budget using the Meta Lead Ads Testing Tool or local simulation scripts.

---

## C. Prerequisites

Before running or deploying the integration, ensure the following are available:

1. **Runtime Environment**:
   - Node.js `v18.x` or `v22.x` and `npm` `v9.x+`.
   - Local MongoDB instance (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.
2. **Meta Developer Platform**:
   - A Meta Developer Account ([developers.facebook.com](https://developers.facebook.com/)).
   - A Meta App of type **Business**.
   - A Facebook Page where Lead Ad forms are hosted.
   - **Permissions**: `leads_retrieval`, `pages_manage_ads`, `pages_show_list`.
   - A **Page Access Token** (User tokens will fail with permissions errors).
3. **Network Ingress (for live webhook callbacks)**:
   - A publicly routable HTTPS endpoint (e.g. `ngrok`, Cloudflare Tunnel, or cloud host) forwarded to the backend port.
4. **Mobile Development (Optional)**:
   - React Native with Expo SDK 52 (or bare React Native 0.76+).

---

## D. Supported Workflows

### 1. Inspecting the Target Application
- Review the host application's Express configuration.
- Check if body-parser preserves the raw byte buffer (`req.rawBody`). If standard `express.json()` is used without the `verify` option, HMAC verification will fail.

### 2. Dependency Setup
Install required backend packages:
```bash
npm install express cors dotenv mongoose socket.io axios
npm install --save-dev nodemon jest supertest
```
For React Native clients:
```bash
npx expo install socket.io-client axios
```

### 3. Environment Variable Configuration
Configure `.env` with required credentials:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hookbridge
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_custom_verification_token
META_PAGE_ACCESS_TOKEN=EAAB...
META_GRAPH_API_VERSION=v21.0
CLIENT_URL=*
```

### 4. Setting up Meta Webhook Handshake (`GET /webhooks/meta`)
Implement the verification handshake required by Meta:
```javascript
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden: Token mismatch');
};
```

### 5. Verifying Incoming Webhook Signatures (`POST /webhooks/meta`)
Capture raw body in Express and compare HMAC-SHA256 in constant time:
```javascript
const crypto = require('crypto');

const verifyWebhookSignature = (req, res, next) => {
  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) return res.status(401).json({ error: 'Missing signature' });

  const [prefix, signature] = signatureHeader.split('=');
  if (prefix !== 'sha256' || !signature) return res.status(401).json({ error: 'Invalid format' });

  const rawBody = req.rawBody;
  if (!rawBody) return res.status(400).json({ error: 'Missing raw body' });

  const hmac = crypto.createHmac('sha256', process.env.META_APP_SECRET);
  hmac.update(rawBody);
  const expected = hmac.digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }
  next();
};
```

### 6. Immediate Acknowledgment & Asynchronous Execution
Acknowledge Meta within 50ms to prevent delivery timeouts, then process asynchronously:
```javascript
const handleWebhookEvent = (req, res) => {
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  if (body.object !== 'page' || !Array.isArray(body.entry)) return;

  body.entry.forEach(entry => {
    entry.changes?.forEach(change => {
      if (change.field === 'leadgen' && change.value?.leadgen_id) {
        processLeadAsync(change.value.leadgen_id, change.value);
      }
    });
  });
};
```

### 7. Retrieving Lead Data from Graph API
Call `GET https://graph.facebook.com/v21.0/{leadgen_id}`:
```javascript
const response = await axios.get(`https://graph.facebook.com/v21.0/${leadgenId}`, {
  params: {
    fields: 'id,created_time,field_data,form_id,ad_id,adset_id,campaign_id',
    access_token: process.env.META_PAGE_ACCESS_TOKEN
  },
  timeout: 10000
});
```

### 8. Lead Data Normalization
Extract canonical `name`, `email`, and `phone` from Meta's dynamic `field_data` key-value pairs:
- Detect composite names (`first_name` + `last_name`).
- Detect test leads (`is_test: true`, email containing `test`, or name containing `test lead`).
- Preserve raw `field_data` array for custom form inquiries.

### 9. MongoDB Idempotent Persistence
Use a unique index on `{ leadId: 1 }`. Check before write, and catch MongoDB error `11000` to prevent duplicate key race conditions.

### 10. Socket.IO Event Broadcasting
Emit the `new_lead` event to all connected clients only when `isNew === true`:
```javascript
io.emit('new_lead', {
  event: 'new_lead',
  leadId: lead.leadId,
  lead: lead,
  timestamp: new Date().toISOString()
});
```

### 11. Connecting the React Native Client
- Establish Socket.IO client connection.
- Maintain a synchronous `seenLeadIdsRef = useRef(new Set())` to prevent duplicate renders from rapid events.
- On mount, fetch existing leads via REST (`GET /api/leads`).
- Prepend new incoming leads to state dynamically without requiring manual refresh.

### 12. Testing the Pipeline
- **Offline / Local**: Run `scripts/generate-webhook-event.js` to post a signed webhook payload to `http://localhost:5000/webhooks/meta`.
- **Online**: Expose port 5000 via ngrok, subscribe `leadgen` in Meta Developer Portal, and submit leads using the [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing).

### 13. Troubleshooting Failures
Diagnose token expiration (code 190), permission issues (code 200), rate limits (code 4), or network timeout using the included diagnostic matrix.

---

## E. Tool Usage

An AI agent using this skill interacts with the user's project through standard development tools:

| Tool / Capability | Agent Responsibility |
|---|---|
| **Terminal / Shell** | Run `npm install`, start dev servers (`npm run dev`), execute test suites (`npm test`), and run CLI simulation scripts. |
| **File Read / Edit** | Inspect Express routes, middleware chains, schemas, and configure `.env` files safely. |
| **Node.js Crypto** | Compute SHA-256 HMACs and constant-time comparisons for webhook authentication. |
| **Axios / HTTP** | Execute Graph API v21.0 queries and test webhook endpoints. |
| **Mongoose** | Define schemas with unique compound indexes and handle duplicate collisions. |
| **Socket.IO** | Configure bi-directional gateways and client reconnection backoff. |

> [!NOTE]
> This skill operates purely on the developer's local or cloud environment. Agensi does not host databases, generate Meta tokens, or store customer PII.

---

## F. Security Rules

The AI agent must strictly enforce the following security practices:

1. **Zero Secret Leakage**:
   - Never print raw `META_APP_SECRET` or `META_PAGE_ACCESS_TOKEN` values in console logs, responses, or artifacts. Use masking (e.g. `EAAB...xyz`).
   - Never commit `.env` files into source control.
2. **Byte-for-Byte Raw Body Verification**:
   - Never compute HMAC signatures against re-stringified JSON (`JSON.stringify(req.body)`) in production. Always capture `req.rawBody` buffer directly from Express parser.
3. **Timing-Safe Equality**:
   - Always compare signature buffers using `crypto.timingSafeEqual()`. Standard string equality (`===`) is vulnerable to timing side-channel attacks.
4. **Credential Isolation**:
   - Never expose Meta App Secret or Page Access Tokens to frontend or mobile client bundles. All Meta Graph API calls must remain strictly backend-to-backend.
5. **PII Protection**:
   - In production environments, apply field-level encryption for customer PII (names, emails, phone numbers) stored in MongoDB.

---

## G. Troubleshooting Quick Matrix

| Symptom | Root Cause | Verification & Fix |
|---|---|---|
| Webhook handshake returns 403 | `hub.verify_token` mismatch | Ensure `META_VERIFY_TOKEN` in `.env` matches the token entered in Meta Webhooks dashboard. |
| POST `/webhooks/meta` returns 403 | Invalid HMAC signature | Verify `META_APP_SECRET`. Check that Express captures `req.rawBody` buffer before body parsing. |
| Meta marks webhook as failed | Timeout (> 20 seconds) | Ensure server responds `200 OK EVENT_RECEIVED` immediately before invoking the Graph API fetch. |
| Graph API returns Error Code 190 | Page Token expired or invalidated | Re-generate Page Access Token in Meta Graph API Explorer with `leads_retrieval` permission. |
| Graph API returns Error Code 200 | Insufficient permissions | Grant `leads_retrieval`, `pages_manage_ads`, and `pages_show_list` to the token. |
| Leads do not appear on Android Emulator | Wrong backend address | In Android Emulator, use `http://10.0.2.2:5000` (maps to host localhost). `localhost` refers to the device itself. |
| Duplicate lead cards appear | Concurrent webhook deliveries | Ensure MongoDB has a unique index on `{ leadId: 1 }` and client uses a `Set` ref for deduping. |

---

## H. References

For in-depth architectural specifications and implementation guides, refer to:
- [Architecture & Data Flow](references/architecture.md)
- [End-to-End Setup Guide](references/setup-guide.md)
- [Meta Webhooks & HMAC Verification](references/meta-webhooks.md)
- [Meta Graph API Integration (v21.0)](references/graph-api.md)
- [Lead Normalization & MongoDB Persistence](references/lead-processing.md)
- [Socket.IO Real-Time Delivery](references/realtime-delivery.md)
- [Troubleshooting & Diagnostics](references/troubleshooting.md)
- [Security & Compliance Model](references/security.md)
