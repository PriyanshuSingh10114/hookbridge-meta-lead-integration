const config = require('../config');
const metaGraphService = require('../services/metaGraphService');
const leadProcessingService = require('../services/leadProcessingService');
const socketService = require('../services/socketService');

/**
 * Meta Webhook Verification Endpoint (GET /webhooks/meta)
 * Validates hub.mode, hub.verify_token, and responds with hub.challenge
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const verifyToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[WEBHOOK VERIFY] Received verification request: mode=${mode}`);

  if (!mode || !verifyToken) {
    console.warn('[WEBHOOK VERIFY FAILED] Missing hub.mode or hub.verify_token');
    return res.status(400).send('Missing hub.mode or hub.verify_token parameters');
  }

  if (mode === 'subscribe' && verifyToken === config.meta.verifyToken) {
    console.log('[WEBHOOK VERIFY SUCCESS] Verification token matches configured token. Returning challenge.');
    return res.status(200).send(challenge);
  }

  console.warn('[WEBHOOK VERIFY FAILED] Verification token mismatch.');
  return res.status(403).send('Forbidden: Verification token mismatch');
};

/**
 * Asynchronously process a single leadgen event
 * 1. Fetch complete lead data from Meta Graph API
 * 2. Normalize fields (name, email, phone)
 * 3. Persist to MongoDB with duplicate check
 * 4. Broadcast via Socket.IO
 */
const processLeadEventAsync = async (leadgenId, metadata) => {
  try {
    console.log(`[LEAD PIPELINE START] Processing leadgen_id: ${leadgenId}`);

    // Step 1: Retrieve complete lead from Meta Graph API
    let graphData;
    try {
      graphData = await metaGraphService.getLeadDetails(leadgenId);
    } catch (graphErr) {
      console.error(
        `[LEAD PIPELINE ERROR] Failed to fetch leadgen_id=${leadgenId} from Graph API: ${graphErr.message}`
      );
      return;
    }

    // Step 2: Normalize Lead Data
    const normalized = leadProcessingService.normalizeLeadData(graphData, metadata);

    // Step 3: Persist in MongoDB
    const { lead, isNew } = await leadProcessingService.persistLead(normalized);

    // Step 4: Emit real-time Socket.IO event ONLY if newly persisted
    if (isNew) {
      socketService.broadcastNewLead(lead);
      console.log(
        `[LEAD PIPELINE COMPLETE] Successfully processed & broadcasted new lead: ${lead.leadId} (${lead.name})`
      );
    } else {
      console.log(
        `[LEAD PIPELINE SKIP] Lead ${lead.leadId} was already persisted earlier. Broadcast suppressed.`
      );
    }
  } catch (err) {
    console.error(`[LEAD PIPELINE UNCAUGHT ERROR] Error processing leadgen_id=${leadgenId}:`, err);
  }
};

/**
 * Meta Webhook Event Receiver (POST /webhooks/meta)
 * Immediately acknowledges Meta with 200 OK and asynchronously processes lead events
 */
const handleWebhookEvent = (req, res) => {
  const body = req.body;

  // Verify object type is page
  if (body.object !== 'page') {
    console.warn(`[WEBHOOK EVENT] Received event for non-page object: ${body.object}`);
    return res.status(404).json({ success: false, error: 'Expected object: page' });
  }

  // Acknowledge Meta immediately to prevent timeout / retry storms
  res.status(200).send('EVENT_RECEIVED');

  // Process entries
  if (!Array.isArray(body.entry)) {
    console.warn('[WEBHOOK EVENT] Payload missing entry array');
    return;
  }

  body.entry.forEach(entry => {
    const pageId = entry.id;
    const changes = entry.changes;

    if (!Array.isArray(changes)) {
      return;
    }

    changes.forEach(change => {
      if (change.field === 'leadgen' && change.value) {
        const val = change.value;
        const leadgenId = val.leadgen_id;

        if (!leadgenId) {
          console.warn('[WEBHOOK EVENT WARNING] leadgen change missing leadgen_id:', val);
          return;
        }

        const metadata = {
          page_id: pageId || val.page_id,
          form_id: val.form_id,
          ad_id: val.ad_id,
          created_time: val.created_time
        };

        console.log(
          `[WEBHOOK EVENT RECEIVED] New leadgen notification: leadgen_id=${leadgenId}, form_id=${val.form_id}, page_id=${pageId}`
        );

        // Process asynchronously
        module.exports.processLeadEventAsync(leadgenId, metadata);
      }
    });
  });
};

module.exports = {
  verifyWebhook,
  handleWebhookEvent,
  processLeadEventAsync
};
