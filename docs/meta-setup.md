# Meta Developer Platform Integration Guide

This guide details the step-by-step procedure for configuring the Meta Developer Platform, Webhooks, Access Tokens, and the Meta Lead Ads Testing Tool to work with HookBridge.

---

## 1. Access Token Hierarchy

Understanding Meta's access token hierarchy is critical for Lead Ads integration:

| Token Type | Scope | How Obtained | Used For in HookBridge |
|---|---|---|---|
| **App Access Token** | Entire App | App ID + App Secret exchange | Server-to-server app-level metrics, setting app subscriptions. |
| **User Access Token** | Authenticated User | Facebook Login / OAuth Dialog | Administering user assets and exchanging for long-lived Page tokens. |
| **Page Access Token** | Specific Facebook Page | Exchanged via `/me/accounts` with `pages_manage_ads` permission | **Required by HookBridge** to read `/v21.0/{leadgen_id}`. A User Token will NOT work for Leadgen retrieval. |

> [!IMPORTANT]
> To retrieve lead details via Meta Graph API, you **MUST** use a **Page Access Token** associated with the Facebook Page where the Lead Ad form was created.

---

## 2. Prerequisites & Meta App Creation

### Step 1: Create Meta Developer Account
1. Visit [developers.facebook.com](https://developers.facebook.com/).
2. Log in with your Facebook account and complete developer verification if prompted.

### Step 2: Create a Meta App
1. Go to **My Apps** > **Create App**.
2. Select **Other** as the use case > Click **Next**.
3. Choose **Business** as the app type > Click **Next**.
4. Enter an **App Name** (e.g., `HookBridge Lead Integration`).
5. Choose your Business Account or select personal testing.
6. Click **Create App**.

### Step 3: Note App ID and App Secret
1. In your App Dashboard, navigate to **App Settings** > **Basic**.
2. Copy the **App ID** and copy the **App Secret** (click *Show*).
3. Set these in your `backend/.env`:
   ```bash
   META_APP_ID=your_app_id_here
   META_APP_SECRET=your_app_secret_here
   ```

---

## 3. Webhook Product Configuration

### Step 4: Add Webhooks Product
1. In the left sidebar, click **Add Product** (or **Use cases**).
2. Locate **Webhooks** and click **Set up**.

### Step 5: Start Ingress Tunnel (ngrok)
Meta requires a publicly accessible HTTPS callback endpoint. Expose your local backend port:
```bash
ngrok http 5000
```
Copy the forwarding HTTPS URL, for example: `https://a1b2-c3d4.ngrok-free.app`.

### Step 6: Configure Page Webhook Subscription
1. Under **Webhooks** in the Meta App Dashboard, select **Page** from the dropdown menu (NOT *User* or *Permissions*).
2. Click **Subscribe to this object**.
3. Enter:
   - **Callback URL**: `https://<YOUR_NGROK_DOMAIN>/webhooks/meta`
   - **Verify Token**: Enter the exact value configured in your backend `.env` (default: `hookbridge_verify_token_secure_2026`).
4. Click **Verify and Save**.
   - Meta will dispatch a `GET` request to your endpoint with `hub.mode=subscribe`, `hub.verify_token`, and `hub.challenge`.
   - Your HookBridge backend will automatically validate the token and return `hub.challenge` with HTTP 200.

### Step 7: Subscribe to `leadgen` Field
1. In the list of Page subscription fields, search for **`leadgen`**.
2. Click **Subscribe** or toggle it ON.

---

## 4. Permissions & Page Subscription

### Step 8: Required Permissions
To fetch leads submitted through Page forms, your app/token requires the following permissions:
- `leads_retrieval`: Grants access to fetch lead details from Graph API.
- `pages_manage_ads`: Grants management and retrieval of lead ad assets.
- `pages_read_engagement`: Allows reading page posts and engagements.
- `pages_show_list`: Allows discovering pages the user manages.

### Step 9: Generate a Long-Lived Page Access Token
Using the **Meta Graph API Explorer**:
1. Open the [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App in the **Meta App** dropdown.
3. In **User or Page**, select **User Token** and add permissions: `leads_retrieval`, `pages_manage_ads`, `pages_show_list`.
4. Click **Generate Access Token** and approve permissions in the popup.
5. In the query box, execute:
   ```http
   GET /me/accounts?fields=name,access_token,id
   ```
6. Locate your target Facebook Page in the response and copy its `access_token`. This is your **Page Access Token**.
7. Set it in `backend/.env`:
   ```bash
   META_PAGE_ACCESS_TOKEN=EAAB...
   ```

### Step 10: Subscribe the Page to the App
Ensure your Facebook Page forwards lead events to your app by executing this Graph API call (using your Page Access Token):
```http
POST /{page-id}/subscribed_apps?subscribed_fields=leadgen&access_token={page-access-token}
```
Response should be `{"success": true}`.

---

## 5. Testing with Meta Lead Ads Testing Tool

Meta provides an official sandbox testing tool that generates realistic test leads without incurring advertising costs.

### Step 11: Open the Testing Tool
Navigate to:
👉 [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing)

### Step 12: Select Page & Form
1. Choose your **Page** from the dropdown.
2. Select your **Lead Form** (or select the default dummy form).
3. If a lead already exists for that form, click **Delete Lead** first (Meta allows only 1 test lead per form at a time).

### Step 13: Submit a Test Lead
1. Click **Create Lead**.
2. Or click **Preview Form**, fill in custom values (e.g. `Bruce Wayne`, `bruce@batman.com`, `+15551234567`), and click **Submit**.

### Step 14: Verification
Watch your system in action:
1. Meta sends a `POST` notification to your ngrok webhook endpoint.
2. HookBridge backend validates the `X-Hub-Signature-256`.
3. HookBridge extracts `leadgen_id` and fetches the full lead from `https://graph.facebook.com/v21.0/{leadgen_id}`.
4. Lead is saved into MongoDB.
5. Socket.IO emits `new_lead`.
6. Your open React Native app immediately displays the lead card with zero user action.
