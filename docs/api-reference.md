# HookBridge API & Real-Time Protocol Reference

This document provides complete documentation for the HookBridge REST API and Socket.IO real-time event interfaces.

---

## 1. REST Endpoints

### 1.1 Health Check
Verifies operational status, database connectivity, and active socket connections.

- **URL**: `/api/health`
- **Method**: `GET`
- **Auth**: None
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "status": "healthy",
    "service": "HookBridge Meta Lead Ads Integration",
    "version": "1.0.0",
    "uptime": 342,
    "timestamp": "2026-11-16T15:20:00.000Z",
    "database": {
      "status": "connected",
      "connected": true
    },
    "realtime": {
      "socketClientsConnected": 1
    },
    "metaIntegration": {
      "graphApiVersion": "v21.0",
      "hasVerifyToken": true,
      "hasPageAccessToken": true,
      "hasAppSecret": true
    }
  }
  ```

---

### 1.2 Get All Leads
Retrieves paginated list of leads sorted newest first.

- **URL**: `/api/leads`
- **Method**: `GET`
- **Query Parameters**:
  - `page` *(optional, integer, default: 1)*: Page number.
  - `limit` *(optional, integer, default: 20, max: 100)*: Items per page.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "673752e2a1b2c3d4e5f60001",
        "leadId": "123456789012345",
        "name": "Alex Mercer",
        "email": "alex.mercer@example.com",
        "phone": "+1-555-0199",
        "fieldData": [
          { "name": "full_name", "values": ["Alex Mercer"] },
          { "name": "email", "values": ["alex.mercer@example.com"] },
          { "name": "phone_number", "values": ["+1-555-0199"] }
        ],
        "pageId": "10987654321",
        "formId": "9988776655",
        "adId": "4455667788",
        "submittedAt": "2026-11-16T14:45:00.000Z",
        "receivedAt": "2026-11-16T14:45:01.200Z",
        "source": "Meta Lead Ads",
        "isTestLead": false,
        "createdAt": "2026-11-16T14:45:01.205Z",
        "updatedAt": "2026-11-16T14:45:01.205Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### 1.3 Get Single Lead
Retrieves detailed information for a specific lead by Meta `leadId` or MongoDB `_id`.

- **URL**: `/api/leads/:id`
- **Method**: `GET`
- **Parameters**: `id` *(string)*: Meta lead ID or MongoDB ObjectId.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "_id": "673752e2a1b2c3d4e5f60001",
      "leadId": "123456789012345",
      "name": "Alex Mercer",
      "email": "alex.mercer@example.com",
      "phone": "+1-555-0199",
      "fieldData": [...],
      "submittedAt": "2026-11-16T14:45:00.000Z"
    }
  }
  ```
- **Error Response** (`404 Not Found`):
  ```json
  {
    "success": false,
    "error": "Lead with identifier 'non_existent_id' not found"
  }
  ```

---

### 1.4 Meta Webhook Verification Handshake
Invoked by Meta when registering or editing the webhook callback URL.

- **URL**: `/webhooks/meta`
- **Method**: `GET`
- **Query Parameters**:
  - `hub.mode`: Expected value `subscribe`.
  - `hub.verify_token`: Custom verify token string.
  - `hub.challenge`: Random challenge string returned by Meta.
- **Success Response** (`200 OK`):
  - Body: Plain text `<hub.challenge>`
- **Error Response** (`403 Forbidden`):
  - Body: Plain text `Forbidden: Verification token mismatch`

---

### 1.5 Meta Webhook Event Notification
Invoked by Meta when a leadgen event occurs on a subscribed Page.

- **URL**: `/webhooks/meta`
- **Method**: `POST`
- **Headers**:
  - `x-hub-signature-256`: `sha256=<HMAC-SHA256 signature>`
  - `Content-Type`: `application/json`
- **Payload Schema**:
  ```json
  {
    "object": "page",
    "entry": [
      {
        "id": "10987654321",
        "time": 1700000000,
        "changes": [
          {
            "field": "leadgen",
            "value": {
              "ad_id": "4455667788",
              "form_id": "9988776655",
              "leadgen_id": "123456789012345",
              "created_time": 1700000000,
              "page_id": "10987654321"
            }
          }
        ]
      }
    ]
  }
  ```
- **Success Response** (`200 OK`):
  - Body: Plain text `EVENT_RECEIVED`
- **Error Responses**:
  - `401 Unauthorized`: Missing `x-hub-signature-256` header.
  - `403 Forbidden`: Invalid signature (payload tampering or wrong App Secret).
  - `404 Not Found`: Event object is not `page`.

---

## 2. Socket.IO Real-Time Gateway

### 2.1 Connection Event
Emitted by the server upon initial socket handshake.

- **Channel**: `connected`
- **Direction**: Server -> Client
- **Payload**:
  ```json
  {
    "message": "Connected to HookBridge Real-Time Lead Gateway",
    "socketId": "gG05f_97y2aO9E0EAAAA",
    "timestamp": "2026-11-16T15:20:00.000Z"
  }
  ```

---

### 2.2 New Lead Broadcast Event
Emitted by the server immediately after a lead is normalized and committed to MongoDB.

- **Channel**: `new_lead`
- **Direction**: Server -> Broadcast to All Clients
- **Payload**:
  ```json
  {
    "event": "new_lead",
    "leadId": "123456789012345",
    "lead": {
      "id": "673752e2a1b2c3d4e5f60001",
      "leadId": "123456789012345",
      "name": "Bruce Wayne",
      "email": "bruce@wayne-enterprises.com",
      "phone": "+1-555-BATMAN",
      "fieldData": [
        { "name": "full_name", "values": ["Bruce Wayne"] },
        { "name": "email", "values": ["bruce@wayne-enterprises.com"] },
        { "name": "phone_number", "values": ["+1-555-BATMAN"] }
      ],
      "pageId": "10987654321",
      "formId": "9988776655",
      "submittedAt": "2026-11-16T15:19:58.000Z",
      "receivedAt": "2026-11-16T15:20:00.120Z",
      "source": "Meta Lead Ads",
      "isTestLead": false
    },
    "timestamp": "2026-11-16T15:20:00.125Z"
  }
  ```

