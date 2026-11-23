# Lead Normalization & Idempotent Persistence

## 1. Dynamic Field Data Extraction

Meta Lead Ads allow advertisers to configure custom questions, producing variable `field_data` structures. The normalization layer maps these into canonical fields while preserving custom answers.

### Mapping Strategy:
- **Full Name**: Matches `full_name`, `name`, `fullname`, or combines `first_name` + `last_name`.
- **Email**: Matches `email`, `e-mail`, `work_email` (normalized to lowercase).
- **Phone**: Matches `phone_number`, `phone`, `mobile`, `contact_number`.
- **Custom Inquiries**: Stored in a `fieldData` array (`[{ name, values: [] }]`) for arbitrary CRM mapping.
- **Test Lead Detection**: Flags `isTestLead: true` if `is_test: true` is present, or if the email/name contains `test`.

---

## 2. MongoDB Schema Design

```javascript
const mongoose = require('mongoose');

const FieldDataSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    values: { type: [String], default: [] }
  },
  { _id: false }
);

const LeadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: { type: String, default: 'N/A' },
    email: { type: String, default: 'N/A', lowercase: true },
    phone: { type: String, default: 'N/A' },
    fieldData: [FieldDataSchema],
    pageId: { type: String, default: null },
    formId: { type: String, default: null },
    adId: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now, index: true },
    receivedAt: { type: Date, default: Date.now },
    source: { type: String, default: 'Meta Lead Ads' },
    isTestLead: { type: Boolean, default: false },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

LeadSchema.index({ submittedAt: -1, leadId: 1 });

module.exports = mongoose.model('Lead', LeadSchema);
```

---

## 3. Race-Condition Proof Deduplication

Meta webhooks guarantee *at-least-once* delivery. Network jitter or user form resubmissions can cause simultaneous duplicate webhook deliveries.

```javascript
async function persistLead(normalizedLead) {
  const existing = await Lead.findOne({ leadId: normalizedLead.leadId });
  if (existing) {
    return { lead: existing, isNew: false };
  }

  try {
    const newLead = await Lead.create(normalizedLead);
    return { lead: newLead, isNew: true };
  } catch (err) {
    // Catch MongoDB duplicate key error (code 11000) under concurrent insert race
    if (err.code === 11000) {
      const existingLead = await Lead.findOne({ leadId: normalizedLead.leadId });
      return { lead: existingLead, isNew: false };
    }
    throw err;
  }
}
```
Only when `isNew === true` should downstream real-time alerts or Socket.IO emissions be dispatched.
