/* LakuApi: satu pintu ke backend.
   - API_URL terisi  -> mode "sheets": POST ke Google Apps Script (database Google Sheets).
   - API_URL kosong  -> mode "demo": logika backend yang sama (LakuCore) berjalan di browser, data di localStorage. */
(function (root) {
  'use strict';
  var cfg = root.LAKU_CONFIG || {}, core = null;
  /* Pengaman: halaman yang dibuka dari localhost memakai mode demo supaya uji lokal tidak pernah menulis ke database produksi.
     Pengecualian: API_URL sendiri berupa localhost (server uji), atau alamat memuat ?live. */
  var onLocal = /^(localhost|127\.0\.0\.1)$/.test(root.location.hostname), apiLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(cfg.API_URL || ''), forceLive = /[?&]live(=|&|$)/.test(root.location.search);
  var mode = cfg.API_URL && (!onLocal || apiLocal || forceLive) ? 'sheets' : 'demo';
  function randomHex(n) { var a = new Uint8Array(Math.ceil(n / 2)); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').slice(0, n); }
  function localCore() {
    if (core) return core;
    var cache = {};
    core = root.LakuCore.create(root.LakuLocalStore(localStorage), { now: Date.now, randomHex: randomHex, verifyGoogle: demoVerifyGoogle, ai: root.LAKU_TEST_AI, aiEnabled: function () { return !!root.LAKU_TEST_AI; }, cache: { get: function (k) { return cache[k] || null; }, put: function (k, v) { cache[k] = v; } } });
    return core;
  }
  /* Mode demo saja: membaca isi token Google tanpa memeriksa tanda tangan (data hanya di perangkat ini). Di mode Sheets, server memeriksa token ke Google. */
  function demoVerifyGoogle(tk) {
    var p = String(tk).split('.'); if (p.length < 2) throw new Error('bad');
    var j = JSON.parse(decodeURIComponent(escape(atob(p[1].replace(/-/g, '+').replace(/_/g, '/')))));
    if (!j.email || !j.sub || (j.exp && j.exp * 1000 < Date.now())) throw new Error('bad');
    return { sub: j.sub, email: j.email, name: j.name };
  }
  var device = (/android/i.test(navigator.userAgent) ? 'Android' : (/iphone|ipad/i.test(navigator.userAgent) ? 'iOS' : 'Web'));

  function call(q) {
    q.device = device;
    if (mode === 'sheets') {
      var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, q.action === 'riset' ? 170000 : 40000);
      return fetch(cfg.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(q), signal: ctrl.signal, redirect: 'follow' })
        .then(function (r) { return r.json(); })
        .catch(function () { throw { code: 'network', message: 'Tidak bisa terhubung ke server. Periksa koneksi Anda lalu coba lagi.' }; })
        .then(function (res) { clearTimeout(timer); return unwrap(res); }, function (e) { clearTimeout(timer); throw e; });
    }
    return new Promise(function (resolve, reject) {
      setTimeout(function () { try { resolve(unwrap(localCore().handle(q))); } catch (e) { reject(e && e.code ? e : { code: 'server', message: String(e && e.message || e) }); } }, 30);
    });
  }
  function unwrap(res) { if (res && res.ok) return res.data; throw { code: (res && res.error) || 'server', kuotaRiset: res && res.kuotaRiset, message: (res && res.message) || 'Terjadi kesalahan.' }; }
  root.LakuApi = { mode: mode, call: call };
})(window);
