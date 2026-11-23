const axios = require('axios');
const config = require('../config');

class MetaGraphService {
  static mockLeads = new Map();

  constructor() {
    this.apiVersion = config.meta.graphApiVersion;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  sanitizeToken(token) {
    if (!token || typeof token !== 'string') return 'none';
    if (token.length <= 8) return '***';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  }

  async getLeadDetails(leadgenId, customPageAccessToken = null) {
    if (!leadgenId) {
      throw new Error('leadgenId is required to retrieve lead details');
    }

    if (MetaGraphService.mockLeads.has(leadgenId)) {
      return MetaGraphService.mockLeads.get(leadgenId);
    }

    if (leadgenId.startsWith('sim_')) {
      return {
        id: leadgenId,
        created_time: Math.floor(Date.now() / 1000),
        form_id: 'form_11223344',
        ad_id: 'ad_99887766',
        field_data: [
          { name: 'full_name', values: ['Sarah Connor'] },
          { name: 'email', values: ['sarah.connor@sky-res.org'] },
          { name: 'phone_number', values: ['+1-555-888-9999'] }
        ]
      };
    }

    const accessToken = customPageAccessToken || config.meta.pageAccessToken;

    if (!accessToken) {
      throw new Error('META_PAGE_ACCESS_TOKEN is missing. Please configure it in your environment variables.');
    }

    const fields = [
      'id',
      'created_time',
      'field_data',
      'form_id',
      'ad_id',
      'adset_id',
      'campaign_id',
      'is_organic',
      'platform'
    ].join(',');

    const endpoint = `${this.baseUrl}/${leadgenId}`;

    try {
      const response = await axios.get(endpoint, {
        params: {
          fields,
          access_token: accessToken
        },
        timeout: 10000,
        headers: {
          Accept: 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      this.handleGraphApiError(error, leadgenId);
    }
  }

  handleGraphApiError(error, leadgenId) {
    if (error.response && error.response.data && error.response.data.error) {
      const metaErr = error.response.data.error;
      const { code, error_subcode, message, type } = metaErr;

      console.error(`[META GRAPH API ERROR] Lead ID: ${leadgenId} - Code: ${code}, Subcode: ${error_subcode}, Type: ${type}`);
      console.error(`[META GRAPH API ERROR MESSAGE]: ${message}`);

      if (code === 190) {
        if (error_subcode === 463 || error_subcode === 467) {
          throw new Error(`Meta Access Token expired. Please re-generate your Page Access Token. [${code}]`);
        }
        throw new Error(`Invalid Meta Access Token: ${message} [${code}]`);
      }

      if (code === 200 || code === 298) {
        throw new Error(
          `Insufficient Meta permissions (leads_retrieval / pages_manage_ads required). Details: ${message} [${code}]`
        );
      }

      if (code === 4 || code === 17 || code === 32 || code === 613) {
        throw new Error(`Meta Graph API rate limit reached. Please retry shortly. [${code}]`);
      }

      if (code === 100) {
        throw new Error(`Leadgen object ${leadgenId} not found or unsupported fields requested. [${code}]`);
      }

      throw new Error(`Meta Graph API Error [${code}]: ${message}`);
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error(`[META GRAPH API TIMEOUT] Request for lead ${leadgenId} timed out`);
      throw new Error(`Meta Graph API connection timed out for lead ${leadgenId}`);
    }

    throw error;
  }
}

module.exports = new MetaGraphService();
module.exports.MetaGraphService = MetaGraphService;
