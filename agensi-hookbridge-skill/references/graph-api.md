# Meta Graph API Integration (v21.0)

## 1. Graph API Endpoint & Authentication

To retrieve the lead details associated with a `leadgen_id`, query Meta's Graph API:

```http
GET https://graph.facebook.com/v21.0/{leadgen_id}?fields=id,created_time,field_data,form_id,ad_id,adset_id,campaign_id,is_organic,platform&access_token={PAGE_ACCESS_TOKEN}
```

### Critical Token Rule: Page Access Token Required
- Meta **rejects User Access Tokens** for lead retrieval.
- You must use a **Page Access Token** associated with the Facebook Page that created the Lead Ad form.
- The Page Token must possess the `leads_retrieval` and `pages_manage_ads` permissions.

---

## 2. Meta Graph API Response Structure

```json
{
  "id": "123456789012345",
  "created_time": "2026-11-20T10:30:00+0000",
  "form_id": "9988776655",
  "ad_id": "4455667788",
  "adset_id": "3344556677",
  "campaign_id": "2233445566",
  "is_organic": false,
  "platform": "fb",
  "field_data": [
    {
      "name": "full_name",
      "values": ["Marcus Vance"]
    },
    {
      "name": "email",
      "values": ["marcus.vance@apexlogistics.com"]
    },
    {
      "name": "phone_number",
      "values": ["+1-415-555-0198"]
    },
    {
      "name": "company_size",
      "values": ["50-200 employees"]
    }
  ]
}
```

---

## 3. Error Code Translation Matrix

| Error Code | Subcode | Meaning | Recommended Action |
|---|---|---|---|
| **190** | 463 / 467 | Access Token Expired | Re-generate long-lived Page Access Token via Graph API Explorer. |
| **200** / **298** | — | Insufficient Permissions | Add `leads_retrieval` and `pages_manage_ads` to the Facebook Page and re-subscribe the app. |
| **4** / **17** / **32** / **613** | — | Rate Limit Exceeded | Back off and retry with exponential delay. |
| **100** | — | Object Not Found / Invalid Field | Verify that the `leadgen_id` exists and is associated with the authenticated Page. |
