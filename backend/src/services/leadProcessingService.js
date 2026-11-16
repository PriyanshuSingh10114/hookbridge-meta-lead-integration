const Lead = require('../models/Lead');

class LeadProcessingService {
  /**
   * Normalize raw field_data from Meta into standardized contact fields
   * @param {Array<{ name: string, values: string[] }>} fieldData
   * @returns {{ name: string, email: string, phone: string }}
   */
  extractContactFields(fieldData = []) {
    let name = 'N/A';
    let firstName = '';
    let lastName = '';
    let email = 'N/A';
    let phone = 'N/A';

    if (!Array.isArray(fieldData)) {
      return { name, email, phone };
    }

    fieldData.forEach(item => {
      if (!item || !item.name) return;
      const key = item.name.toLowerCase().trim();
      const val = Array.isArray(item.values) && item.values.length > 0 ? item.values[0] : '';

      if (!val) return;

      // Extract Email
      if (
        key === 'email' ||
        key.includes('email') ||
        key.includes('e-mail') ||
        key === 'work_email'
      ) {
        if (email === 'N/A') email = val.trim().toLowerCase();
      }

      // Extract Phone Number
      else if (
        key === 'phone_number' ||
        key === 'phone' ||
        key.includes('phone') ||
        key.includes('mobile') ||
        key === 'contact_number'
      ) {
        if (phone === 'N/A') phone = val.trim();
      }

      // Extract Full Name
      else if (
        key === 'full_name' ||
        key === 'name' ||
        key === 'fullname' ||
        key === 'contact_name'
      ) {
        if (name === 'N/A') name = val.trim();
      }

      // Extract First Name
      else if (key === 'first_name' || key === 'firstname' || key === 'fname') {
        firstName = val.trim();
      }

      // Extract Last Name
      else if (key === 'last_name' || key === 'lastname' || key === 'lname') {
        lastName = val.trim();
      }
    });

    // If full_name wasn't explicitly given but first/last names were found
    if (name === 'N/A' && (firstName || lastName)) {
      name = `${firstName} ${lastName}`.trim();
    }

    return { name, email, phone };
  }

  /**
   * Normalizes Meta Graph API lead payload and webhook metadata into a Lead document structure
   * @param {Object} graphData - Lead object from Meta Graph API
   * @param {Object} [webhookMetadata] - Optional metadata from the webhook event
   * @returns {Object} Normalized lead object
   */
  normalizeLeadData(graphData, webhookMetadata = {}) {
    if (!graphData || !graphData.id) {
      throw new Error('Invalid Graph API lead data: missing id');
    }

    const { id, created_time, field_data, form_id, ad_id, adset_id, campaign_id } = graphData;
    const { name, email, phone } = this.extractContactFields(field_data);

    // Submission time: Graph API created_time (ISO string or unix timestamp), fallback to webhook or now
    let submittedAt = new Date();
    if (created_time) {
      submittedAt = typeof created_time === 'number' ? new Date(created_time * 1000) : new Date(created_time);
    } else if (webhookMetadata.created_time) {
      submittedAt = new Date(webhookMetadata.created_time * 1000);
    }

    // Check if test lead (Meta testing tool often sends email dummy-lead@..., <test lead: ...>, or test flags)
    const isTestLead =
      Boolean(webhookMetadata.is_test) ||
      (email && email.includes('test')) ||
      (name && name.toLowerCase().includes('test lead'));

    return {
      leadId: String(id),
      name,
      email,
      phone,
      fieldData: Array.isArray(field_data)
        ? field_data.map(f => ({ name: f.name || 'field', values: f.values || [] }))
        : [],
      pageId: webhookMetadata.page_id ? String(webhookMetadata.page_id) : null,
      formId: form_id ? String(form_id) : webhookMetadata.form_id ? String(webhookMetadata.form_id) : null,
      adId: ad_id ? String(ad_id) : webhookMetadata.ad_id ? String(webhookMetadata.ad_id) : null,
      adgroupId: adset_id ? String(adset_id) : null,
      campaignId: campaign_id ? String(campaign_id) : null,
      submittedAt,
      receivedAt: new Date(),
      source: 'Meta Lead Ads',
      isTestLead,
      rawPayload: graphData
    };
  }

  /**
   * Persists a normalized lead into MongoDB with duplicate prevention
   * @param {Object} normalizedLead
   * @returns {Promise<{ lead: Object, isNew: boolean }>}
   */
  async persistLead(normalizedLead) {
    if (!normalizedLead || !normalizedLead.leadId) {
      throw new Error('Cannot persist lead without valid leadId');
    }

    // Check if lead already exists
    const existing = await Lead.findOne({ leadId: normalizedLead.leadId });
    if (existing) {
      console.log(
        `[LEAD SERVICE DUPLICATE] Lead with leadId=${normalizedLead.leadId} already exists in DB. Skipping duplicate.`
      );
      return { lead: existing, isNew: false };
    }

    try {
      const newLead = await Lead.create(normalizedLead);
      console.log(
        `[LEAD SERVICE PERSIST] Successfully saved new lead to MongoDB: ID=${newLead._id}, LeadID=${newLead.leadId}, Name="${newLead.name}", Email="${newLead.email}"`
      );
      return { lead: newLead, isNew: true };
    } catch (err) {
      // In case of concurrent insert race condition, handle MongoDB unique index error E11000
      if (err.code === 11000) {
        console.warn(
          `[LEAD SERVICE RACE CONDITION] Concurrent insert for leadId=${normalizedLead.leadId}. Fetching existing record.`
        );
        const duplicateLead = await Lead.findOne({ leadId: normalizedLead.leadId });
        return { lead: duplicateLead, isNew: false };
      }
      throw err;
    }
  }
}

module.exports = new LeadProcessingService();
