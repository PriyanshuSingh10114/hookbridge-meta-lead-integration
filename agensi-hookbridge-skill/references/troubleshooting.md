# Troubleshooting & Diagnostics

## 1. Webhook Handshake Issues

### Issue: Meta rejects Callback URL with "The URL couldn't be validated"
- **Cause**: Backend is offline, ngrok tunnel is closed, or verify token does not match.
- **Verification**:
  ```bash
  curl -i "http://localhost:5000/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test1234"
  ```
- **Fix**: Expected response is HTTP 200 with body `test1234`. Verify that `META_VERIFY_TOKEN` in `.env` matches Meta exactly.

---

## 2. Webhook Signature Verification Failures

### Issue: POST requests rejected with `403 Invalid webhook signature`
- **Cause**: `META_APP_SECRET` is wrong, or Express parsed the body as JSON before computing the HMAC hash.
- **Verification**: Run `node scripts/verify-signature.js` to inspect signature generation against sample payloads.
- **Fix**: Ensure Express captures raw body buffer via `express.json({ verify: (req, res, buf) => req.rawBody = buf })`.

---

## 3. Meta Graph API Errors

### Issue: Error Code 190 (`OAuthException: Error validating access token`)
- **Cause**: The Page Access Token has expired or Facebook user password was changed.
- **Fix**: Open [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/), choose your Page, and generate a new Page Access Token with `leads_retrieval`.

### Issue: Error Code 200 (`OAuthException: Requires leads_retrieval permission`)
- **Cause**: The access token lacks the `leads_retrieval` permission.
- **Fix**: Ensure the token possesses `leads_retrieval`, `pages_manage_ads`, and `pages_show_list`.

---

## 4. Mobile Networking & Emulators

### Issue: Mobile app shows "Disconnected (Retrying...)"
- **Android Emulator**: Ensure mobile connects to `http://10.0.2.2:5000` rather than `http://localhost:5000` (`10.0.2.2` maps to host machine loopback).
- **Physical Phone**: Ensure phone and computer are on the same Wi-Fi network. Configure `mobile/.env` with your computer's local IP (e.g. `http://192.168.1.50:5000`).
- **Firewall**: Ensure port 5000 is open in the host OS firewall.
