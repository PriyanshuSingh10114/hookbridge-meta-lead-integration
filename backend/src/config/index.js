require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hookbridge',
  meta: {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    verifyToken: process.env.META_VERIFY_TOKEN || 'hookbridge_verify_token_secure_2026',
    pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || '',
    graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v21.0',
    get graphBaseUrl() {
      return `https://graph.facebook.com/${this.graphApiVersion}`;
    }
  },
  cors: {
    origin: process.env.CLIENT_URL || '*'
  }
};

module.exports = config;

