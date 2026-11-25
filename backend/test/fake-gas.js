/* Simulasi Google Apps Script + SpreadsheetApp (sel ber-format '@' menyimpan semua sebagai teks). Memuat backend/Code.gs apa adanya. */
const vm = require('vm'), fs = require('fs'), path = require('path'), crypto = require('crypto');
function createGas(opts) {
  opts = opts || {};
function mkSheet(name) {
  const s = { name, rows: [], maxR: 1000, maxC: 26, fmt: {}, frozen: 0 };
  const cell = (r, c) => (s.rows[r - 1] || [])[c - 1];
  s.getLastRow = () => { let l = 0; s.rows.forEach((row, i) => { if (row && row.some(v => v !== '' && v != null)) l = i + 1; }); return l; };
  s.getMaxRows = () => s.maxR; s.getMaxColumns = () => s.maxC;
  s.insertRowsAfter = (_, n) => { s.maxR += n; }; s.insertColumnsAfter = (_, n) => { s.maxC += n; }; s.setFrozenRows = n => { s.frozen = n; };
  s.getRange = (r, c, nr = 1, nc = 1) => {
    if (r + nr - 1 > s.maxR) throw new Error('range di luar batas');
    const g = {
      getValues: () => { const o = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) { const v = cell(r + i, c + j); row.push(v == null ? '' : v); } o.push(row); } return o; },
      getValue: () => { const v = cell(r, c); return v == null ? '' : v; },
      setValues: vals => { vals.forEach((row, i) => row.forEach((v, j) => { const rr = r + i - 1; s.rows[rr] = s.rows[rr] || []; const text = s.fmt[(r + i) + ':' + (c + j)] === '@'; s.rows[rr][c + j - 1] = text ? String(v) : v; })); return g; },
      clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (s.rows[r + i - 1]) s.rows[r + i - 1][c + j - 1] = ''; return g; },
      setNumberFormat: f => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) s.fmt[(r + i) + ':' + (c + j)] = f; return g; },
      setFontWeight: () => g, setBackground: () => g
    }; return g;
  };
  return s;
}
const book = { sheets: {}, getSheetByName(n) { return this.sheets[n] || null; }, insertSheet(n) { return (this.sheets[n] = mkSheet(n)); }, getSheets() { return Object.values(this.sheets); }, deleteSheet() {} };
const cacheData = {}, props = { ...opts.props };
let nowMs = Date.now();
const ctx = {
  SpreadsheetApp: { flush() {}, getActiveSpreadsheet: () => book, openById: id => { if (!id) throw new Error('id kosong'); return book; } },
  Utilities: { getUuid: () => crypto.randomUUID(), computeDigest: (_, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)), DigestAlgorithm: { SHA_256: 1 }, Charset: { UTF_8: 1 } },
  CacheService: { getScriptCache: () => ({ get: k => cacheData[k] || null, put: (k, v) => { cacheData[k] = v; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  UrlFetchApp: { fetch: (url, params) => { if (/api\.anthropic\.com|generativelanguage\.googleapis\.com/.test(url)) { const provider = url.includes('api.anthropic.com') ? opts.anthropic : opts.gemini; const r = (provider || (() => ({ code: 500, body: {} })))(JSON.parse(params.payload), params, url); return { getResponseCode: () => r.code, getContentText: () => JSON.stringify(r.body) }; } const tk = decodeURIComponent(String(url).split('id_token=')[1] || ''); const p = tk.split('|'); if (p[0] !== 'tok') return { getResponseCode: () => 400, getContentText: () => '{}' }; return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ aud: p[1], iss: 'https://accounts.google.com', email: p[2], email_verified: p[3], exp: String(Math.floor(Date.now() / 1000) + (+p[4] || 3600)), sub: 'sub-' + p[2], name: p[5] || 'Nama' }) }; } },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: t => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 1 } },
  Logger: { log() {} }, console, Date, JSON, Math, Object, Array, String, Number, Error, encodeURIComponent, unescape
};
vm.createContext(ctx);
let src = fs.readFileSync(path.join(__dirname, '../Code.gs'), 'utf8');
  src = src.replace(/var LAKU_GOOGLE_CLIENT_ID_ = '[^']*';/, "var LAKU_GOOGLE_CLIENT_ID_ = '" + (opts.clientId || '') + "';");   // tes selalu mengatur sendiri Client ID
  vm.runInContext(src, ctx, { filename: 'Code.gs' });
vm.runInContext('GasEnv_', ctx).now = () => nowMs;
  return { book, setNow: date => { nowMs = Date.parse(date); }, post: o => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: typeof o === 'string' ? o : JSON.stringify(o) } }).text), run: n => vm.runInContext(n, ctx) };
}
module.exports = { createGas };
