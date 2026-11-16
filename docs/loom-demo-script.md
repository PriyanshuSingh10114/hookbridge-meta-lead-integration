# Loom Video 1: Working Demonstration Script
**Target Duration**: 4 - 5 Minutes  
**Focus**: Live End-to-End Workflow with Zero Manual Refresh

---

## Preparation Checklist Before Recording
1. **Screen Layout**:
   - Left side: React Native App (running on Android Emulator or Expo web preview), showing the Leads Dashboard with **Live Socket Connected** (green badge).
   - Top right: Browser open to [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing) with your Page and Form selected.
   - Bottom right: Terminal showing live backend logs (`npm run dev` in `backend/`).
2. Clean State: If a test lead exists in the testing tool, click **Delete Lead** prior to starting the video.

---

## Video Script & Actions

### 0:00 - 0:45 | Introduction & Architecture Overview
- **Spoken**:
  > "Hello everyone! In this video, I will demonstrate **HookBridge**, a production-grade, real-time integration system connecting Meta Lead Ads directly to a React Native mobile application.
  > The primary objective is instant lead delivery: when a user or prospect submits a Meta Lead Ad form, the lead is captured via Meta Webhooks, retrieved from the Meta Graph API, saved to MongoDB, and pushed over WebSockets to this already-open React Native app without any manual refresh, button click, or page reload."

### 0:45 - 1:30 | Reviewing the Live Environment
- **Action**: Highlight the three split windows on the screen.
- **Spoken**:
  > "Notice our three active environments:
  > 1. On the left is our React Native Leads Dashboard. The connection badge confirms: 'Live Socket Connected' with an active socket ID.
  > 2. On the bottom right is our Node.js backend running on port 5000, listening for Meta Webhooks and connected to MongoDB.
  > 3. On the top right is the official Meta Lead Ads Testing Tool connected to our subscribed Page and Form."

### 1:30 - 3:00 | The Live Demonstration (Zero Interaction Workflow)
- **Action**:
  1. In the Meta Lead Ads Testing Tool, click **Preview Form** (or click **Create Lead**).
  2. Enter test contact details (e.g. Name: `Sarah Connor`, Email: `sarah.connor@sky-res.org`, Phone: `+1-555-888-9999`).
  3. Click **Submit** in the Meta dialog.
  4. **DO NOT TOUCH THE MOBILE SCREEN OR KEYBOARD!**
  5. Keep your mouse still or point at the terminal logs and mobile screen.
- **Spoken**:
  > "I am now submitting the lead on Meta's official testing tool... Submit!
  > Watch the backend terminal: Meta immediately dispatched the POST webhook with an HMAC-SHA256 signature header.
  > Our backend validated the signature, extracted leadgen ID `1234...`, called the Meta Graph API v21.0 to retrieve the complete form submission, persisted the document into MongoDB with duplicate protection, and emitted a `new_lead` event via Socket.IO.
  > And look at the mobile screen on the left:
  > With zero clicks and zero manual refresh, **Sarah Connor**'s lead card appeared instantly at the top of the list!
  > The badge confirms 'Meta Lead Ads', displaying the verified email, phone number, and submission timestamp."

### 3:00 - 4:00 | Duplicate Prevention & Resilience Check
- **Action**: In the Meta Testing Tool, click **Create Lead** again without deleting the previous lead.
- **Spoken**:
  > "Notice what happens when Meta or a user triggers a duplicate event.
  > In the backend logs, our idempotency engine detects: `[LEAD SERVICE DUPLICATE] Lead already exists in DB. Skipping duplicate.`
  > The backend suppresses redundant broadcasts, ensuring the mobile app never displays duplicate records or spam notifications."

### 4:00 - 4:45 | Conclusion
- **Spoken**:
  > "This concludes our live working demonstration of HookBridge. The integration is fully functional, end-to-end, and verified against Meta's official Developer Platform. In our second video, we'll dive deep into the source code and architectural decisions. Thank you!"
