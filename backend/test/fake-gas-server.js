/* Server HTTP lokal yang meniru Web App Apps Script (untuk uji e2e mode "sheets"). Jalankan: node fake-gas-server.js [port] */
const http = require('http'); const { createGas } = require('./fake-gas');
const G = createGas({ clientId: process.env.CLIENT_ID || '' }); G.run('setup')();
const port = +process.argv[2] || 8790;
http.createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (req.method === 'GET' && req.url === '/__dump') { res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }); const o = {}; Object.entries(G.book.sheets).forEach(([k, s]) => o[k] = s.rows.filter(r => r && r.some(v => v !== '')).length - 1); return res.end(JSON.stringify(o)); }
  let body = ''; req.on('data', c => body += c); req.on('end', () => { const out = JSON.stringify(G.post(body || '{}')); res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }); res.end(out); });
}).listen(port, () => console.log('fake GAS di http://localhost:' + port));
