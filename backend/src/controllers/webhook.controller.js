const config = require('../config');
const metaGraphService = require('../services/metaGraphService');
const leadProcessingService = require('../services/leadProcessingService');
const socketService = require('../services/socketService');

// Meta webhook handshake verification (GET /webhooks/meta)
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const verifyToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!mode || !verifyToken) {
    return res.status(400).send('Missing hub.mode or hub.verify_token parameters');
  }

  if (mode === 'subscribe' && verifyToken === config.meta.verifyToken) {
    console.log('[webhook] Handshake verified with Meta');
    return res.status(200).send(challenge);
  }

  console.warn('[webhook] Verification token mismatch');
  return res.status(403).send('Forbidden: Verification token mismatch');
};

// Background task to fetch lead from Graph API, persist, and emit via Socket.IO
const processLeadEventAsync = async (leadgenId, metadata) => {
  try {
    // 1. Fetch full details from Meta Graph API
    let graphData;
    try {
      graphData = await metaGraphService.getLeadDetails(leadgenId);
    } catch (graphErr) {
      console.error(`[lead-pipeline] Graph API fetch failed for ${leadgenId}:`, graphErr.message);
      return;
    }

    // 2. Normalize fields into standard format
    const normalized = leadProcessingService.normalizeLeadData(graphData, metadata);

    // 3. Save to MongoDB (handles deduplication)
    const { lead, isNew } = await leadProcessingService.persistLead(normalized);

    // 4. Only broadcast over socket if this is a genuinely new lead
    if (isNew) {
      socketService.broadcastNewLead(lead);
      console.log(`[lead-pipeline] Broadcasted new lead ${lead.leadId} (${lead.name})`);
    } else {
      console.log(`[lead-pipeline] Duplicate lead ${lead.leadId} ignored`);
    }
  } catch (err) {
    console.error(`[lead-pipeline] Error processing lead ${leadgenId}:`, err.message);
  }
};

// Meta webhook event receiver (POST /webhooks/meta)
const handleWebhookEvent = (req, res) => {
  const body = req.body;

  if (!body || body.object !== 'page') {
    return res.status(404).json({ success: false, error: 'Expected object: page' });
  }

  // Acknowledge immediately to avoid Meta delivery timeouts
  res.status(200).send('EVENT_RECEIVED');

  if (!Array.isArray(body.entry)) return;

  body.entry.forEach(entry => {
    const pageId = entry.id;
    const changes = entry.changes;

    if (!Array.isArray(changes)) return;

    changes.forEach(change => {
      if (change.field === 'leadgen' && change.value) {
        const val = change.value;
        const leadgenId = val.leadgen_id;

        if (!leadgenId) return;

        const metadata = {
          page_id: pageId || val.page_id,
          form_id: val.form_id,
          ad_id: val.ad_id,
          created_time: val.created_time
        };

        // Hand off to async pipeline
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
