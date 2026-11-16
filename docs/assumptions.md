# HookBridge Engineering Assumptions & Security Model

This document outlines the architectural assumptions, trade-offs, and security principles established during the development of the HookBridge Proof of Concept.

---

## 1. Architectural Assumptions

1. **Webhook Ingress & Public Routing**:
   - Meta requires an internet-routable HTTPS URL for webhook verification and delivery.
   - For local development, an HTTPS tunnel (e.g., ngrok) forwards traffic to `http://localhost:5000`.
   - In production environments, HookBridge assumes deployment behind a TLS-terminating reverse proxy (e.g., NGINX, Cloudflare, or AWS ALB) with automated certificate renewals.

2. **Lead Volume & Ingress Throughput**:
   - For the PoC and mid-sized production accounts, an Express in-memory asynchronous worker model comfortably handles hundreds of concurrent lead events.
   - For high-volume enterprise advertising campaigns generating thousands of leads per minute, the in-memory async dispatch should be backed by an external persistent message queue (e.g. RabbitMQ, Redis BullMQ, or AWS SQS) to decouple webhook acknowledgement from Graph API retrieval rate limits.

3. **Graph API Token Stability**:
   - The system assumes a valid, long-lived Page Access Token configured via environment variables.
   - In multi-tenant SaaS environments, tokens would be stored encrypted in a database per tenant and automatically refreshed via Meta's OAuth token renewal endpoints.

4. **Network Topology for Mobile Clients**:
   - React Native mobile clients on Android emulators communicate with the host machine via `10.0.2.2`.
   - Physical devices connect across the local Wi-Fi network (LAN IP) or via the public tunnel.

---

## 2. Security Assumptions & PoC Model

1. **HMAC Signature Verification (`X-Hub-Signature-256`)**:
   - Every incoming POST request to `/webhooks/meta` is cryptographically validated using the raw request buffer and `META_APP_SECRET`.
   - Timing attacks are mitigated using `crypto.timingSafeEqual()`.

2. **Credential Isolation**:
   - Meta App Secret, Verify Token, and Page Access Tokens remain strictly isolated on the backend server.
   - No sensitive API credentials or tokens are bundled into or exposed by the React Native client.

3. **Data Protection & PII**:
   - Meta leads typically contain Personally Identifiable Information (PII) including names, emails, and phone numbers.
   - In this PoC, data is stored in MongoDB and delivered to authenticated mobile instances.
   - For GDPR / CCPA compliance in production, database field-level encryption (FLE) and an automated data retention/deletion schedule should be enabled.

4. **Idempotency & Duplicate Protection**:
   - Meta webhooks guarantee *at-least-once* delivery, meaning network retries or multiple clicks from users can dispatch identical `leadgen_id` values.
   - HookBridge enforces database unique indexing and deduplication logic, ensuring duplicate webhook events are logged, updated if needed, and safely suppressed from duplicate broadcast alerts.
