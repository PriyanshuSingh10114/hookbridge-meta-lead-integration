const Lead = require('../models/Lead');

class LeadProcessingService {
  // Extracts common contact fields from Meta's field_data array
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

      if (key === 'email' || key.includes('email') || key.includes('e-mail') || key === 'work_email') {
        if (email === 'N/A') email = val.trim().toLowerCase();
      } else if (key === 'phone_number' || key === 'phone' || key.includes('phone') || key.includes('mobile') || key === 'contact_number') {
        if (phone === 'N/A') phone = val.trim();
      } else if (key === 'full_name' || key === 'name' || key === 'fullname' || key === 'contact_name') {
        if (name === 'N/A') name = val.trim();
      } else if (key === 'first_name' || key === 'firstname' || key === 'fname') {
        firstName = val.trim();
      } else if (key === 'last_name' || key === 'lastname' || key === 'lname') {
        lastName = val.trim();
      }
    });

    if (name === 'N/A' && (firstName || lastName)) {
      name = `${firstName} ${lastName}`.trim();
    }

    return { name, email, phone };
  }

  // Normalizes Graph API response + webhook metadata into standard Lead document structure
  normalizeLeadData(graphData, webhookMetadata = {}) {
    if (!graphData || !graphData.id) {
      throw new Error('Invalid Graph API lead data: missing id');
    }

    const { id, created_time, field_data, form_id, ad_id, adset_id, campaign_id } = graphData;
    const { name, email, phone } = this.extractContactFields(field_data);

    let submittedAt = new Date();
    if (created_time) {
      submittedAt = typeof created_time === 'number' ? new Date(created_time * 1000) : new Date(created_time);
    } else if (webhookMetadata.created_time) {
      submittedAt = new Date(webhookMetadata.created_time * 1000);
    }

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

  // Saves lead to MongoDB; handles duplicate detection via index constraint
  async persistLead(normalizedLead) {
    if (!normalizedLead || !normalizedLead.leadId) {
      throw new Error('Cannot persist lead without valid leadId');
    }

    const existing = await Lead.findOne({ leadId: normalizedLead.leadId });
    if (existing) {
      return { lead: existing, isNew: false };
    }

    try {
      const newLead = await Lead.create(normalizedLead);
      return { lead: newLead, isNew: true };
    } catch (err) {
      // Handle concurrent insert race condition (Mongo duplicate key code 11000)
      if (err.code === 11000) {
        const duplicateLead = await Lead.findOne({ leadId: normalizedLead.leadId });
        return { lead: duplicateLead, isNew: false };
      }
      throw err;
    }
  }
}

module.exports = new LeadProcessingService();

