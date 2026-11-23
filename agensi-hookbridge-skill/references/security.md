# Security, Authentication & Data Protection

## 1. Threat Model & Mitigations

| Threat | Impact | Mitigation in HookBridge |
|---|---|---|
| **Payload Spoofing / Forgery** | Attacker injects fraudulent leads into CRM | Cryptographic HMAC-SHA256 signature verification on every inbound POST. |
| **Timing Side-Channel Attacks** | Attacker infers signature bytes character-by-character | Constant-time buffer comparison using `crypto.timingSafeEqual()`. |
| **Webhook Delivery Denial-of-Service** | High latency triggers delivery storm from Meta | Webhook returns HTTP 200 within 50ms, processing pipeline runs asynchronously. |
| **Credential Leakage** | Compromised access token exposes lead data | Access tokens remain strictly on backend server; masked in logs (`EAAB...xyz`). |
| **Duplicate Lead Processing** | Multiple notifications cause duplicate CRM entries | Database-level unique constraint on `leadId` traps Mongo error 11000. |

---

## 2. Cryptographic Best Practices

### 1. Timing-Safe Buffer Comparison
Standard string comparisons (`===`) terminate at the first mismatched character. This small execution time difference allows attackers to reconstruct valid signatures via statistical timing analysis.

```javascript
// SAFE: Constant-time comparison
const signatureBuffer = Buffer.from(signature, 'hex');
const expectedBuffer = Buffer.from(expectedSignature, 'hex');

if (
  signatureBuffer.length !== expectedBuffer.length ||
  !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
) {
  return res.status(403).json({ error: 'Invalid webhook signature' });
}
```

### 2. Credential Sanitization
Never log complete access tokens to `stdout` or monitoring systems. Use token masking:

```javascript
function sanitizeToken(token) {
  if (!token || typeof token !== 'string') return 'none';
  if (token.length <= 8) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}
```

---

## 3. Privacy & Compliance (GDPR / CCPA)

Meta Lead Ads collect Personally Identifiable Information (PII) including full names, personal emails, and phone numbers.

### Architectural Rules for Production:
1. **Field-Level Encryption (FLE)**: Encrypt sensitive customer contact attributes (`name`, `email`, `phone`) at rest using AES-256 in MongoDB.
2. **Data Retention Policies**: Automatically purge or anonymize inactive lead records after a defined retention window (e.g. 90 days).
3. **Audit Logging**: Maintain immutable access logs tracking when leads are retrieved or exported by downstream CRM users.
