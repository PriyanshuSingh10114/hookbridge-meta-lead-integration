#!/usr/bin/env node

function extractContactFields(fieldData = []) {
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

function normalizeLead(graphData, metadata = {}) {
  if (!graphData || !graphData.id) {
    throw new Error('Missing Graph API lead id');
  }

  const { id, created_time, field_data, form_id, ad_id, adset_id, campaign_id } = graphData;
  const { name, email, phone } = extractContactFields(field_data);

  let submittedAt = new Date();
  if (created_time) {
    submittedAt = typeof created_time === 'number' ? new Date(created_time * 1000) : new Date(created_time);
  } else if (metadata.created_time) {
    submittedAt = new Date(metadata.created_time * 1000);
  }

  const isTestLead =
    Boolean(metadata.is_test) ||
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
    pageId: metadata.page_id ? String(metadata.page_id) : null,
    formId: form_id ? String(form_id) : metadata.form_id ? String(metadata.form_id) : null,
    adId: ad_id ? String(ad_id) : metadata.ad_id ? String(metadata.ad_id) : null,
    adgroupId: adset_id ? String(adset_id) : null,
    campaignId: campaign_id ? String(campaign_id) : null,
    submittedAt,
    receivedAt: new Date(),
    source: 'Meta Lead Ads',
    isTestLead
  };
}

if (require.main === module) {
  const sampleGraphPayload = {
    id: '123456789012345',
    created_time: '2026-11-20T10:30:00+0000',
    form_id: 'form_998877',
    field_data: [
      { name: 'first_name', values: ['Alexander'] },
      { name: 'last_name', values: ['Hamilton'] },
      { name: 'work_email', values: ['a.hamilton@treasury.gov'] },
      { name: 'contact_number', values: ['+1-212-555-1789'] },
      { name: 'inquiry_topic', values: ['Enterprise Financial Systems'] }
    ]
  };

  console.log('Testing Meta Lead Normalization:');
  console.log('--------------------------------');
  const normalized = normalizeLead(sampleGraphPayload);
  console.log('Extracted Name:', normalized.name);
  console.log('Extracted Email:', normalized.email);
  console.log('Extracted Phone:', normalized.phone);
  console.log('Is Test Lead:', normalized.isTestLead);
  console.log('Normalized Output:');
  console.log(JSON.stringify(normalized, null, 2));
}

module.exports = {
  extractContactFields,
  normalizeLead
};
