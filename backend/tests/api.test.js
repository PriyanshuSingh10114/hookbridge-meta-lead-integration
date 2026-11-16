const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Lead = require('../src/models/Lead');

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

describe('REST API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health check details and 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database.connected).toBe(true);
      expect(res.body.realtime).toBeDefined();
    });
  });

  describe('GET /api/leads', () => {
    it('should return empty list when no leads exist', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should return paginated list of leads', async () => {
      await Lead.create([
        { leadId: 'lead_1', name: 'User 1', email: 'u1@test.com' },
        { leadId: 'lead_2', name: 'User 2', email: 'u2@test.com' }
      ]);

      const res = await request(app).get('/api/leads?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should retrieve a lead by Meta leadId', async () => {
      const created = await Lead.create({
        leadId: 'meta_specific_999',
        name: 'Specific User',
        email: 'specific@test.com'
      });

      const res = await request(app).get('/api/leads/meta_specific_999');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leadId).toBe('meta_specific_999');
      expect(res.body.data.name).toBe('Specific User');
    });

    it('should return 404 if lead does not exist', async () => {
      const res = await request(app).get('/api/leads/non_existent_id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
