# Loom Video 2: Architecture & Codebase Deep Dive
**Target Duration**: 8 - 10 Minutes  
**Focus**: Code Structure, Design Decisions, Reliability, and Security

---

## 1. Video Outline & Presentation Flow

### 0:00 - 1:15 | Architecture Walkthrough
- **Diagram Reference**: Display `docs/architecture.md` Mermaid diagram.
- **Key Talking Points**:
  - Explain why webhooks notifications don't contain the full lead payload (privacy & size efficiency by Meta).
  - Webhook only contains `leadgen_id` and metadata.
  - Backend acts as an orchestrator: Webhook Receiver -> Signature Validation -> Graph API Fetcher -> Normalizer -> MongoDB -> Socket.IO -> React Native.

---

### 1:15 - 2:30 | Project Structure & Separation of Concerns
- **Show Directory Tree in VS Code / IDE**:
  - `backend/src/config/`: Centralized environment management.
  - `backend/src/models/Lead.js`: Indexed Mongoose schema.
  - `backend/src/middleware/`:
    - `requestLogger.js`: Structured request logging.
    - `verifyWebhookSignature.js`: HMAC-SHA256 signature verification.
    - `errorHandler.js`: Centralized error catching.
  - `backend/src/services/`:
    - `metaGraphService.js`: Meta Graph API client.
    - `leadProcessingService.js`: Data normalization and idempotency.
    - `socketService.js`: Socket.IO singleton instance.
  - `mobile/`: Clean React Native components, hooks, and services.

---

### 2:30 - 4:00 | Webhook Handshake & Signature Verification Deep Dive
- **File to Open**: `backend/src/controllers/webhook.controller.js` and `backend/src/middleware/verifyWebhookSignature.js`.
- **Explain**:
  1. **GET Verification Handshake**:
     ```javascript
     if (mode === 'subscribe' && verifyToken === config.meta.verifyToken) {
       return res.status(200).send(challenge);
     }
     ```
  2. **POST Event Handling & Immediate Response**:
     - Explain why we respond with `200 OK EVENT_RECEIVED` immediately:
     - Meta has a strict 20-second timeout; blocking on external network calls causes Meta to assume failure and retry repeatedly, causing duplicate delivery storms.
  3. **HMAC-SHA256 Signature Validation**:
     ```javascript
     const hmac = crypto.createHmac('sha256', appSecret);
     hmac.update(rawBody);
     crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
     ```
     - Explain why we use `express.json({ verify: (req, res, buf) => req.rawBody = buf })`: Express by default parses the JSON body, which re-serializes keys and alters whitespace. Validating HMAC requires the exact raw byte sequence received over the wire.
     - Explain timing-safe comparison to prevent side-channel timing attacks.

---

### 4:00 - 5:30 | Meta Graph API Retrieval & Error Handling
- **File to Open**: `backend/src/services/metaGraphService.js`.
- **Explain**:
  - Graph API endpoint: `https://graph.facebook.com/v21.0/{leadgen_id}`.
  - Passing Page Access Token (explain why a Page token is required instead of User or App token).
  - Token sanitization in logs: prevents leaking authorization secrets in server traces (`EAAB...cdef`).
  - Handling Meta-specific error codes:
    - Code 190 (Expired/Invalid Token)
    - Code 200 (Missing permissions: `leads_retrieval` / `pages_manage_ads`)
    - Code 4 / 17 / 32 / 613 (Rate limiting)

---

### 5:30 - 6:45 | Lead Normalization & Idempotent Persistence
- **File to Open**: `backend/src/services/leadProcessingService.js` and `backend/src/models/Lead.js`.
- **Explain**:
  - Field variance in Meta Forms: Users can define custom form field names (`full_name`, `fname` + `lname`, `phone_number`, `mobile`, `work_email`).
  - Normalization engine maps variations to uniform contact attributes while preserving full `fieldData` array.
  - **Deduplication Strategy**:
    - Pre-check: `Lead.findOne({ leadId })`.
    - MongoDB unique index: `{ leadId: 1 }` prevents concurrent insert race conditions (handles error code 11000).
    - Guarantees `isNew === true` before triggering Socket broadcast.

---

### 6:45 - 8:00 | Real-Time Socket.IO & React Native UI State Management
- **Files to Open**: `mobile/src/screens/LeadsDashboardScreen.js` and `mobile/src/services/socket.js`.
- **Explain**:
  - Connection lifecycle:
    - Automatically connects on screen mount with exponential reconnection backoff.
    - Updates UI connection badge ('connected', 'connecting', 'disconnected').
  - **Zero-Refresh Real-Time Update**:
    - Listen to `new_lead` event.
    - `addLeadSafely`: uses a `seenLeadIdsRef` (hash set) + functional state update (`setLeads(prev => [newLead, ...prev])`).
    - Eliminates race conditions between initial REST fetch and incoming socket broadcasts.
  - Clean unmounting: `socketClient.disconnect()` clears listeners to avoid memory leaks.

---

### 8:00 - 9:00 | Automated Test Suites & Verification
- **Run in Terminal**: `npm test` in `backend/` and `npm test` in `mobile/`.
- **Explain**:
  - 28 unit and integration tests covering:
    - Webhook handshake and rejection
    - Webhook HMAC signatures
    - Graph API failure and rate limits
    - MongoDB in-memory model validation and duplicate suppression
    - Socket.IO connection and broadcast delivery
    - Mobile deduplication and timestamp logic.

---

### 9:00 - 9:45 | Summary & Interview Wrap-Up
- **Spoken**:
  > "HookBridge demonstrates end-to-end full stack competence: robust webhook ingestion, secure HMAC cryptography, resilient external API communication with Meta Graph API, atomic database persistence, and an instantaneous, reactive React Native user interface. Thank you!"

