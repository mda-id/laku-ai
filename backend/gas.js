/* ===== Adaptor Google Apps Script: store = Google Sheets, endpoint = Web App ===== */

var LAKU_FORMAT_ROWS_ = 3000;
/* ID spreadsheet database. Kosongkan bila skrip ini dibuat dari Extensions > Apps Script di dalam spreadsheet-nya. */
var LAKU_SPREADSHEET_ID_ = '';
/* OAuth Client ID (Web application) dari Google Cloud Console untuk Masuk dengan Google. Kosong = fitur nonaktif. */
var LAKU_GOOGLE_CLIENT_ID_ = '';
function book_() { return LAKU_SPREADSHEET_ID_ ? SpreadsheetApp.openById(LAKU_SPREADSHEET_ID_) : SpreadsheetApp.getActiveSpreadsheet(); }

var checked_ = {};
function sheetFor_(name) {
  var ss = book_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (checked_[name]) return sh;
  var cols = LakuCore.TABLES[name];
  if (sh.getLastRow() < 1 || String(sh.getRange(1, 1).getValue()) !== cols[0]) initSheet_(sh, name);
  else migrateHeader_(sh, name);
  checked_[name] = 1;
  return sh;
}

/* Bila kode menambah kolom baru (mis. logo), header dan format teks ditambahkan otomatis tanpa menyentuh data. */
function migrateHeader_(sh, name) {
  var cols = LakuCore.TABLES[name];
  if (sh.getMaxColumns() < cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), cols.length - sh.getMaxColumns());
  var hdr = sh.getRange(1, 1, 1, cols.length).getValues()[0], same = true;
  for (var i = 0; i < cols.length; i++) if (String(hdr[i]) !== cols[i]) same = false;
  if (same) return;
  sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length).setNumberFormat('@');
  sh.getRange(1, 1, 1, cols.length).setNumberFormat('@').setValues([cols]).setFontWeight('bold').setBackground('#E6F4EA');
}

function initSheet_(sh, name) {
  var cols = LakuCore.TABLES[name];
  if (sh.getMaxColumns() < cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), cols.length - sh.getMaxColumns());
  if (sh.getMaxRows() < LAKU_FORMAT_ROWS_) sh.insertRowsAfter(sh.getMaxRows(), LAKU_FORMAT_ROWS_ - sh.getMaxRows());
  sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length).setNumberFormat('@'); // teks polos: cegah tanggal/nomor WA berubah format
  sh.getRange(1, 1, 1, cols.length).setNumberFormat('@').setValues([cols]).setFontWeight('bold').setBackground('#E6F4EA');
  sh.setFrozenRows(1);
}

function rowToObj_(cols, v) { var o = {}; for (var i = 0; i < cols.length; i++) o[cols[i]] = v[i]; return o; }
function objToRow_(cols, o) { return cols.map(function (c) { return o[c] == null ? '' : o[c]; }); }

var GasStore_ = {
  all: function (t) {
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], last = sh.getLastRow();
    if (last < 2) return [];
    return sh.getRange(2, 1, last - 1, cols.length).getValues().map(function (v) { return rowToObj_(cols, v); });
  },
  append: function (t, rows) {
    if (!rows.length) return;
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], start = Math.max(sh.getLastRow(), 1) + 1, need = start + rows.length - 1;
    if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows() + 500);
    var rng = sh.getRange(start, 1, rows.length, cols.length);
    rng.setNumberFormat('@');
    rng.setValues(rows.map(function (o) { return objToRow_(cols, o); }));
  },
  update: function (t, pred, fn) {
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], last = sh.getLastRow();
    if (last < 2) return;
    var vals = sh.getRange(2, 1, last - 1, cols.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      var o = rowToObj_(cols, vals[i]);
      if (pred(o)) { fn(o); sh.getRange(i + 2, 1, 1, cols.length).setValues([objToRow_(cols, o)]); }
    }
  },
  remove: function (t, pred) {
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], last = sh.getLastRow();
    if (last < 2) return;
    var vals = sh.getRange(2, 1, last - 1, cols.length).getValues();
    var keep = vals.filter(function (v) { return !pred(rowToObj_(cols, v)); });
    if (keep.length === vals.length) return;
    sh.getRange(2, 1, last - 1, cols.length).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, cols.length).setValues(keep);
  }
};

var GasEnv_ = {
  now: function () { return Date.now(); },
  randomHex: function (n) { return (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, n); },
  sha256: function (s) {
    var d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8), h = '';
    for (var i = 0; i < d.length; i++) { var b = (d[i] + 256) % 256; h += (b < 16 ? '0' : '') + b.toString(16); }
    return h;
  },
  googleEnabled: function () { return !!LAKU_GOOGLE_CLIENT_ID_; },
  verifyGoogle: function (idToken) {
    if (!LAKU_GOOGLE_CLIENT_ID_ || !idToken) throw new Error('nonaktif');
    var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('token ditolak');
    var t = JSON.parse(res.getContentText());
    if (t.aud !== LAKU_GOOGLE_CLIENT_ID_) throw new Error('aud tidak cocok');
    if (['accounts.google.com', 'https://accounts.google.com'].indexOf(t.iss) < 0) throw new Error('iss salah');
    if (String(t.email_verified) !== 'true') throw new Error('email belum terverifikasi');
    if (Number(t.exp) * 1000 < Date.now()) throw new Error('kedaluwarsa');
    return { sub: t.sub, email: t.email, name: t.name };
  },
  cache: { get: function (k) { return CacheService.getScriptCache().get(k); }, put: function (k, v, ttl) { CacheService.getScriptCache().put(k, v, ttl); } }
};

/* ===== Riset harga pasar (AI) =====
   Simpan kunci hanya di Project Settings > Script properties. Gemini dipilih bila GEMINI_API_KEY tersedia. */
var LAKU_AI_MODEL_ = 'claude-opus-5-5';
function aiKey_() { return PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') || ''; }
/* Hitung setiap panggilan provider, termasuk retry dan hasil gagal. */
function reserveAiCall_() {
  GasEnv_.locked(function () {
    var props = PropertiesService.getScriptProperties();
    var configured = props.getProperty('RISET_API_LIMIT_HARIAN');
    var limit = configured === null ? 30 : Number(configured);
    var day = new Date(GasEnv_.now() + 7 * 3600000).toISOString().slice(0, 10);
    var counter = JSON.parse(props.getProperty('RISET_API_COUNTER') || '{}');
    var used = counter.day === day ? counter.used : 0;
    if (!Number.isSafeInteger(limit) || limit <= 0 || used >= limit) {
      var e = new Error('Batas riset otomatis aplikasi hari ini tercapai. Coba besok atau pakai riset manual.');
      e.code = 'budget';
      throw e;
    }
    props.setProperty('RISET_API_COUNTER', JSON.stringify({ day: day, used: used + 1 }));
  });
}
function aiAnthropic_(p) {
  var key = aiKey_(); if (!key) throw new Error('kunci API belum dipasang');
  var pr = LakuCore.risetPrompt(p), user = pr.user;
  var msgs = [{ role: 'user', content: user }], fb = true, text = null, turns = 0, guard = 0;
  while (text === null && guard++ < 6) {
    var body = { model: LAKU_AI_MODEL_, max_tokens: 8000, system: pr.system, messages: msgs, output_config: { effort: 'low' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5, user_location: { type: 'approximate', city: p.kota, country: 'ID', timezone: 'Asia/Jakarta' } }] };
    var headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01' };
    if (fb) { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
    reserveAiCall_();
    var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', headers: headers, payload: JSON.stringify(body), muteHttpExceptions: true });
    var code = res.getResponseCode(), out = {}; try { out = JSON.parse(res.getContentText()); } catch (e) { out = {}; }
    var em = String((out.error && out.error.message) || '').split(key).join('***').replace(/sk-ant-[A-Za-z0-9_-]+/g, '***');
    if (code === 400 && fb && /fallback/i.test(em)) { fb = false; continue; }
    if (code !== 200) throw new Error('layanan AI HTTP ' + code + (em ? ': ' + String(em).slice(0, 100) : ''));
    if (out.stop_reason === 'refusal') throw new Error('permintaan ditolak oleh layanan AI');
    if (out.stop_reason === 'pause_turn' && turns++ < 3) { msgs.push({ role: 'assistant', content: out.content }); continue; }
    text = (out.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n');
  }
  if (text === null) throw new Error('riset tidak selesai');
  var a = text.indexOf('{'), z = text.lastIndexOf('}'); if (a < 0 || z <= a) throw new Error('jawaban AI bukan JSON');
  return JSON.parse(text.slice(a, z + 1));
}
function geminiKey_() { return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || ''; }
function aiGemini_(p, key) {
  var model = PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
  if (!/^gemini-[a-z0-9.-]+$/.test(model)) throw new Error('GEMINI_MODEL tidak valid');
  var pr = LakuCore.risetPrompt(p, true);
  var search = 'Langkah pertama: gunakan Google Search untuk mencari daftar harga jual publik. ' +
    'Cari produk, satuan, dan wilayah berikut: ' + p.produk + ' / ' + p.satuan + ' / ' + p.kota + '. ' +
    'Jika pembanding setempat terbatas, cari wilayah sekitar dan jelaskan cakupannya. ' +
    'Gunakan hanya harga dari halaman yang ditemukan dan sertakan tautan tiap pembanding. Cantumkan sitasi Google Search pada bagian bukti harga sebelum JSON.';
  var body = {
    model: model,
    system_instruction: pr.system,
    input: search + '\n\n' + pr.user,
    tools: [{ type: 'google_search' }],
    generation_config: { max_output_tokens: 4096 },
    store: false
  };
  reserveAiCall_();
  var res;
  try {
    res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key, 'Api-Revision': '2026-05-20' },
      payload: JSON.stringify(body), muteHttpExceptions: true
    });
  } catch (e) { throw new Error('koneksi ke Gemini gagal'); }
  var code = res.getResponseCode();
  if (code === 429 || code === 403) throw new Error('Gemini HTTP ' + code + ': periksa kuota dan akses Google Search pada proyek API. Riset manual tetap tersedia.');
  if (code !== 200) throw new Error('layanan Gemini HTTP ' + code);
  var out = JSON.parse(res.getContentText());
  var queries = 0, sources = 0, parts = [];
  var status = out.status || 'unknown';
  (out.steps || []).forEach(function (step) {
    if (step.type === 'google_search_call') {
      queries += ((step.arguments || {}).queries || []).filter(Boolean).length;
    }
    if (step.type !== 'model_output') return;
    (step.content || []).forEach(function (part) {
      if (part.type !== 'text' || typeof part.text !== 'string') return;
      parts.push(part.text);
      sources += (part.annotations || []).filter(function (annotation) {
        return annotation.type === 'url_citation' && /^https?:\/\//i.test(annotation.url || '');
      }).length;
    });
  });
  if (out.status && out.status !== 'completed') {
    var knownStatus = /^(in_progress|requires_action|failed|cancelled|canceled|incomplete)$/.test(status) ? status : 'unknown';
    Logger.log(JSON.stringify({
      event: 'gemini_interaction_unfinished', model: model, status: knownStatus,
      searchQueries: queries, webSources: sources
    }));
    throw new Error('Gemini belum menyelesaikan riset (status: ' + knownStatus + '). Pakai riset manual.');
  }
  if (!sources) {
    Logger.log(JSON.stringify({
      event: 'gemini_grounding_missing', model: model, status: /^[a-z_]+$/.test(status) ? status : 'unknown',
      searchQueries: queries, webSources: sources
    }));
    if (queries) throw new Error('Gemini menjalankan pencarian, tetapi respons API tidak menyertakan tautan sumber. Pakai riset manual.');
    throw new Error('Respons Gemini tidak mencatat pencarian atau tautan sumber. Pakai riset manual.');
  }
  var text = parts.join('\n');
  var first = text.indexOf('{'), last = text.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('jawaban Gemini bukan JSON');
  return JSON.parse(text.slice(first, last + 1));
}
GasEnv_.aiEnabled = function () { return !!(geminiKey_() || aiKey_()); };
GasEnv_.ai = function (p) {
  var key = geminiKey_();
  return key ? aiGemini_(p, key) : aiAnthropic_(p);
};
GasEnv_.locked = function (fn) { var lock = LockService.getScriptLock(); lock.waitLock(25000); try { return fn(); } finally { try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); } } };

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) {
  var res, lock = LockService.getScriptLock(), locked = false;
  try {
    var content = e && e.postData && e.postData.contents;
    if (typeof content !== 'string' || content.length > 1024 * 1024) return json_({ ok: false, error: 'limit', message: 'Permintaan terlalu besar atau tidak valid.' });
    var q = JSON.parse(content);
    if (q.action !== 'ping' && q.action !== 'riset') { lock.waitLock(25000); locked = true; }   // riset mengunci sendiri hanya saat baca/tulis (panggilan AI bisa lama)
    res = LakuCore.create(GasStore_, GasEnv_).handle(q);
  } catch (err) {
    res = { ok: false, error: 'server', message: 'Terjadi kesalahan di server.' };
  } finally {
    if (locked) { try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); } }
  }
  return json_(res);
}

function doGet() { return json_({ ok: true, data: { service: 'laku-ai', status: 'siap', hint: 'Gunakan POST dari aplikasi laku.ai' } }); }

/* Jalankan dari editor (pilih fungsi "cekGoogle" lalu Run) untuk memberi izin akses eksternal dan memeriksa koneksi ke Google. Log yang benar: HTTP 400 dan Client ID terpasang. */
function cekGoogle() {
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=uji', { muteHttpExceptions: true });
  Logger.log('Koneksi ke Google OK (HTTP ' + r.getResponseCode() + ', 400 = normal untuk token uji)');
  Logger.log('Client ID terpasang: ' + (LAKU_GOOGLE_CLIENT_ID_ || '(KOSONG: Masuk dengan Google nonaktif)'));
}

/* Jalankan SEKALI dari editor (pilih fungsi "setup" lalu Run) untuk memberi izin dan menyiapkan semua tab. */
function setup() {
  Object.keys(LakuCore.TABLES).forEach(function (t) { sheetFor_(t); });
  var s = book_().getSheetByName('Sheet1');
  if (s && s.getLastRow() === 0 && book_().getSheets().length > 1) book_().deleteSheet(s);
  Logger.log('Siap. Tab: ' + Object.keys(LakuCore.TABLES).join(', '));
}
