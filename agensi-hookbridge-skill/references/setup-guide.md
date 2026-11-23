# End-to-End Setup Guide

## 1. Prerequisites

- **Node.js**: `v18.x` or `v22.x`
- **MongoDB**: Local community server running on port `27017` or MongoDB Atlas URI
- **Tunneling Tool**: `ngrok` (or Cloudflare Tunnel) to expose local webhook endpoint
- **Meta Developer Account**: Access to [developers.facebook.com](https://developers.facebook.com/)

---

## 2. Backend Configuration

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Set your environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/hookbridge
   META_APP_ID=your_meta_app_id
   META_APP_SECRET=your_meta_app_secret
   META_VERIFY_TOKEN=hookbridge_verify_token_secure_2026
   META_PAGE_ACCESS_TOKEN=your_page_access_token
   META_GRAPH_API_VERSION=v21.0
   CLIENT_URL=*
   ```

4. Start the backend in development mode:
   ```bash
   npm run dev
   ```

---

## 3. Exposing Webhook Ingress (ngrok)

Meta requires a public HTTPS URL. In a separate terminal:
```bash
ngrok http 5000
```
Copy the forwarding HTTPS URL (e.g. `https://a1b2-c3d4.ngrok-free.app`).

---

## 4. Meta Developer Portal Setup

1. In the [Meta App Dashboard](https://developers.facebook.com/apps/):
   - Choose or create a **Business** app.
   - Go to **Webhooks** $\to$ select **Page** object.
   - Click **Subscribe to this object**:
     - **Callback URL**: `https://<YOUR_NGROK_URL>/webhooks/meta`
     - **Verify Token**: value of `META_VERIFY_TOKEN` (e.g. `hookbridge_verify_token_secure_2026`).
   - Click **Verify and Save**.
   - Under Page subscription fields, subscribe to **`leadgen`**.
2. Generate Page Access Token in [Graph API Explorer](https://developers.facebook.com/tools/explorer/):
   - Select your Facebook Page.
   - Add permissions: `leads_retrieval`, `pages_manage_ads`, `pages_show_list`.
   - Click **Generate Access Token** and copy the resulting string starting with `EAAB...`.
3. Subscribe the Page to your App:
   ```bash
   curl -X POST "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps?subscribed_fields=leadgen&access_token={PAGE_ACCESS_TOKEN}"
   ```

---

## 5. Mobile Dashboard Setup (React Native)

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```
2. Start the Expo development server:
   ```bash
   npm start
   ```
   - Press `w` to open in a web browser.
   - Press `a` to open in an Android Emulator.
   - Or scan the QR code with **Expo Go** on a physical phone.

*Note: For physical phones on local Wi-Fi, update `API_BASE_URL` and `SOCKET_SERVER_URL` in `mobile/.env` with your computer's local network IP (e.g. `http://192.168.1.100:5000`).*
