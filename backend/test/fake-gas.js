/* Simulasi Google Apps Script + SpreadsheetApp (sel ber-format '@' menyimpan semua sebagai teks). Memuat backend/Code.gs apa adanya. */
const vm = require('vm'), fs = require('fs'), path = require('path'), crypto = require('crypto');
function createGas() {
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
const cacheData = {}; let nowMs = Date.parse('2026-11-25T10:00:00Z'), uuidN = 0;
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => book, openById: id => { if (!id) throw new Error('id kosong'); return book; } },
  Utilities: { getUuid: () => crypto.randomUUID(), computeDigest: (_, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)), DigestAlgorithm: { SHA_256: 1 }, Charset: { UTF_8: 1 } },
  CacheService: { getScriptCache: () => ({ get: k => cacheData[k] || null, put: (k, v) => { cacheData[k] = v; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: t => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 1 } },
  Logger: { log() {} }, console, Date, JSON, Math, Object, Array, String, Number, Error, encodeURIComponent, unescape
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
const post = o => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(o) } }).text);
  return { book, post: o => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: typeof o === 'string' ? o : JSON.stringify(o) } }).text), run: n => vm.runInContext(n, ctx) };
}
module.exports = { createGas };
