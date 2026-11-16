# HookBridge System Architecture & Technical Specifications

HookBridge is a real-time lead synchronization pipeline engineered to connect Meta Lead Ads with a React Native mobile application with zero manual user interaction.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Meta_Cloud ["Meta Developer Platform"]
        Tool["Meta Lead Ads Testing Tool"] -->|Submit Test Lead| LeadAd["Lead Ad Form Event"]
        LeadAd -->|Trigger Webhook| WebhookEngine["Meta Webhook Engine"]
    end

    subgraph Ingress ["Public Ingress"]
        WebhookEngine -->|HTTPS POST + HMAC-SHA256| NgrokTunnel["Public Tunnel (ngrok / reverse proxy)"]
    end

    subgraph Backend ["HookBridge Node.js Backend"]
        NgrokTunnel -->|Forward to localhost:5000| WebhookRouter["/webhooks/meta (POST)"]
        WebhookRouter --> SigCheck{"Signature Valid? (HMAC-SHA256)"}
        SigCheck -->|No| Reject["403 Forbidden"]
        SigCheck -->|Yes| Ack["Immediate 200 OK EVENT_RECEIVED"]
        
        Ack --> AsyncWorker["Async Lead Processing Worker"]
        AsyncWorker --> Extract["Extract leadgen_id & form_id"]
        Extract --> GraphAPIReq["Meta Graph API Client (v21.0)"]
        
        GraphAPIReq -->|GET /v21.0/leadgen_id| MetaGraph["Meta Graph API Servers"]
        MetaGraph -->|Return full field_data, email, phone, name| GraphAPIReq
        
        GraphAPIReq --> Normalizer["Lead Normalization Service"]
        Normalizer --> DedupeCheck{"Duplicate Lead? (leadId unique)"}
        
        DedupeCheck -->|Yes| Skip["Log Duplicate & Suppress Broadcast"]
        DedupeCheck -->|No| MongoStore[("MongoDB Persistence")]
        
        MongoStore -->|Success| SocketBroadcaster["Socket.IO Gateway Server"]
    end

    subgraph Mobile ["React Native Mobile Client"]
        SocketBroadcaster -->|WSS emit 'new_lead'| MobileSocket["Socket.IO Client"]
        MobileSocket --> StateMgr["React State (Leads List)"]
        StateMgr --> UI["Auto-Render Lead Card on Dashboard"]
        
        InitOpen["App Launch / Open"] -->|GET /api/leads| RESTLoader["Axios HTTP Client"]
        RESTLoader --> MongoStore
    end
```

---

## 2. Sequence Diagram: Real-Time Lead Event Flow

```mermaid
sequenceDiagram
    autonumber
    actor Tester as Developer / User
    participant MetaTest as Meta Lead Ads Testing Tool
    participant MetaHook as Meta Webhook Engine
    participant Express as HookBridge Backend
    participant GraphAPI as Meta Graph API (v21.0)
    participant DB as MongoDB
    participant Socket as Socket.IO Server
    participant App as React Native App

    Tester->>MetaTest: Clicks "Create Lead"
    MetaTest->>MetaHook: Fires leadgen trigger
    MetaHook->>Express: POST /webhooks/meta (X-Hub-Signature-256 header)
    Express->>Express: Verify HMAC-SHA256 with META_APP_SECRET
    Express-->>MetaHook: 200 OK "EVENT_RECEIVED" (immediate ack)
    
    rect rgb(240, 248, 255)
    Note over Express,GraphAPI: Asynchronous Lead Retrieval
    Express->>GraphAPI: GET /v21.0/{leadgen_id}?fields=...&access_token=PAGE_TOKEN
    GraphAPI-->>Express: Returns full lead (field_data: full_name, email, phone)
    end

    rect rgb(245, 255, 245)
    Note over Express,DB: Data Normalization & Persistence
    Express->>Express: Normalize fields into { name, email, phone, leadId }
    Express->>DB: Lead.findOne({ leadId })
    DB-->>Express: Not found
    Express->>DB: Lead.create(normalizedData)
    DB-->>Express: Persisted Document (_id: 6afb1e...)
    end

    rect rgb(255, 250, 240)
    Note over Express,App: Real-Time Client Delivery
    Express->>Socket: broadcastNewLead(savedLead)
    Socket->>App: emit("new_lead", payload)
    App->>App: Check seenLeadIds duplicate guard
    App->>App: Prepend lead to FlatList state
    App-->>Tester: Instant visual card update on screen (zero refresh)
    end
```

---

## 3. Core Architectural Modules

### 3.1 Webhook Verification & Security Layer
1. **Handshake Verification (`GET /webhooks/meta`)**: Validates `hub.mode === 'subscribe'` and verifies `hub.verify_token` against `META_VERIFY_TOKEN`. Replies with `hub.challenge` as plain text.
2. **Payload Authenticity (`POST /webhooks/meta`)**: Evaluates `X-Hub-Signature-256`. Computes the HMAC-SHA256 signature using the raw unparsed request buffer and `META_APP_SECRET`. Compares signatures using timing-safe string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
3. **Immediate Acknowledgement**: Returns HTTP 200 `EVENT_RECEIVED` synchronously within milliseconds, completely avoiding Meta webhook delivery timeouts or duplicate retry floods.

### 3.2 Meta Graph API Integration Service
- Communicates directly with Meta Graph API endpoints using configured version (e.g. `v21.0`).
- Dynamically requests relevant lead attributes:
  - `id`: unique Meta lead ID
  - `created_time`: submission time
  - `field_data`: key-value array of submitted questions
  - `form_id`: associated lead generation form
  - `ad_id`, `adset_id`, `campaign_id`: campaign attribution data
- Employs secure Page Access Token authentication.
- Redacts and sanitizes tokens from error messages and logs (`EAAB...oken`).

### 3.3 Lead Normalization & Processing Engine
- Inspects heterogeneous Meta lead forms where questions might be labeled differently (e.g., `full_name`, `first_name` + `last_name`, `email`, `work_email`, `phone_number`, `mobile_number`).
- Sanitizes and formats contact details into canonical properties (`name`, `email`, `phone`).
- Preserves raw payloads and complete field mappings in MongoDB.

### 3.4 Idempotency & Persistence Engine
- Indexed unique constraint on `leadId`.
- Double-checked locking pattern: checks existence prior to insertion, and safely traps MongoDB duplicate key error code `11000` under race conditions.
- Guarantees that only strictly novel leads trigger real-time websocket broadcast events.

### 3.5 Real-Time WebSocket Gateway
- Powered by Socket.IO over WebSocket and polling fallback.
- Broadcasts persisted lead objects under the `new_lead` event channel.
- Automatically handles reconnection backoff and trackable connection state.

