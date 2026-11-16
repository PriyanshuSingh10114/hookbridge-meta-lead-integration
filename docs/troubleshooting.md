# HookBridge Troubleshooting & Incident Diagnostics

This guide provides targeted diagnostics and resolutions for issues encountered during setup, webhook delivery, Graph API calls, and real-time socket synchronization.

---

## 1. Webhook Issues

### 1.1 Webhook Verification Fails (HTTP 403 / "Verification token mismatch")
- **Cause**: The `hub.verify_token` entered in Meta App Dashboard does not match `META_VERIFY_TOKEN` in `backend/.env`.
- **Diagnostic**: Check backend log `[WEBHOOK VERIFY FAILED] Verification token mismatch`.
- **Resolution**: Verify that the exact token in `backend/.env` is pasted into the Meta App Dashboard dialog. Ensure there are no trailing whitespace characters.

### 1.2 Webhook Returns HTTP 401 ("Missing X-Hub-Signature-256 header")
- **Cause**: Incoming POST request did not contain Meta's cryptographic signature header.
- **Diagnostic**: This occurs if testing with a basic `curl` or Postman request without generating HMAC headers.
- **Resolution**: Use the included local test runner `npm run simulate:lead` which computes and injects a valid HMAC-SHA256 signature header.

### 1.3 Webhook Returns HTTP 403 ("Invalid webhook signature")
- **Cause**: The HMAC signature was computed with an App Secret different from `META_APP_SECRET` in `backend/.env`, or the request payload was modified by an intermediary proxy before reaching the signature check.
- **Diagnostic**: Check if ngrok or a proxy modified headers or request body.
- **Resolution**: Verify `META_APP_SECRET` matches your Meta App Dashboard under *App Settings* > *Basic*. HookBridge preserves `req.rawBody` specifically to ensure payload byte consistency.

---

## 2. Meta Graph API Errors

### 2.1 Error Code 190 (Invalid / Expired OAuth Access Token)
- **Log**: `[META GRAPH API ERROR] Lead ID: ... Code: 190 - Error validating access token`
- **Cause**: `META_PAGE_ACCESS_TOKEN` is missing, expired, or a User Token was used instead of a Page Token.
- **Resolution**:
  1. Open [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
  2. Query `GET /me/accounts` with `pages_manage_ads` permission.
  3. Copy the specific Page's `access_token`.
  4. Update `META_PAGE_ACCESS_TOKEN` in `backend/.env` and restart backend.

### 2.2 Error Code 200 (Insufficient Permissions)
- **Log**: `Insufficient Meta permissions (leads_retrieval / pages_manage_ads required)`
- **Cause**: The token was generated without the `leads_retrieval` permission.
- **Resolution**: Re-generate the token ensuring both `leads_retrieval` and `pages_manage_ads` permissions are granted.

### 2.3 Error Code 4 / 17 / 32 / 613 (Rate Limiting)
- **Log**: `Meta Graph API rate limit reached`
- **Cause**: Excessive calls to Graph API within a short window.
- **Resolution**: The system logs and returns a retryable status. Ensure test leads are generated spaced by at least a few seconds.

---

## 3. Database & Deduplication

### 3.1 Duplicate Lead Ignored
- **Log**: `[LEAD SERVICE DUPLICATE] Lead with leadId=... already exists in DB. Skipping duplicate.`
- **Explanation**: This is expected behavior. When Meta retries a webhook or the same test lead is submitted twice, HookBridge prevents duplicate records in MongoDB and suppresses duplicate socket notifications.
- **Resolution**: In Meta Lead Ads Testing Tool, click **Delete Lead** before clicking **Create Lead** again.

### 3.2 MongoDB Connection Failure
- **Log**: `[DATABASE ERROR] Failed to connect to MongoDB`
- **Diagnostic**: MongoDB is not running on `localhost:27017` or the connection string in `MONGODB_URI` is incorrect.
- **Resolution**: Ensure your local MongoDB service is active (`net start MongoDB` on Windows) or point `MONGODB_URI` to a MongoDB Atlas cluster URI.

---

## 4. Mobile Client & Real-Time Sync

### 4.1 Connection Badge Shows "Connecting..." or "Disconnected"
- **Cause**: The mobile client cannot reach the backend IP or port.
- **Resolution**:
  - **Android Emulator**: Ensure mobile config points to `http://10.0.2.2:5000` (handled automatically by `mobile/src/config/env.js`).
  - **Physical Device**: Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` to your computer's local LAN IP (e.g., `http://192.168.1.15:5000`).
  - Ensure Windows Defender / firewall allows incoming connections on port 5000.

### 4.2 Lead Appears in Backend But Not on Phone
- **Diagnostic**: Check backend logs for `[SOCKET BROADCAST] Emitted 'new_lead' ... to X active client(s)`.
- **Resolution**: If active clients is 0, verify the connection status badge on the mobile app is green ("Live Socket Connected"). Once connected, leads broadcast instantly.
