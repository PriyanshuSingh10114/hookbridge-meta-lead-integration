const http = require('http');
const name = process.argv[2] || 'Bruce Wayne';
const email = process.argv[3] || 'bruce@wayne-enterprises.com';
const phone = process.argv[4] || '+1-555-BATMAN';

const payload = JSON.stringify({ name, email, phone });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/leads/test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('----------------------------------------------------');
console.log('  HOOKBRIDGE REAL-TIME LEAD TRIGGER');
console.log('----------------------------------------------------');
console.log(`Sending Lead: "${name}" (${email}, ${phone})`);

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('SUCCESS: Lead saved in MongoDB & broadcasted via Socket.IO!');
      console.log('Check your open React Native screen to see it live.');
    } else {
      console.error(`ERROR: Server returned status ${res.statusCode}: ${data}`);
    }
  });
});

req.on('error', err => {
  console.error('ERROR: Could not reach backend server at http://localhost:5000');
  console.error('Make sure the backend is running (cd backend && npm run dev)');
});

req.write(payload);
req.end();
