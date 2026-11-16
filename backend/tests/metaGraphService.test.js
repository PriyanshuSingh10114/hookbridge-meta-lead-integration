const axios = require('axios');
const metaGraphService = require('../src/services/metaGraphService');

jest.mock('axios');

describe('Meta Graph API Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve lead details from Graph API', async () => {
    const mockLeadData = {
      id: '1234567890',
      created_time: '2026-11-16T12:00:00+0000',
      field_data: [
        { name: 'full_name', values: ['John Doe'] },
        { name: 'email', values: ['john.doe@example.com'] },
        { name: 'phone_number', values: ['+15551234567'] }
      ],
      form_id: '9988776655'
    };

    axios.get.mockResolvedValueOnce({
      status: 200,
      data: mockLeadData
    });

    const result = await metaGraphService.getLeadDetails('1234567890');
    expect(result).toBeDefined();
    expect(result.id).toBe('1234567890');
    expect(result.field_data).toHaveLength(3);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/1234567890'),
      expect.objectContaining({
        params: expect.objectContaining({
          fields: expect.stringContaining('field_data')
        })
      })
    );
  });

  it('should throw an error if leadgenId is missing', async () => {
    await expect(metaGraphService.getLeadDetails(null)).rejects.toThrow(
      'leadgenId is required'
    );
  });

  it('should handle invalid/expired token error (Code 190)', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Error validating access token: Session has expired',
            type: 'OAuthException',
            code: 190,
            error_subcode: 463
          }
        }
      }
    };

    axios.get.mockRejectedValueOnce(errorResponse);

    await expect(metaGraphService.getLeadDetails('1234567890')).rejects.toThrow(
      /Meta Access Token expired/
    );
  });

  it('should handle permission errors (Code 200)', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Requires leads_retrieval permission to access lead details',
            type: 'OAuthException',
            code: 200
          }
        }
      }
    };

    axios.get.mockRejectedValueOnce(errorResponse);

    await expect(metaGraphService.getLeadDetails('1234567890')).rejects.toThrow(
      /Insufficient Meta permissions/
    );
  });

  it('should handle rate limit errors (Code 4 / 17 / 32 / 613)', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Application request limit reached',
            type: 'OAuthException',
            code: 4
          }
        }
      }
    };

    axios.get.mockRejectedValueOnce(errorResponse);

    await expect(metaGraphService.getLeadDetails('1234567890')).rejects.toThrow(
      /Meta Graph API rate limit reached/
    );
  });

  it('should sanitize tokens when logging without exposing full credentials', () => {
    const sanitized = metaGraphService.sanitizeToken('EAABwz123456789xyzToken');
    expect(sanitized).toBe('EAAB...oken');
    expect(metaGraphService.sanitizeToken(null)).toBe('none');
  });
});
