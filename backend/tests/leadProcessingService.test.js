const leadProcessingService = require('../src/services/leadProcessingService');

describe('Lead Processing Service Tests', () => {
  it('should extract full name, email, and phone from standard fields', () => {
    const fieldData = [
      { name: 'full_name', values: ['Jane Smith'] },
      { name: 'email', values: ['Jane.Smith@Example.COM'] },
      { name: 'phone_number', values: ['+1-555-987-6543'] }
    ];

    const extracted = leadProcessingService.extractContactFields(fieldData);
    expect(extracted.name).toBe('Jane Smith');
    expect(extracted.email).toBe('jane.smith@example.com');
    expect(extracted.phone).toBe('+1-555-987-6543');
  });

  it('should construct full name when first_name and last_name are separate fields', () => {
    const fieldData = [
      { name: 'first_name', values: ['Alice'] },
      { name: 'last_name', values: ['Johnson'] },
      { name: 'email', values: ['alice@example.com'] }
    ];

    const extracted = leadProcessingService.extractContactFields(fieldData);
    expect(extracted.name).toBe('Alice Johnson');
    expect(extracted.email).toBe('alice@example.com');
    expect(extracted.phone).toBe('N/A');
  });

  it('should normalize Graph API response and preserve fieldData', () => {
    const graphData = {
      id: '998877665544',
      created_time: '2026-11-16T10:30:00+0000',
      field_data: [
        { name: 'full_name', values: ['Bob Ross'] },
        { name: 'email', values: ['bob@art.com'] }
      ],
      form_id: '11223344',
      ad_id: '556677'
    };

    const metadata = {
      page_id: '77889900',
      form_id: '11223344'
    };

    const normalized = leadProcessingService.normalizeLeadData(graphData, metadata);
    expect(normalized.leadId).toBe('998877665544');
    expect(normalized.name).toBe('Bob Ross');
    expect(normalized.email).toBe('bob@art.com');
    expect(normalized.pageId).toBe('77889900');
    expect(normalized.formId).toBe('11223344');
    expect(normalized.fieldData).toHaveLength(2);
    expect(normalized.source).toBe('Meta Lead Ads');
  });

  it('should detect test leads from Meta Lead Ads Testing Tool', () => {
    const testGraphData = {
      id: 'test_lead_001',
      created_time: 1700000000,
      field_data: [
        { name: 'full_name', values: ['<test lead: dummy data>'] },
        { name: 'email', values: ['test-lead@fb.com'] }
      ]
    };

    const normalized = leadProcessingService.normalizeLeadData(testGraphData, { is_test: true });
    expect(normalized.isTestLead).toBe(true);
  });
});
