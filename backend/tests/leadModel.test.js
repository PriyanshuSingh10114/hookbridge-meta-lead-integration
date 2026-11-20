const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Lead = require('../src/models/Lead');
const leadProcessingService = require('../src/services/leadProcessingService');

jest.setTimeout(180000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Lead.deleteMany({});
});

describe('MongoDB Lead Model & Persistence Tests', () => {
  it('should successfully save a valid lead', async () => {
    const lead = await Lead.create({
      leadId: 'meta_lead_123',
      name: 'Bruce Wayne',
      email: 'bruce@wayne-enterprises.com',
      phone: '+1-555-BATMAN',
      formId: 'form_999'
    });

    expect(lead._id).toBeDefined();
    expect(lead.leadId).toBe('meta_lead_123');
    expect(lead.source).toBe('Meta Lead Ads');
  });

  it('should reject duplicate lead insertion with duplicate key error', async () => {
    await Lead.create({
      leadId: 'duplicate_id_001',
      name: 'First Entry',
      email: 'first@example.com'
    });

    let duplicateError;
    try {
      await Lead.create({
        leadId: 'duplicate_id_001',
        name: 'Second Entry',
        email: 'second@example.com'
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });

  it('should prevent duplicate persistence in leadProcessingService without throwing', async () => {
    const payload = {
      leadId: 'unique_lead_abc',
      name: 'Clark Kent',
      email: 'clark@dailyplanet.com'
    };

    const firstResult = await leadProcessingService.persistLead(payload);
    expect(firstResult.isNew).toBe(true);
    expect(firstResult.lead.leadId).toBe('unique_lead_abc');

    // Attempt to persist the exact same lead again
    const secondResult = await leadProcessingService.persistLead(payload);
    expect(secondResult.isNew).toBe(false);
    expect(secondResult.lead.leadId).toBe('unique_lead_abc');

    const totalLeads = await Lead.countDocuments({ leadId: 'unique_lead_abc' });
    expect(totalLeads).toBe(1);
  });

  it('should query leads sorted by newest submittedAt', async () => {
    const t1 = new Date('2026-11-16T10:00:00Z');
    const t2 = new Date('2026-11-16T11:00:00Z');
    const t3 = new Date('2026-11-16T12:00:00Z');

    await Lead.create([
      { leadId: 'lead_1', name: 'Lead 1', submittedAt: t1 },
      { leadId: 'lead_3', name: 'Lead 3', submittedAt: t3 },
      { leadId: 'lead_2', name: 'Lead 2', submittedAt: t2 }
    ]);

    const results = await Lead.find().sort({ submittedAt: -1 });
    expect(results[0].leadId).toBe('lead_3');
    expect(results[1].leadId).toBe('lead_2');
    expect(results[2].leadId).toBe('lead_1');
  });
});

