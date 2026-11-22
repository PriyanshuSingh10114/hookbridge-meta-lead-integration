const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const config = require('../src/config');
const webhookController = require('../src/controllers/webhook.controller');

jest.spyOn(webhookController, 'processLeadEventAsync').mockImplementation(() => Promise.resolve());

describe('Meta Webhook Integration Tests', () => {
  const verifyToken = config.meta.verifyToken;
  const appSecret = config.meta.appSecret;

  describe('GET /webhooks/meta (Webhook Verification Handshake)', () => {
    it('should return challenge with 200 when verify_token matches', async () => {
      const challenge = 'random_challenge_string_12345';
      const response = await request(app)
        .get('/webhooks/meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': challenge
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe(challenge);
    });

    it('should return 403 Forbidden when verify_token does not match', async () => {
      const response = await request(app)
        .get('/webhooks/meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': '12345'
        });

      expect(response.status).toBe(403);
      expect(response.text).toContain('Verification token mismatch');
    });

    it('should return 400 Bad Request when required params are missing', async () => {
      const response = await request(app).get('/webhooks/meta');
      expect(response.status).toBe(400);
    });
  });

  describe('POST /webhooks/meta (Event Notification & Signature Validation)', () => {
    const validPayload = {
      object: 'page',
      entry: [
        {
          id: '10987654321',
          time: 1700000000,
          changes: [
            {
              field: 'leadgen',
              value: {
                ad_id: '4455667788',
                form_id: '9988776655',
                leadgen_id: '123456789012345',
                created_time: 1700000000,
                page_id: '10987654321'
              }
            }
          ]
        }
      ]
    };

    const generateSignature = (payload, secret) => {
      const raw = Buffer.from(JSON.stringify(payload));
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(raw);
      return `sha256=${hmac.digest('hex')}`;
    };

    it('should accept valid payload with valid HMAC signature and return EVENT_RECEIVED', async () => {
      const signature = generateSignature(validPayload, appSecret);

      const response = await request(app)
        .post('/webhooks/meta')
        .set('x-hub-signature-256', signature)
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.text).toBe('EVENT_RECEIVED');
      expect(webhookController.processLeadEventAsync).toHaveBeenCalledWith(
        '123456789012345',
        expect.objectContaining({
          page_id: '10987654321',
          form_id: '9988776655'
        })
      );
    });

    it('should reject POST with 403 when signature does not match app secret', async () => {
      const invalidSignature = generateSignature(validPayload, 'incorrect_secret_abc');

      const response = await request(app)
        .post('/webhooks/meta')
        .set('x-hub-signature-256', invalidSignature)
        .send(validPayload);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid webhook signature');
    });

    it('should reject POST with 401 when X-Hub-Signature-256 is missing', async () => {
      const response = await request(app)
        .post('/webhooks/meta')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Missing X-Hub-Signature-256 header');
    });

    it('should return 404 if webhook object is not page', async () => {
      const invalidObjectPayload = { object: 'user', entry: [] };
      const signature = generateSignature(invalidObjectPayload, appSecret);

      const response = await request(app)
        .post('/webhooks/meta')
        .set('x-hub-signature-256', signature)
        .send(invalidObjectPayload);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Expected object: page');
    });
  });
});

