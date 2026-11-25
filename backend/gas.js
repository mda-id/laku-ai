/* ===== Adaptor Google Apps Script: store = Google Sheets, endpoint = Web App ===== */

var LAKU_FORMAT_ROWS_ = 3000;
/* ID spreadsheet database. Kosongkan bila skrip ini dibuat dari Extensions > Apps Script di dalam spreadsheet-nya. */
var LAKU_SPREADSHEET_ID_ = '';
/* OAuth Client ID (Web application) dari Google Cloud Console untuk Masuk dengan Google. Kosong = fitur nonaktif. */
var LAKU_GOOGLE_CLIENT_ID_ = '';
function book_() { return LAKU_SPREADSHEET_ID_ ? SpreadsheetApp.openById(LAKU_SPREADSHEET_ID_) : SpreadsheetApp.getActiveSpreadsheet(); }

function sheetFor_(name) {
  var ss = book_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var cols = LakuCore.TABLES[name];
  if (sh.getLastRow() < 1 || String(sh.getRange(1, 1).getValue()) !== cols[0]) initSheet_(sh, name);
  return sh;
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

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) {
  var res, lock = LockService.getScriptLock(), locked = false;
  try {
    var q = JSON.parse(e.postData.contents);
    if (q.action !== 'ping') { lock.waitLock(25000); locked = true; }
    res = LakuCore.create(GasStore_, GasEnv_).handle(q);
  } catch (err) {
    res = { ok: false, error: 'server', message: 'Terjadi kesalahan di server.' };
  } finally {
    if (locked) lock.releaseLock();
  }
  return json_(res);
}

function doGet() { return json_({ ok: true, data: { service: 'laku-ai', status: 'siap', hint: 'Gunakan POST dari aplikasi laku.ai' } }); }

/* Jalankan SEKALI dari editor (pilih fungsi "setup" lalu Run) untuk memberi izin dan menyiapkan semua tab. */
function setup() {
  Object.keys(LakuCore.TABLES).forEach(function (t) { sheetFor_(t); });
  var s = book_().getSheetByName('Sheet1');
  if (s && s.getLastRow() === 0 && book_().getSheets().length > 1) book_().deleteSheet(s);
  Logger.log('Siap. Tab: ' + Object.keys(LakuCore.TABLES).join(', '));
}
