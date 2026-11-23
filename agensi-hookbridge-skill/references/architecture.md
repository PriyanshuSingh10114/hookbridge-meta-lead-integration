# System Architecture & Lifecycle

## 1. High-Level Flow

```mermaid
flowchart TD
    User["Prospect submits<br/>Meta Lead Ad Form"] --> Meta["Meta Cloud Infrastructure"]
    Meta -->|POST /webhooks/meta<br/>X-Hub-Signature-256| Ingress["Express Ingress Controller"]
    
    subgraph HookBridge Backend
        Ingress -->|1. Validate HMAC-SHA256| Auth["Signature Verifier"]
        Auth -->|2. Immediate 200 OK| Meta
        Auth -->|3. Async Dispatch| Worker["Lead Processing Pipeline"]
        
        Worker -->|4. GET /v21.0/{leadgen_id}| GraphAPI["Meta Graph API"]
        GraphAPI -->|5. Lead Details Payload| Worker
        
        Worker -->|6. Normalize Contact Fields| Normalizer["Field Normalizer"]
        Normalizer -->|7. Idempotent Insert| Mongo[("MongoDB Store<br/>unique: leadId")]
        
        Worker -->|8. emit 'new_lead'| SocketServer["Socket.IO Gateway"]
    end
    
    SocketServer -->|9. WebSocket Push| Client["React Native App / Web Client<br/>(Live Leads Dashboard)"]
```

---

## 2. Decoupling Webhook Ingestion from Graph API Retrieval

Meta enforces a strict **20-second timeout** on webhook callbacks. If a webhook handler blocks on synchronous database writes or external API requests, network latency can easily cause timeout breaches. When Meta encounters a timeout or non-200 HTTP response, it marks the delivery as failed and initiates an exponential backoff retry cycle, leading to delivery storms.

HookBridge solves this by decoupling the process into two stages:

1. **Synchronous Ingestion Phase (< 30ms)**:
   - Validates the `X-Hub-Signature-256` header using the raw byte stream.
   - Extracts `leadgen_id` pointers.
   - Immediately returns HTTP `200 OK EVENT_RECEIVED` to Meta.
2. **Asynchronous Execution Phase**:
   - Fetches full contact records from Meta Graph API v21.0.
   - Normalizes dynamic `field_data` key-value pairs into canonical attributes.
   - Saves records into MongoDB, trapping duplicate key error (code 11000).
   - Emits `new_lead` to active Socket.IO clients.

---

## 3. End-to-End Latency Profile

| Stage | Duration | Notes |
|---|---|---|
| Inbound Network & Tunnel | 50 – 150ms | Ingress from Meta servers via TLS / ngrok tunnel |
| HMAC Signature Verification | < 1ms | Constant-time native SHA-256 computation |
| Webhook Acknowledgment | < 5ms | Returns HTTP 200 `EVENT_RECEIVED` to Meta |
| Meta Graph API Fetch | 200 – 400ms | External HTTPS query with Page Access Token |
| MongoDB Upsert | 10 – 30ms | Atomic unique index constraint verification |
| Socket.IO Broadcast | < 5ms | WebSocket event dispatch to connected clients |
| React Native UI Render | 16ms (1 frame) | State update with synchronous deduplication |
| **Total Pipeline Latency** | **~350 – 600ms** | **Lead appears live without manual action** |
