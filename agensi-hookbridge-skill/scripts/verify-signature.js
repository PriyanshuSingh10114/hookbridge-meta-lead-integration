#!/usr/bin/env node

const crypto = require('crypto');

function computeHmacSignature(rawBody, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody));
  return 'sha256=' + hmac.digest('hex');
}

function verifyHmacSignature(rawBody, headerSignature, secret) {
  if (!headerSignature || !headerSignature.startsWith('sha256=')) {
    return false;
  }

  const expectedSigHex = computeHmacSignature(rawBody, secret).split('=')[1];
  const providedSigHex = headerSignature.split('=')[1];

  const expectedBuf = Buffer.from(expectedSigHex, 'hex');
  const providedBuf = Buffer.from(providedSigHex, 'hex');

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

if (require.main === module) {
  const samplePayload = JSON.stringify({
    object: 'page',
    entry: [{ id: '102938', changes: [{ field: 'leadgen', value: { leadgen_id: 'sample_123' } }] }]
  });
  const sampleSecret = process.argv[2] || 'demo_meta_app_secret_123';

  console.log('Testing HMAC-SHA256 Signature Verification');
  console.log('-------------------------------------------');
  console.log('Secret:', sampleSecret);
  console.log('Payload:', samplePayload);

  const sig = computeHmacSignature(samplePayload, sampleSecret);
  console.log('Generated Signature:', sig);

  const isValid = verifyHmacSignature(samplePayload, sig, sampleSecret);
  console.log('Verification Passed:', isValid);

  const isInvalidRejected = !verifyHmacSignature(samplePayload, 'sha256=wrong_signature', sampleSecret);
  console.log('Invalid Signature Rejected:', isInvalidRejected);
}

module.exports = {
  computeHmacSignature,
  verifyHmacSignature
};
