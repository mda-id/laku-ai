/* laku.ai — aplikasi web + PWA. Isi dan modul sama di web dan HP; hanya tata letak yang berbeda (CSS).
   Data: LakuApi (Google Sheets atau mode demo) -> LakuAnalytics -> tampilan. */
(function () {
  'use strict';
  var A = window.LakuAnalytics, Api = window.LakuApi, Seed = window.LakuSeed, Pus = window.LakuPustaka;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var rp = A.rp, jt = A.jt;
  var fx = function (n, d) { return (+n).toFixed(d == null ? 1 : d).replace('.', ','); };
  var mw = function (m, w) { return '<div class="m">' + m + '</div><div class="w">' + w + '</div>'; };
  var today = function () { return window.LAKU_TODAY || A.ymd(new Date()); };
  var nowTime = function () { var d = new Date(); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); };

  var ICON = {
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>', chart: '<path d="M4 20V11M10 20V4M16 20v-6M22 20H2"/>',
    box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5"/><path d="M12 12v9"/>', hpp: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>', pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>', sheet: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>', back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>', book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>', jar: '<path d="M8 3h8v3H8z"/><path d="M6 6h12v3a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a2 2 0 0 1 2-2z"/><path d="M8 13h8"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>'
  };
  var ic = function (n, sw) { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; };

  /* ================= state ================= */
  var St = { token: null, data: null };
  var UI = { period: 30, seg: 'penjualan', cat: 'cepat', hpp: null, onb: { outlet: '1 outlet', omzet: '', lama: '', kanal: [] }, busy: false, notaRows: 3, notaImg: null };
  var getToken = function () { try { return localStorage.getItem('laku.session'); } catch (e) { return null; } };
  var setToken = function (t) { try { if (t) localStorage.setItem('laku.session', t); else localStorage.removeItem('laku.session'); } catch (e) { } };

  var GID = (window.LAKU_CONFIG || {}).GOOGLE_CLIENT_ID || '';
  St.caps = St.caps || null;   // kemampuan backend (ping): { google, logo, version }
  function fetchCaps() { if (Api.mode === 'demo') { St.caps = { google: true, logo: true }; return Promise.resolve(); } return Api.call({ action: 'ping' }).then(function (d) { St.caps = d || {}; var password = $('#formDaftar [name=password]'); if (password) { password.minLength = signupPasswordMin(); password.placeholder = signupPasswordMin() + '–100 karakter'; } if ((path() === '/akun' || path() === '/hpp') && D()) render(true); }, function () { St.caps = {}; }); }
  var capLogo = function () { return Api.mode === 'demo' || !!(St.caps && St.caps.logo); };
  function loadGsi(cb) {
    if (window.google && google.accounts && google.accounts.id) return cb();
    var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = cb;
    s.onerror = function () { var b = $('#gBtn'); if (b) b.innerHTML = '<p class="hint">Masuk dengan Google tidak tersedia saat ini. Gunakan email.</p>'; };
    document.head.appendChild(s);
  }
  var gReady = null;   // tombol Google hanya tampil bila backend menyatakan mendukungnya (ping.google)
  function googleAvailable() { if (!GID) return Promise.resolve(false); if (Api.mode === 'demo') return Promise.resolve(true); if (!gReady) gReady = Api.call({ action: 'ping' }).then(function (d) { return !!(d && d.google); }, function () { return false; }); return gReady; }
  function initGoogle() {
    var wrap = $('#gWrap'); if (!wrap) return;
    googleAvailable().then(function (ok) {
      if (!ok || !$('#gWrap')) return;
      wrap.innerHTML = '<div id="gBtn" class="gbtn"></div>' + (wrap.dataset.k === 'daftar' ? '<p class="legalnote" style="margin:8px 0 0">Dengan melanjutkan dengan Google, Anda setuju data usaha dipakai hanya untuk analisis akun Anda.</p><div class="divider">atau daftar dengan email</div>' : '<div class="divider">atau masuk dengan email</div>');
      renderGoogleButton();
    });
  }
  function renderGoogleButton() {
    var el = $('#gBtn'); if (!el) return;
    loadGsi(function () {
      if (!window.__gInit) { google.accounts.id.initialize({ client_id: GID, callback: onGoogle, ux_mode: 'popup', auto_select: false }); window.__gInit = 1; }
      google.accounts.id.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', logo_alignment: 'center', width: Math.max(220, Math.min(400, el.clientWidth || 320)), locale: 'id' });
    });
  }
  function onGoogle(resp) { toast('Memeriksa akun Google…', 6000); Api.call({ action: 'google', idToken: resp.credential }).then(function (r) { afterAuth(r); }, function (er) { showErr(er.message); }); }
  function toast(msg, ms) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, ms || 2800); }
  function setSync(s) { var el = $('#sync'); if (!el) return; el.className = 'sync on ' + s; el.textContent = s === 'saving' ? 'Menyimpan…' : (s === 'ok' ? '✓ Tersimpan' : 'Gagal menyimpan'); clearTimeout(setSync.t); if (s !== 'saving') setSync.t = setTimeout(function () { el.classList.remove('on'); }, s === 'ok' ? 1400 : 4000); }
  function navigate(p) { if (location.hash === '#' + p) route(); else location.hash = '#' + p; }   // satu kali render (hashchange)
  function forceLogout(msg) { setToken(null); St.token = null; St.data = null; if (msg) toast(msg); navigate('/masuk'); }
  function persist(ops) {
    setSync('saving');
    return Api.call({ action: 'save', token: St.token, ops: ops }).then(function (r) { setSync('ok'); return r; }, function (e) {
      setSync('err'); if (e.code === 'auth') forceLogout('Sesi berakhir. Silakan masuk lagi.'); else toast('Gagal menyimpan: ' + e.message, 4500); throw e;
    });
  }
  function reload() { return Api.call({ action: 'load', token: St.token }).then(function (d) { St.data = d; return d; }); }
  var D = function () { return St.data; };
  var uid = Seed.uid;
  var compute = function (days) { return A.compute(D(), { days: days || 30, today: today() }); };
  var prodById = function (id) { return D().produk.filter(function (p) { return p.id === id; })[0]; };
  var avatarIn = function () { var d = D(); return d && d.usaha.logo ? '<img alt="" src="' + esc(d.usaha.logo) + '">' : esc(initials(d.user.nama)); };
  var initials = function (n) { var w = String(n || '?').trim().split(/\s+/); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase(); };
  var hello = function () { var h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : (h < 15 ? 'Selamat siang' : (h < 18 ? 'Selamat sore' : 'Selamat malam')); };
  var firstName = function () { return String(D().user.nama).trim(); };
  function proActive() { return LC.isPro(D().user, Date.now()); }
  function linkPro() { return '<a class="btn btn-red" href="#/paket">Lihat paket Klinik Pro</a>'; }
  var trialLeft = function () { var d = D(); if (d.user.paket !== 'pro_trial') return null; return Math.ceil((Date.parse(d.user.dibuat) + 14 * 864e5 - Date.now()) / 864e5); };

  function prodOp(p, withBahan) {
    var o = { id: p.id, nama: p.nama, satuan: p.satuan, harga: p.harga, hpp: p.hpp, stok: p.stok, produksiLalu: p.produksiLalu, sumber: p.sumber };
    if (withBahan) o.bahan = p.bahan.map(function (b) { return { id: b.id, nama: b.nama, harga: b.harga }; });
    return { op: 'produk.upsert', produk: o };
  }
  function logBahan(p, oldList) {
    var t = today(); p.bahan.forEach(function (b) { var o = oldList.filter(function (x) { return x.nama === b.nama; })[0]; if (!o || o.harga !== b.harga) D().hargaBahan.push({ id: uid('h'), produkId: p.id, nama: b.nama, harga: b.harga, tanggal: t }); });
  }

  /* ================= bahan baku: helper ================= */
  var LC = window.LakuCore, fmtQ = A.fmtQty, fmtN = A.fmtN;
  var capRiset = function () { return Api.mode === 'demo' ? !!window.LAKU_TEST_AI : !!(St.caps && St.caps.riset && D() && D().kuotaRiset); };
  var capManual = function () { return Api.mode === 'demo' || !!(St.caps && St.caps.manual); };
  var capResep = function () { return Api.mode === 'demo' || !!(St.caps && St.caps.resep); };
  var bbList = function () { return D().bahanBaku || []; };
  var bbById = function () { var m = {}; bbList().forEach(function (b) { m[b.id] = b; }); return m; };
  var bbOne = function (id) { return bbById()[id]; };
  var uPriceOf = function (b) { return LC.unitPrice(b); };
  var fmtPrice = function (v) { return 'Rp' + (+v).toLocaleString('id-ID', { maximumFractionDigits: v < 100 ? 2 : 0 }); };
  var numIn = function (v) { return (+v || 0) === 0 ? '' : String(+(+v).toFixed(4)); };
  var statusB = { habis: ['Habis', 'b-pink'], kurang: ['Kurang', 'b-pink'], menipis: ['Menipis', 'b-dark'], aman: ['Aman', 'b-ok'] };
  /* biaya bahan baku per unit (belum dibulatkan) dari resep produk */
  function recipeCostRaw(p) { var h = Math.max(1e-4, p.hasil || 1), m = bbById(), t = 0; (p.resep || []).forEach(function (it) { var b = m[it.bahanId]; if (b) t += (+it.qty || 0) * uPriceOf(b); }); return t / h; }
  function recalcLocalHpp() { D().produk.forEach(function (p) { if (p.resep && p.resep.length) p.hpp = Math.round(recipeCostRaw(p) + (p.bahan || []).reduce(function (a, b) { return a + (+b.harga || 0); }, 0)); }); }
  function unitOptions(base, sel) { return LC.units.compat(base).map(function (u) { return '<option' + (u === sel ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join(''); }
  function toBase(q, unit, base) { var v = LC.units.convert(+q || 0, unit, base); return v == null ? (+q || 0) : v; }

  /* ================= grafik ================= */
  function donut(score, size) {
    var r = 48, c = 2 * Math.PI * r;
    return '<div class="donut"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#ECEFF1" stroke-width="13"/><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#D32F2F" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + (c * score / 100).toFixed(1) + ' ' + c.toFixed(1) + '"/></svg><div class="t"><b>' + score + '</b><small>dari 100</small></div></div>';
  }
  function spark(pts, color) {
    if (pts.length < 2) pts = [pts[0] || 0, pts[0] || 0];
    var w = 84, h = 26, mn = Math.min.apply(0, pts), mx = Math.max.apply(0, pts), rg = (mx - mn) || 1;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + pts.map(function (v, i) { return (i * w / (pts.length - 1)).toFixed(1) + ',' + (h - 3 - (v - mn) / rg * (h - 6)).toFixed(1); }).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function lineCompare(M) {
    var W = 760, H = 260, pl = 38, pr = 16, pt = 22, pb = 30, n = 9, cur = M.weekly.map(function (v) { return v / 1e6; }), prev = M.prevWeekly.map(function (v) { return v / 1e6; });
    var prevOk = prev.filter(function (v) { return v > 0; }).length >= 5, tg = M.target.target / 4.3 / 1e6, f = M.forecast, base = prevOk ? cur.concat(prev) : cur, all = base.concat([tg, f.hi / 1e6]), mx = Math.max.apply(0, all) * 1.12, mn = Math.max(0, Math.min.apply(0, base) * 0.8);
    mx = Math.max(mx, mn + 1);
    var x = function (i) { return pl + i * (W - pl - pr) / (n - 1); }, y = function (v) { return pt + (mx - v) / (mx - mn) * (H - pt - pb); };
    var pts = function (a) { return a.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' '); };
    var step = (mx - mn) > 3 ? 1 : 0.5, grid = ''; for (var g = Math.ceil(mn / step) * step; g <= mx; g += step) grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="#ECEFF1"/><text x="' + (pl - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="11" fill="#90A4AE">' + fx(g) + '</text>';
    var fv = f.value / 1e6, show = f.ok;
    var fc = show ? '<polygon points="' + x(7) + ',' + y(cur[7]) + ' ' + x(8) + ',' + y(f.hi / 1e6) + ' ' + x(8) + ',' + y(f.lo / 1e6) + '" fill="#D32F2F" opacity=".12"/><line x1="' + x(7) + '" y1="' + y(cur[7]) + '" x2="' + x(8) + '" y2="' + y(fv) + '" stroke="#D32F2F" stroke-width="2.5" stroke-dasharray="5 5"/><circle cx="' + x(8) + '" cy="' + y(fv) + '" r="5" fill="#fff" stroke="#D32F2F" stroke-width="2.5"/><text x="' + x(8) + '" y="' + (y(f.hi / 1e6) - 8) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#D32F2F">' + fx(fv) + '</text>' : '';
    var tgt = '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(tg) + '" y2="' + y(tg) + '" stroke="#263238" stroke-dasharray="4 5" opacity=".7"/><text x="' + (pl + 6) + '" y="' + (y(tg) - 6) + '" text-anchor="start" font-size="11" fill="#263238">Target ' + jt(tg * 1e6) + ' per minggu</text>';
    var dots = cur.map(function (v, i) { return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.6" fill="#D32F2F"/>'; }).join('');
    var xl = cur.map(function (_, i) { return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#90A4AE">M' + (i + 1) + '</text>'; }).join('') + (show ? '<text x="' + x(8) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#D32F2F" font-weight="600">M9 est.</text>' : '');
    return '<svg class="svgfull" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Omzet mingguan 8 minggu terakhir dibanding periode sebelumnya">' + grid + tgt + (prevOk ? '<polyline points="' + pts(prev) + '" fill="none" stroke="#B0BEC5" stroke-width="2.5" stroke-linejoin="round"/>' : '') + '<polyline points="' + pts(cur) + '" fill="none" stroke="#D32F2F" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' + dots + fc + xl + '</svg>';
  }
  function dailyBars(M) {
    var v = M.daily, mx = Math.max.apply(0, v.map(function (d) { return d.v; })) || 1, W = 760, H = 190, bw = (W - 20) / v.length;
    var bars = v.map(function (d, i) { var h = d.v / mx * (H - 44); return '<rect x="' + (10 + i * bw + Math.min(2, bw * .15)) + '" y="' + (H - 22 - h) + '" width="' + Math.max(1, bw - Math.min(4, bw * .3)) + '" height="' + Math.max(d.v > 0 ? 2 : 0, h) + '" rx="3" fill="' + (d.dow >= 4 ? '#D32F2F' : '#B0BEC5') + '"/>'; }).join('');
    var idx = [0, Math.floor(v.length * .25), Math.floor(v.length * .5), Math.floor(v.length * .75), v.length - 1];
    var lab = idx.map(function (i) { var p = v[i].t.split('-'); return '<text x="' + (10 + i * bw + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="#90A4AE">' + (+p[2]) + '/' + (+p[1]) + '</text>'; }).join('');
    return '<svg class="svgfull" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Omzet harian">' + bars + lab + '</svg><div class="legend"><span><i style="background:#D32F2F"></i>Jumat-Minggu</span><span><i style="background:#B0BEC5"></i>Senin-Kamis</span></div>';
  }
  function heatmap(M) {
    var h = '<div class="heat"><span></span>' + A.DAYS.map(function (d) { return '<span class="h">' + d + '</span>'; }).join('');
    M.heat.forEach(function (r, s) { h += '<span class="r">' + A.SLOTS[s][0] + '</span>' + r.map(function (v, d) { return '<span class="c" title="' + A.DAYS_FULL[d] + ' ' + A.SLOTS[s][1] + '" style="background:rgba(211,47,47,' + (0.08 + v * .92).toFixed(2) + ');color:' + (v > .45 ? '#fff' : '#B0BEC5') + '">' + (M.peak.s === s && M.peak.d === d ? 'Puncak' : '') + '</span>'; }).join(''); });
    return h + '</div><div class="heat-scale">Sepi <span></span> Ramai</div>';
  }
  function channelDonut(M) {
    var cols = ['#D32F2F', '#263238', '#90A4AE', '#CFD8DC'], r = 48, c = 2 * Math.PI * r, off = 0;
    var arcs = M.channels.map(function (s, i) { var len = c * s[1], a = '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + cols[i] + '" stroke-width="18" stroke-dasharray="' + len.toFixed(1) + ' ' + (c - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '"/>'; off += len; return a; }).join('');
    return '<div class="donut-row"><svg viewBox="0 0 120 120" style="width:118px;height:118px;transform:rotate(-90deg)" role="img" aria-label="Kanal penjualan"><circle cx="60" cy="60" r="48" fill="none" stroke="#ECEFF1" stroke-width="18"/>' + arcs + '</svg><div class="dleg">' + M.channels.map(function (s, i) { return '<div><i style="background:' + cols[i] + '"></i>' + s[0] + '<b>' + Math.round(s[1] * 100) + '%</b></div>'; }).join('') + '</div></div>';
  }
  function marginBars(M) {
    var L = M.prods.filter(function (p) { return p.omzet > 0 && p.margin != null; }).sort(function (a, b) { return b.margin - a.margin; }), mx = Math.max(50, Math.ceil(Math.max.apply(0, L.map(function (p) { return p.margin; }).concat([M.targetM])) / 10) * 10);
    if (!L.length) return '<p class="sub">Belum ada penjualan pada periode ini.</p>';
    return L.map(function (p) { return '<div class="mbar"><span>' + esc(p.nama) + '</span><div class="tr"><i class="' + (p.margin < M.targetM - 10 ? 'low' : '') + '" style="width:' + clampPct(p.margin / mx * 100) + '%"></i><u style="left:' + (M.targetM / mx * 100) + '%"></u></div><b>' + Math.round(p.margin) + '%</b></div>'; }).join('') + '<div class="mbar-note">Garis merah = target margin ' + M.targetM + '%. Margin dihitung dari harga jual aktual dikurangi HPP.</div>';
  }
  var clampPct = function (v) { return Math.max(0, Math.min(100, v)); };
  function scatter(M) {
    var L = M.prods.filter(function (p) { return p.omzet > 0 && p.margin != null; }); if (L.length < 2) return '<p class="sub">Butuh minimal 2 produk dengan penjualan.</p>';
    var W = 440, H = 300, pl = 40, pr = 14, pt = 14, pb = 38, xmax = Math.max(45, Math.ceil(Math.max.apply(0, L.map(function (p) { return p.share; })) / 5) * 5 + 5), ys = L.map(function (p) { return p.margin; }), ymin = Math.min(15, Math.floor(Math.min.apply(0, ys) / 5) * 5 - 5), ymax = Math.max(45, Math.ceil(Math.max.apply(0, ys) / 5) * 5 + 5);
    var xm = 100 / L.length / 1, x = function (v) { return pl + v / xmax * (W - pl - pr); }, y = function (v) { return pt + (ymax - v) / (ymax - ymin) * (H - pt - pb); };
    var midX = xm, q = [['Potensi', pl + 8, pt + 16], ['Bintang', W - pr - 8, pt + 16, 1], ['Pantau', pl + 8, H - pb - 8], ['Naikkan margin', W - pr - 8, H - pb - 8, 1]].map(function (t) { return '<text x="' + t[1] + '" y="' + t[2] + '" text-anchor="' + (t[3] ? 'end' : 'start') + '" font-size="11" font-weight="700" fill="#B0BEC5" letter-spacing=".6">' + t[0].toUpperCase() + '</text>'; }).join('');
    var d = L.map(function (p) { var bad = p.margin < M.targetM - 10, top = p.tag === 'Unggulan' && !bad, col = bad ? '#D32F2F' : (top ? '#263238' : '#78909C'), right = p.share > xmax * 0.6; return '<circle cx="' + x(p.share) + '" cy="' + y(p.margin) + '" r="7" fill="' + col + '"/><text x="' + (x(p.share) + (right ? -11 : 11)) + '" y="' + (y(p.margin) + 4) + '" text-anchor="' + (right ? 'end' : 'start') + '" font-size="12" font-weight="600" fill="#263238">' + esc(p.nama) + '</text>'; }).join('');
    return '<svg class="svgfull" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Matriks produk: kontribusi omzet terhadap margin"><rect x="' + x(20) + '" y="' + pt + '" width="' + (W - pr - x(20)) + '" height="' + Math.max(0, y(M.targetM) - pt) + '" fill="#FDECEA" opacity=".55" rx="6"/><line x1="' + x(20) + '" x2="' + x(20) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="#CFD8DC" stroke-dasharray="4 4"/><line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(M.targetM) + '" y2="' + y(M.targetM) + '" stroke="#CFD8DC" stroke-dasharray="4 4"/>' + q + d + '<text x="' + ((pl + W - pr) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#78909C">Kontribusi omzet (%) →</text><text transform="translate(12 ' + (H / 2) + ') rotate(-90)" text-anchor="middle" font-size="11" fill="#78909C">Margin (%) →</text></svg>';
  }
  function coverRows(M) {
    var L = M.prods.filter(function (p) { return p.stok > 0 && p.cover != null; });
    if (!L.length) return '<p class="sub">Isi sisa stok di menu <a class="link" href="#/stok" style="font-size:inherit">Stok</a> untuk melihat cakupan stok.</p>';
    return L.sort(function (a, b) { return a.cover - b.cover; }).map(function (p) { var c = p.cover, cls = c < A.COV_LOW ? 'r' : (c > A.COV_HIGH ? 'g' : ''), tx = c < A.COV_LOW ? 'Rawan habis' : (c > A.COV_HIGH ? 'Menumpuk' : 'Aman'); return '<div class="cov"><span>' + esc(p.nama) + '</span><div class="tr"><i class="' + cls + '" style="width:' + clampPct(c / 14 * 100) + '%"></i></div><span class="badge ' + (cls === 'r' ? 'b-pink' : (cls === 'g' ? 'b-gray' : 'b-ok')) + '" style="font-size:11.5px;padding:3px 10px">' + Math.round(c) + ' hari · ' + tx + '</span></div>'; }).join('') + '<div class="mbar-note">Cakupan stok = sisa stok ÷ rata-rata penjualan harian (4 minggu). Wajar sekitar 4-10 hari; sesuaikan dengan masa simpan produk.</div>';
  }
  function priceRows(M) {
    if (!M.bahanTrack.length) return '<p class="sub">Belum ada data harga bahan. Isi bahan di <a class="link" href="#/hpp" style="font-size:inherit">Kalkulator HPP</a>; setiap perubahan harga dicatat otomatis.</p>';
    return M.bahanTrack.slice(0, 6).map(function (b) { var up = b.change >= 0.03; return '<div class="pr-row"><span>' + esc(b.nama) + '<br><small class="sub">' + esc(b.produk) + '</small></span>' + spark(b.pts, up ? '#D32F2F' : '#78909C') + '<b class="' + (up ? 'up2' : '') + '">' + (b.change > 0 ? '+' : '') + Math.round(b.change * 100) + '%</b></div>'; }).join('') + '<div class="mbar-note">Perubahan harga bahan (maks. 6 catatan terakhir) dari Kalkulator HPP.</div>';
  }
  function promoTable(M) {
    if (!M.promos.length) return '<p class="sub">Belum ada promosi. Catat promosi di menu <a class="link" href="#/catat" style="font-size:inherit">Catat penjualan</a> untuk melihat dampaknya.</p>';
    return '<table class="mini"><thead><tr><th>Promosi</th><th>Omzet harian vs sebelum promo</th><th></th></tr></thead><tbody>' + M.promos.map(function (p) { return '<tr><td><b>' + esc(p.nama) + '</b><br><span class="sub">' + p.len + ' hari' + (p.produkId && prodById(p.produkId) ? ' · ' + esc(prodById(p.produkId).nama) : ' · semua produk') + '</span></td><td><b style="color:' + (p.effect != null && p.effect >= 0.05 ? '#2E7D32' : 'inherit') + '">' + (p.effect == null ? '–' : (p.effect >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(p.effect * 100)) + '%') + '</b></td><td><span class="badge b-' + p.tone + '">' + p.verdict + '</span></td></tr>'; }).join('') + '</tbody></table><div class="mbar-note">Dibanding periode sama panjang tepat sebelum promosi. Tidak memisahkan efek tren.</div>';
  }
  function insightsHTML(M) {
    if (!M.insights.length) return '<p class="sub">Belum ada temuan. Terus catat penjualan; insight muncul otomatis.</p>';
    return M.insights.slice(0, 5).map(function (i) { return '<div class="insight"><span class="dot ' + (i.tone === 'red' ? '' : i.tone) + '"></span><div><h4>' + esc(i.title) + '</h4><p>' + i.body + '</p><a class="link" href="' + i.href + '">' + i.cta + '</a></div></div>'; }).join('');
  }
  var card = function (inner, cls, style) { return '<div class="card ' + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '>' + inner + '</div>'; };
  var title = function (t, right) { return '<div class="sec-title"><h3>' + t + '</h3>' + (right || '') + '</div>'; };
  function head(eM, tM, eW, tW, extra, greet) {
    var d = D(), who = '<div class="who w">' + (extra || '') + '<div><b>' + esc(d.usaha.nama) + '</b><small>' + esc([d.usaha.jenis, d.usaha.kota].filter(Boolean).join(' · ')) + '</small></div><a class="avatar" href="#/akun" aria-label="Akun">' + avatarIn() + '</a></div>';
    return '<div class="pagehead"><div>' + (greet ? '<div class="eyebrow m">' + eM + '</div><h1 class="h1 m">' + tM + '</h1>' : '<h1 class="h1 m">' + tM + '</h1><div class="eyebrow m">' + eM + '</div>') + '<div class="eyebrow w">' + eW + '</div><h1 class="h1 w">' + tW + '</h1></div>' + who + '</div>';
  }
  var dTxt = function (v) { return v == null ? '' : (v >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(v * 100)) + '%'; };

  /* ================= views ================= */
  var V = {};

  function kosong() {
    var d = D(), hasP = d.produk.length > 0, hasHpp = d.produk.some(function (p) { return p.hpp > 0; }), hasS = d.penjualan.length > 0;
    var done = [true, hasP && hasHpp, hasS], pct = Math.round(done.filter(Boolean).length / 3 * 100);
    var todo = function (n, t, s, ok, href, cta) { return '<div class="todo' + (ok ? ' done' : '') + '"><span class="n">' + (ok ? ic('check', 3).replace('width="24" height="24"', 'width="16" height="16"') : n) + '</span><div class="t"><b>' + t + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>' + (ok ? '' : '<a class="btn btn-red btn-sm" href="' + href + '">' + cta + '</a>') + '</div>'; };
    var M = compute(30);
    var locked = function (t, inner, cls) { return '<div class="card ghost ' + (cls || '') + '"><div class="blur">' + inner + '</div><div class="lock"><b>' + t + '</b><span class="sub">Terbuka setelah ada data penjualan</span><button class="btn btn-red btn-sm" data-act="seed">Coba dengan data contoh</button></div></div>'; };
    var fakeIns = '<div class="insight"><span class="dot"></span><div><h4>Margin produk turun</h4><p>Harga bahan naik 12% sejak bulan lalu, harga jual belum berubah.</p><a class="link" href="#">Hitung ulang HPP →</a></div></div><div class="insight"><span class="dot"></span><div><h4>Produk berisiko habis</h4><p>Cakupan stok tinggal 3 hari.</p><a class="link" href="#">Lihat saran stok →</a></div></div>';
    return head(hello() + ', ' + esc(firstName()), esc(d.usaha.nama), hello() + ', ' + esc(firstName()), 'Mulai dari sini', '', 1) +
      '<div class="dgrid">' +
      card('<div class="row"><div><div class="label">Persiapan akun</div><h3 style="font-size:18px;margin:4px 0 0">Selesaikan 3 langkah pertama</h3></div><span class="badge b-pink">' + done.filter(Boolean).length + ' dari 3</span></div><div class="track red" style="margin:12px 0 4px"><i style="width:' + pct + '%"></i></div>' +
        todo(1, 'Akun dan profil usaha dibuat', '', true) + todo(2, 'Tambah produk dan hitung HPP', 'Gratis. Selesai dalam 2 menit di Kalkulator HPP.', done[1], '#/hpp', 'Mulai') + todo(3, 'Catat penjualan', 'Diagnosis butuh minimal 2 minggu data. Mulai dari 3-5 produk utama.', done[2], '#/catat', 'Mulai') +
        '<div class="sub" style="margin-top:12px">Ingin langsung melihat tampilannya? <button class="link" data-act="seed" style="font-size:13px">Isi data contoh 8 minggu</button> (bisa dihapus kapan saja).</div>', 'c8') +
      card('<div class="label">Skor kesehatan usaha</div><div style="display:grid;place-items:center;padding:14px 0 6px"><div class="donut" style="width:120px;height:120px"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" fill="none" stroke="#ECEFF1" stroke-width="13"/></svg><div class="t"><b style="color:var(--bar)">--</b><small style="font-size:11px">belum ada data</small></div></div></div><div class="sub" style="text-align:center">Muncul setelah 2 minggu pencatatan.</div>', 'c4') +
      locked('Diagnosis dan insight AI', fakeIns, 'c8') +
      card(title('Gratis untuk Anda') + '<div class="menu"><a href="#/hpp"><span><b>Kalkulator HPP</b><small>Hitung HPP dan pilihan harga jual</small></span><span class="badge b-ok">Aktif</span></a><a href="#/catat"><span><b>Catat penjualan</b><small>Isi cepat, foto nota, impor</small></span><span class="badge b-ok">Aktif</span></a></div>', 'c4') +
      locked('Tren, stok, dan analitik', '<div style="height:150px">' + lineCompare(M) + '</div>', 'c12') + '</div>';
  }

  V.beranda = function () {
    var d = D();
    if (!proActive()) {
      var mulai = A.addDays(today(), -29), akhir = today(), omzet = 0, qty = 0, transaksi = 0;
      d.penjualan.forEach(function (r) {
        if (r.tanggal < mulai || r.tanggal > akhir) return;
        omzet += r.qty * r.harga;
        qty += r.qty;
        transaksi++;
      });
      return head('Ringkasan penjualan', esc(d.usaha.nama), 'Ringkasan penjualan', '30 hari terakhir', '') +
        '<div class="dgrid">' + card(title('Omzet') + rp(omzet), 'c4') + card(title('Catatan penjualan') + transaksi, 'c4') + card(title('Produk terjual') + qty + ' unit', 'c4') +
        card('<div class="menu"><a href="#/catat">Catat penjualan</a><a href="#/hpp">Kalkulator HPP dan riset harga</a></div>', 'c8') +
        card(title('Klinik Pro') + '<p class="sub">Buka diagnosis, analitik, rekomendasi stok, dan roadmap usaha.</p>' + linkPro(), 'c4') + '</div>';
    }
    var M = compute(30);
    if (!M.hasData) return kosong();
    var k = M.kpi, KP = [['Omzet 30 hari', jt(k.cur.omzet), dTxt(k.d.omzet), k.d.omzet], ['Laba kotor', jt(k.cur.laba), dTxt(k.d.laba), k.d.laba], ['Margin kotor', k.cur.knownOm > 0 ? Math.round(k.cur.margin * 100) + '%' : '–', k.d.margin == null ? '' : (k.d.margin >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(k.d.margin)) + ' poin', k.d.margin], ['Transaksi', k.cur.trx.toLocaleString('id-ID'), dTxt(k.d.trx), k.d.trx], ['Rata-rata per transaksi', rp(k.cur.aov), dTxt(k.d.aov), k.d.aov], ['Produk terjual', k.cur.qty.toLocaleString('id-ID') + ' unit', dTxt(k.d.qty), k.d.qty]];
    var kpi = KP.map(function (x) { return card('<div class="label">' + x[0] + '</div><div class="big">' + x[1] + '</div><div class="d ' + (x[3] != null && x[3] < 0 ? 'dn' : '') + '">' + (x[2] ? x[2] + ' <span>vs 30 hari sebelumnya</span>' : '<span>belum ada pembanding</span>') + '</div>', 'kpi c2'); }).join('');
    var comp = M.comps.map(function (c) { return '<div class="comp-row"><span>' + c.k + '</span><b' + (c.warn ? ' style="color:var(--red)"' : '') + '>' + c.l + '</b></div>'; }).join('');
    var t = M.target, top = M.ranked.slice(0, 5);
    var delta = M.delta == null ? '' : (M.delta === 0 ? 'Sama seperti bulan lalu' : (M.delta > 0 ? 'Naik ' : 'Turun ') + Math.abs(M.delta) + ' poin dari bulan lalu');
    var notice = M.daysOfData < 14 ? '<div class="note-box c12">Data baru <b>' + M.daysOfData + ' hari</b>. Skor dan saran makin akurat setelah minimal 2 minggu pencatatan.</div>' : '';
    var body = head(hello() + ', ' + esc(firstName()), esc(d.usaha.nama), hello() + ', ' + esc(firstName()) + ' · ' + new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), 'Ringkasan kesehatan usaha', '', 1) +
      '<div class="dgrid">' + notice + kpi +
      card('<div class="label">Skor kesehatan usaha</div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px"><div><h2 style="font-size:19px;margin:0 0 4px;white-space:nowrap">' + M.overall + '</h2><div class="sub">' + (delta || 'Dari 4 komponen') + '</div><a class="chip-link" href="#/diagnosis">Lihat diagnosis</a></div>' + donut(M.score, 104) + '</div><div style="margin-top:10px">' + comp + '</div>', 'c4') +
      card(title('Insight AI minggu ini', '<span class="badge b-pink">' + Math.min(5, M.insights.length) + ' temuan</span>') + insightsHTML(M), 'c8') +
      card(title('Omzet mingguan vs periode lalu') + lineCompare(M) + '<div class="legend"><span><i style="background:#D32F2F"></i>8 minggu terakhir</span>' + (M.prevWeekly.filter(function (v) { return v > 0; }).length >= 5 ? '<span><i style="background:#B0BEC5"></i>8 minggu sebelumnya</span>' : '') + '<span><i class="d"></i>Target</span>' + (M.forecast.ok ? '<span><i style="background:#D32F2F;opacity:.3"></i>Perkiraan M9: ' + jt(M.forecast.lo) + ' - ' + jt(M.forecast.hi) + '</span>' : '') + '</div>', 'c8') +
      card(title('Target bulan ini') + '<div class="goal"><div class="row"><span>Omzet ' + jt(t.omzet) + ' dari ' + jt(t.target) + '</span><b>' + Math.round(t.pct * 100) + '%</b></div><div class="track red"><i style="width:' + clampPct(t.pct * 100) + '%"></i></div><div class="sub" style="margin-top:8px">' + (t.left > 0 ? 'Perlu ' + jt(t.left) + ' lagi dalam ' + t.daysLeft + ' hari. Rata-rata harian ' + jt(t.perDay) + '.' : 'Target bulan ini tercapai.') + '</div></div>' +
        '<div class="goal" style="margin-top:18px"><div class="row"><span>Margin kotor ' + Math.round(t.marginNow) + '% dari target ' + t.marginTarget + '%</span><b>' + Math.round(clampPct(t.marginNow / t.marginTarget * 100)) + '%</b></div><div class="track"><i style="width:' + clampPct(t.marginNow / t.marginTarget * 100) + '%"></i></div></div>' +
        '<div class="goal" style="margin-top:18px"><div class="row"><span>Kesiapan buka cabang</span><b>' + M.readiness.cabang.pct + '%</b></div><div class="track"><i style="width:' + M.readiness.cabang.pct + '%"></i></div><a class="link" href="#/roadmap" style="margin-top:10px;font-size:13px">Lihat roadmap →</a></div><a class="link" href="#/belajar/target-margin" style="margin-top:8px;font-size:12.5px;color:var(--muted);font-weight:500">Dari mana angka target ini?</a>', 'c4') +
      card(title('Margin per produk') + marginBars(M), 'c6') +
      card(title('Produk terlaris', '<span class="sub">30 hari</span>') + top.map(function (p, i) { return '<div class="mbar" style="grid-template-columns:124px 1fr 96px"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (i + 1) + '. ' + esc(p.nama) + '</span><div class="tr"><i class="' + (i === 0 ? 'low' : '') + '" style="width:' + clampPct(p.share / (top[0].share || 1) * 92) + '%"></i></div><b style="font-weight:500;color:var(--muted);font-size:12.5px">' + Math.round(p.share) + '%' + (p.change != null ? ' · ' + (p.change >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(p.change * 100)) + '%' : '') + '</b></div>'; }).join(''), 'c6') +
      '<div class="quick m c12"><a href="#/catat">' + ic('plus') + 'Catat penjualan</a><a href="#/roadmap">' + ic('flag') + 'Roadmap usaha</a><a href="#/bahan">' + ic('jar') + 'Bahan baku</a><a href="#/belajar">' + ic('book') + 'Pustaka belajar</a></div></div>';
    return body;
  };

  V.diagnosis = function () {
    var learnMap = { 'Pertumbuhan omzet': 'promosi-terukur', 'Margin kotor': 'target-margin', 'Perputaran stok': 'stok-dasar', 'Konsistensi pencatatan': 'catat-sederhana' };
    var M = compute(30), comps = M.comps.map(function (h) { return '<div class="comp"><div class="row"><b>' + h.k + '</b><span class="badge ' + (h.warn ? 'b-pink' : (h.v >= 80 ? 'b-ok' : 'b-gray')) + '">' + h.l + ' · ' + h.v + '</span></div><div class="track' + (h.warn ? ' red' : '') + '" style="margin-top:10px"><i style="width:' + h.v + '%"></i></div><p><b style="color:var(--red)">Kenapa?</b> ' + esc(h.d) + ' <a class="link" style="font-size:12.5px" href="#/belajar/' + learnMap[h.k] + '">Pelajari</a></p></div>'; }).join('');
    var worst = M.comps.slice().sort(function (a, b) { return a.v - b.v; })[0], href = { 'Margin kotor': '#/hpp', 'Perputaran stok': '#/stok', 'Konsistensi pencatatan': '#/catat', 'Pertumbuhan omzet': '#/analitik' }[worst.k], cta = { 'Margin kotor': 'Buka kalkulator HPP →', 'Perputaran stok': 'Buka rekomendasi stok →', 'Konsistensi pencatatan': 'Catat penjualan →', 'Pertumbuhan omzet': 'Buka analitik →' }[worst.k];
    return '<a class="back" href="#/">' + ic('back', 2) + 'Beranda</a>' + head('Diagnosis', 'Skor kesehatan usaha', 'Diagnosis · ' + new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), 'Skor kesehatan usaha', '') +
      '<div class="two-col"><div class="stack"><div class="card score"><div><div class="label">Skor total</div><h2>' + M.overall + '</h2><p>Rata-rata dari empat komponen' + (M.delta == null ? '.' : '. ' + (M.delta === 0 ? 'Sama seperti bulan lalu.' : (M.delta > 0 ? 'Naik ' : 'Turun ') + Math.abs(M.delta) + ' poin dari bulan lalu.')) + '</p></div>' + donut(M.score) + '</div>' +
      '<div class="tip"><div class="label">Langkah berikutnya</div><p>Komponen terendah: <b>' + worst.k + '</b> (' + worst.v + '). ' + esc(worst.d) + '</p><a class="link" href="' + href + '" style="color:#fff;margin-top:10px">' + cta + '</a></div></div>' +
      '<div class="card"><div class="label" style="margin-bottom:6px">Rincian dan data yang dipakai</div>' + comps + '</div></div><p class="foot-note">Setiap skor disertai alasan dan datanya. Keputusan akhir tetap di tangan Anda.</p>';
  };

  V.analitik = function () {
    var M = compute(UI.period), names = { penjualan: 'Penjualan', produk: 'Produk', waktu: 'Waktu', stok: 'Stok' };
    var secs = {
      penjualan: [card(title('Omzet harian, ' + UI.period + ' hari') + dailyBars(M) + '<div class="sub" style="margin-top:8px"><b>Insight:</b> Jumat-Minggu menyumbang <b>' + Math.round(M.wkendShare * 100) + '%</b> omzet (8 minggu).</div>', 'c8'), card(title('Kanal penjualan') + channelDonut(M), 'c4')],
      produk: [card(title('Matriks produk', '<span class="sub">Laris vs margin</span>') + scatter(M), 'c6'), card(title('Margin per produk') + marginBars(M), 'c6'), card(title('Efektivitas promosi') + promoTable(M), 'c12')],
      waktu: [card(title('Waktu ramai', '<span class="sub">Rata-rata 8 minggu</span>') + heatmap(M) + '<div class="sub" style="margin-top:12px"><b>Insight:</b> puncak <b>' + A.DAYS_FULL[M.peak.d] + ' ' + A.SLOTS[M.peak.s][0].toLowerCase() + '</b> (' + A.SLOTS[M.peak.s][1].replace('-', '.00-') + '.00). Siapkan stok sebelum jam itu.</div>', 'c12')],
      stok: [card(title('Cakupan stok per produk') + coverRows(M), 'c6'), card(title('Harga bahan baku', M.bahanTrack.some(function (b) { return b.change >= 0.03; }) ? '<span class="badge b-pink">' + M.bahanTrack.filter(function (b) { return b.change >= 0.03; }).length + ' naik</span>' : '') + priceRows(M), 'c6')]
    };
    var seg = '<div class="seg m-seg m" role="tablist">' + Object.keys(names).map(function (k) { return '<button role="tab" aria-selected="' + (UI.seg === k) + '" data-seg="' + k + '">' + names[k] + '</button>'; }).join('') + '</div>';
    var chips = '<div class="chips">' + [7, 30, 90].map(function (n) { return '<button class="chip" aria-pressed="' + (UI.period === n) + '" data-period="' + n + '">' + n + ' hari</button>'; }).join('') + '</div>';
    return head('Penjualan, produk, waktu ramai, dan stok', 'Analitik', 'Penjualan, produk, waktu ramai, dan stok', 'Analitik', '') +
      (M.hasData ? '' : '<div class="note-box">Belum ada penjualan. Grafik terisi setelah Anda <a class="link" href="#/catat" style="font-size:inherit">mencatat penjualan</a>.</div>') +
      '<div class="toolbar">' + chips + '<button class="btn btn-line btn-sm" data-act="print">Cetak / simpan PDF</button></div>' + seg +
      '<div class="dgrid">' + Object.keys(secs).map(function (k) { return '<div class="sect" data-sec="' + k + '"' + (UI.seg === k ? '' : ' hidden') + '>' + secs[k].join('') + '</div>'; }).join('') + '</div>' +
      '<p class="foot-note">Dihitung dari catatan penjualan akun Anda. Efektivitas promosi tidak memisahkan efek tren.</p>';
  };

  /* ---------- stok ---------- */
  function decisions() { var wk = A.mondayOf(today()), m = {}; D().keputusan.forEach(function (k) { if (k.tipe === 'stok' && k.waktu.slice(0, 10) >= wk) m[k.produkId] = k; }); return m; }
  function weekRange() { var s = A.mondayOf(today()), e = A.addDays(s, 6), f = function (x) { var d = new Date(x + 'T12:00:00'); return d.getDate() + ' ' + d.toLocaleDateString('id-ID', { month: 'long' }); }; return f(s) + '-' + f(e); }
  var recOf = function (p) { return p.resep ? p.bisa : p.saran; };
  function decLbl(p, d) { return d.tindakan === 'ikuti' ? 'Mengikuti saran' : (p.resep && !p.cukup && d.nilaiAkhir === p.bisa ? 'Sesuai stok bahan: ' + d.nilaiAkhir + ' ' + esc(p.satuan) : 'Diubah: ' + d.nilaiAkhir + ' ' + esc(p.satuan)); }
  function capLine(p) { if (!p.resep) return ''; return '<div class="capline ' + (p.cukup ? 'ok' : 'warn') + '">' + (p.cukup ? 'Bahan baku cukup untuk saran ini' : 'Bahan baku hanya cukup untuk <b>' + fmtN(p.bisa) + ' ' + esc(p.satuan) + '</b> (saran permintaan ' + fmtN(p.saran) + ')' + (p.limitBahan ? ' · terbatas ' + esc(p.limitBahan) : '')) + '</div>'; }
  function stokCard(p, dec, edit) {
    var badge = p.act === 'Naikkan' ? 'b-dark' : (p.act === 'Kurangi' ? 'b-pink' : 'b-gray'), lbl = p.act === 'Naikkan' ? 'Naikkan produksi' : (p.act === 'Kurangi' ? 'Kurangi produksi' : 'Pertahankan');
    var d = dec[p.id], acts;
    if (edit && edit.id === p.id) acts = '<div class="stepper"><button class="s" data-step="-5" aria-label="Kurangi 5">−</button><input type="number" inputmode="numeric" min="0" value="' + edit.q + '" data-q aria-label="Jumlah produksi"><button class="s" data-step="5" aria-label="Tambah 5">+</button></div><div class="act"><button class="btn btn-line" data-act="undo" data-id="' + p.id + '">Batal</button><button class="btn btn-red" data-act="save-edit" data-id="' + p.id + '">Simpan</button></div>';
    else if (d) acts = '<div class="act"><button class="btn btn-ok" disabled>✓ ' + decLbl(p, d) + '</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ubah lagi</button></div>';
    else acts = '<div class="act"><button class="btn btn-red" data-act="follow" data-id="' + p.id + '">Ikuti saran</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ubah sendiri</button></div>';
    return '<div class="card stock-card"><div class="head"><h3>' + esc(p.nama) + '</h3><span class="badge ' + badge + '">' + lbl + '</span></div>' +
      '<div class="kv"><div><small>Sisa stok (' + esc(p.satuan) + ')</small><input class="inl" type="number" inputmode="numeric" min="0" value="' + p.stok + '" data-stok="' + p.id + '" aria-label="Sisa stok ' + esc(p.nama) + '"></div><div class="hi"><small>Saran produksi</small><b>' + recOf(p) + ' ' + esc(p.satuan) + '</b></div></div>' + capLine(p) +
      '<div class="why"><b>Kenapa?</b> ' + esc(p.why) + '</div><div class="lalu"><span>Produksi minggu lalu</span><input class="inl sm" type="number" inputmode="numeric" min="0" value="' + p.lalu + '" data-lalu="' + p.id + '" aria-label="Produksi minggu lalu ' + esc(p.nama) + '"></div>' + acts + '</div>';
  }
  function shopHtml(M, dec) {
    var B = M.bahan, adv = capResep(), out = '';
    if (!adv) return '';
    if (!bbList().length) return '<div class="note-box">Belum ada bahan baku. <a class="link" href="#/bahan" style="font-size:inherit">Tambahkan stok bahan baku</a> agar rekomendasi produksi memperhitungkan ketersediaan bahan.</div>';
    var noRes = M.prods.filter(function (p) { return !p.resep; });
    if (B.habis.length) out += '<div class="note-box warn"><b>Stok habis:</b> ' + B.habis.map(function (b) { return esc(b.nama); }).join(', ') + '. Sudah belanja? <a class="link" href="#/bahan" style="font-size:inherit">Perbarui stok bahan baku</a> dulu agar jumlah produksi akurat.</div>';
    if (B.kurang.length) {
      var rows = B.kurang.map(function (k) { return '<div class="shop-r"><div class="n"><b>' + esc(k.nama) + '</b><small>untuk ' + esc(k.dipakai.join(', ')) + '</small></div><div class="q"><small>Butuh</small><b>' + fmtQ(k.butuh, k.satuan) + '</b></div><div class="q"><small>Stok</small><b>' + fmtQ(k.punya, k.satuan) + '</b></div><div class="q red"><small>Kurang</small><b>' + fmtQ(k.kurang, k.satuan) + '</b></div><div class="q"><small>Beli</small><b>' + fmtQ(k.beli, k.satuan) + '</b><small>≈ ' + rp(k.biaya) + '</small></div></div>'; }).join('');
      var lim = M.prods.filter(function (p) { return p.resep && !p.cukup && !dec[p.id]; }).length;
      out += '<div class="card alert-card" role="alert"><div class="head"><h3>Stok bahan baku tidak cukup</h3><span class="badge b-pink">' + B.kurang.length + ' bahan</span></div><p class="sub">Untuk memenuhi saran produksi minggu ini Anda perlu membeli:</p>' + rows + '<div class="shop-t"><b>Perkiraan belanja</b><b>' + rp(B.totalBiaya) + '</b></div><div class="act"><a class="btn btn-line" href="#/bahan">Buka bahan baku</a>' + (lim ? '<button class="btn btn-red" data-act="follow-cap">Ikuti sesuai stok bahan (' + lim + ')</button>' : '') + '</div></div>';
    } else if (B.adaResep) out += '<div class="note-box ok">Stok bahan baku cukup untuk semua saran produksi minggu ini.</div>';
    if (noRes.length) out += '<div class="note-box">Belum ada resep untuk: ' + noRes.map(function (p) { return esc(p.nama); }).join(', ') + '. <a class="link" href="#/hpp" style="font-size:inherit">Isi resep di Kalkulator HPP</a> agar saran memperhitungkan bahan baku.</div>';
    return out;
  }
  function prodPreview(pid, q) {
    var p = prodById(pid), m = bbById(), h = Math.max(1e-4, (p && p.hasil) || 1), lack = [], rows = [];
    ((p && p.resep) || []).forEach(function (it) { var b = m[it.bahanId]; if (!b) return; var need = q / h * it.qty, bad = need > b.stok + 1e-9; if (bad) lack.push(b.nama); rows.push('<li class="' + (bad ? 'red' : '') + '"><span>' + esc(b.nama) + '</span><b>' + fmtQ(need, b.satuan) + '</b><small>stok ' + fmtQ(b.stok, b.satuan) + '</small></li>'); });
    return { lack: lack.length > 0, html: '<ul class="prev">' + rows.join('') + '</ul>' + (lack.length ? '<div class="note-box warn">Stok bahan tidak cukup: ' + lack.map(esc).join(', ') + '. Perbarui stok atau kurangi jumlah.</div>' : '') };
  }
  function prodCard(M) {
    var L = M.prods.filter(function (p) { return p.resep; }); if (!L.length || !capResep()) return '';
    var sel = (UI.prod && L.filter(function (p) { return p.id === UI.prod.id; })[0]) || L[0], q = UI.prod && UI.prod.q != null ? UI.prod.q : Math.max(1, recOf(sel) || 1), pv = prodPreview(sel.id, q);
    return '<form class="card" id="prodForm" style="margin-top:16px"><div class="label">Catat produksi</div><p class="sub" style="margin:2px 0 10px">Mencatat produksi mengurangi stok bahan baku sesuai resep dan menambah sisa stok produk jadi.</p><div class="two"><label class="field"><span>Produk</span><select name="produk" id="prodSel">' + L.map(function (p) { return '<option value="' + p.id + '"' + (p.id === sel.id ? ' selected' : '') + '>' + esc(p.nama) + '</option>'; }).join('') + '</select></label><label class="field"><span>Jumlah dibuat</span><input name="qty" id="prodQty" type="number" step="any" min="0" inputmode="decimal" value="' + q + '"></label></div><div id="prodPrev">' + pv.html + '</div><button class="btn btn-red btn-block" type="submit"' + (pv.lack ? ' disabled' : '') + '>Catat produksi</button></form>';
  }
  V.stok = function () {
    var M = compute(30), dec = decisions(), ss = M.stockSummary, edit = UI.edit;
    if (!D().produk.length) return head('Untuk minggu ' + weekRange(), 'Rekomendasi stok', 'Untuk minggu ' + weekRange(), 'Rekomendasi stok', '') + '<div class="card"><p>Belum ada produk. <a class="link" href="#/hpp" style="font-size:inherit">Tambah produk di Kalkulator HPP</a>, lalu catat penjualan agar saran stok bisa dihitung.</p></div>';
    var sumCards = '<div class="stock-stats"><div class="card"><div class="label">Produk perlu dinaikkan</div><b class="v">' + ss.up.length + ' produk</b><span class="d">' + (ss.up.map(function (p) { return esc(p.nama); }).join(', ') || '–') + '</span></div><div class="card"><div class="label">Produk perlu dikurangi</div><b class="v">' + ss.down.length + ' produk</b><span class="d">' + (ss.down.map(function (p) { return esc(p.nama); }).join(', ') || '–') + '</span></div><div class="card"><div class="label">Risiko kehabisan</div><b class="v">' + ss.risk.length + ' produk</b><span class="d" style="color:var(--red)">' + (ss.risk.map(function (p) { return esc(p.nama) + ' (' + Math.round(p.cover) + ' hari)'; }).join(', ') || 'Tidak ada') + '</span></div></div>';
    var order = M.prods.slice().sort(function (a, b) { var r = { Naikkan: 0, Kurangi: 1, Tetap: 2 }; return r[a.act] - r[b.act]; });
    var rows = M.prods.map(function (p) {
      var d = dec[p.id], b = p.act === 'Naikkan' ? 'b-dark' : (p.act === 'Kurangi' ? 'b-pink' : 'b-gray'), isEdit = edit && edit.id === p.id;
      var rec = isEdit ? '<input class="q" type="number" min="0" value="' + edit.q + '" data-q aria-label="Jumlah produksi"> ' + esc(p.satuan) : '<span class="rec">' + (d ? d.nilaiAkhir : recOf(p)) + ' ' + esc(p.satuan) + '</span>' + (p.resep && !p.cukup && !d ? '<div class="capline warn" style="margin-top:6px">Bahan hanya cukup ' + fmtN(p.bisa) + ' (saran ' + fmtN(p.saran) + ')' + (p.limitBahan ? ' · ' + esc(p.limitBahan) : '') + '</div>' : '');
      var acts = isEdit ? '<button class="btn btn-red" data-act="save-edit" data-id="' + p.id + '">Simpan</button><button class="btn btn-line" data-act="undo" data-id="' + p.id + '">Batal</button>' : (d ? '<button class="btn btn-ok" disabled>✓ ' + (d.tindakan === 'ikuti' ? 'Diikuti' : 'Diubah') + '</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ulang</button>' : '<button class="btn btn-red" data-act="follow" data-id="' + p.id + '">Ikuti</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ubah</button>');
      return '<tr><td class="nm">' + esc(p.nama) + '' + '</td><td style="white-space:nowrap"><input class="inl sm" type="number" min="0" value="' + p.stok + '" data-stok="' + p.id + '" aria-label="Sisa stok ' + esc(p.nama) + '"> ' + esc(p.satuan) + '</td><td style="white-space:nowrap"><input class="inl sm" type="number" min="0" value="' + p.lalu + '" data-lalu="' + p.id + '" aria-label="Produksi minggu lalu ' + esc(p.nama) + '"> ' + esc(p.satuan) + '</td><td>' + rec + '</td><td><span class="badge ' + b + '">' + p.act + '</span></td><td class="why-t">' + esc(p.why) + '</td><td><div class="acts">' + acts + '</div></td></tr>';
    }).join('');
    var web = '<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Produk</th><th>Sisa stok</th><th>Produksi minggu lalu</th><th>Saran produksi</th><th>Aksi</th><th>Kenapa?</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    var mobile = '<div class="stack">' + order.map(function (p) { return stokCard(p, dec, edit); }).join('') + '</div>';
    return head('Untuk minggu ' + weekRange(), 'Rekomendasi stok', 'Untuk minggu ' + weekRange(), 'Rekomendasi stok', '') + shopHtml(M, dec) + sumCards + mw(mobile, web) + prodCard(M) +
      '<p class="foot-note">Saran dihitung dari penjualan 4-8 minggu terakhir, sisa stok, dan (bila resep diisi) stok bahan baku Anda. Keputusan akhir tetap di tangan Anda.</p>';
  };

  /* ---------- HPP ---------- */
  function recipeUnitInit(b, q) { if (b.satuan === 'gram' && q >= 1000) return { q: q / 1000, u: 'kg' }; if (b.satuan === 'ml' && q >= 1000) return { q: q / 1000, u: 'liter' }; return { q: q, u: b.satuan }; }
  function hppInit(pid) {
    var d = D(); if (!d.produk.length) { UI.hpp = null; return; }
    var p = prodById(pid) || d.produk[0], m = bbById();
    UI.hpp = { pid: p.id, items: p.bahan.map(function (b) { return { id: b.id, nama: b.nama, harga: b.harga }; }), pick: p.harga > 0 ? 1 : 0, hasil: p.hasil || 1, res: (p.resep || []).filter(function (it) { return m[it.bahanId]; }).map(function (it) { var x = recipeUnitInit(m[it.bahanId], it.qty); return { bahanId: it.bahanId, q: +(+x.q).toFixed(4), u: x.u }; }) };
  }
  var r500 = function (v) { return Math.round(v / 500) * 500; };
  function resFromUI() { var h = UI.hpp, m = bbById(); return (h.res || []).filter(function (r) { return m[r.bahanId] && (+r.q) > 0; }).map(function (r) { var b = m[r.bahanId]; return { b: b, qty: toBase(r.q, r.u, b.satuan) }; }); }
  function recipeStats() {
    var hs = Math.max(1e-4, +UI.hpp.hasil || 1), rows = resFromUI(), cost = 0, cap = Infinity, lim = null;
    rows.forEach(function (x) { cost += x.qty * uPriceOf(x.b) / hs; var per = x.qty / hs; if (per > 0) { var c = Math.floor(x.b.stok / per + 1e-9); if (c < cap) { cap = c; lim = x.b; } } });
    return { rows: rows, n: rows.length, cost: cost, cap: cap === Infinity ? null : cap, lim: lim };
  }
  function hppCalc() {
    var h = UI.hpp, p = prodById(h.pid), extra = h.items.reduce(function (a, b) { return a + (+b.harga || 0); }, 0), rs = capResep() ? recipeStats() : null;
    var total = rs && rs.n ? Math.round(rs.cost + extra) : (h.items.length ? extra : p.hpp), cur = p.harga, tm = D().usaha.targetMargin;
    var mg = function (price) { return price > 0 ? Math.round(100 * (price - total) / price) : 0; };
    var goal = total > 0 && tm < 95 ? Math.ceil(total / (1 - tm / 100) / 500) * 500 : 0, opts, np;
    if (cur <= 0 && goal) opts = [goal, r500(goal * 1.07), r500(goal * 1.15)];
    else if (goal > cur) { var mid = Math.min(goal - 500, Math.max(cur + 500, r500(cur * 1.07))); opts = [cur, Math.max(cur + 500, mid), goal]; }
    else opts = [cur, cur + 500, cur + 1000];
    np = opts[Math.min(h.pick, 2)];
    var why;
    if (np === cur) why = 'Harga tidak berubah. Margin tetap ' + mg(cur) + '%' + (goal > cur ? ', di bawah target ' + tm + '%. Harga ' + rp(goal) + ' dibutuhkan untuk mencapai target.' : ' dan akan turun bila harga bahan naik.');
    else if (np === goal) why = 'Harga ini dihitung dari HPP ' + rp(total) + ' dan target margin ' + tm + '%: HPP ÷ (1 − ' + tm + '%), dibulatkan ke Rp500. Margin menjadi ' + mg(np) + '%' + (cur > 0 ? ', naik ' + rp(np - cur) + ' (' + Math.round(100 * (np - cur) / cur) + '%) dari harga sekarang.' : '.');
    else why = (cur > 0 ? 'Kenaikan bertahap ' + rp(np - cur) + ' (' + Math.round(100 * (np - cur) / cur) + '%), ' : '') + 'margin menjadi ' + mg(np) + '%.' + (goal && goal > np ? ' Untuk mencapai target ' + tm + '% dibutuhkan harga ' + rp(goal) + '.' : '');
    return { p: p, total: total, extra: extra, rs: rs, cur: cur, opts: opts, np: np, mg: mg, why: why, tm: tm, goal: goal };
  }
  function hppRight() {
    var c = hppCalc(), h = UI.hpp, red = c.mg(c.cur) < c.tm - 5;
    return '<div class="row"><div><div class="label">Harga jual sekarang</div><div class="big" style="font-size:24px;margin-top:4px">' + (c.cur > 0 ? rp(c.cur) : 'Belum diisi') + '</div></div><div style="text-align:right"><div class="label">Margin</div><div class="big" style="font-size:24px;margin-top:4px;color:' + (red ? 'var(--red)' : 'var(--ink)') + '">' + c.mg(c.cur) + '%</div></div></div>' +
      (c.goal ? '<div class="capline ' + (c.cur >= c.goal ? 'ok' : 'warn') + '" style="margin-top:12px">Harga untuk target margin ' + c.tm + '%: <b>' + rp(c.goal) + '</b>' + (c.cur >= c.goal ? ' · harga Anda sudah memenuhi target' : (c.cur > 0 ? ' · harga Anda masih Rp' + (c.goal - c.cur).toLocaleString('id-ID') + ' di bawahnya' : '')) + '</div>' : '<div class="note-box" style="margin:12px 0 0">Isi bahan dan biaya dulu agar harga yang disarankan bisa dihitung.</div>') + '<div class="label" style="margin-top:18px">' + (c.cur > 0 ? 'Pilihan harga baru' : 'Rekomendasi harga jual') + '</div><div class="opts" role="radiogroup" aria-label="Pilihan harga baru">' + c.opts.map(function (o, i) { return '<button class="opt" role="radio" aria-checked="' + (i === h.pick) + '" data-pick="' + i + '"><b>' + rp(o) + '</b><small>margin ' + c.mg(o) + '%' + (o === c.goal ? ' · target' : (o === c.cur ? ' · sekarang' : '')) + '</small></button>'; }).join('') + '</div>' +
      '<div class="why"><b>Kenapa ' + rp(c.np) + '?</b> ' + esc(c.why) + '</div><button class="btn btn-red btn-block" data-act="save-price" style="margin-top:14px"' + (c.np === c.cur ? ' disabled' : '') + '>Simpan harga baru</button>';
  }
  function ingRows(c) {
    return UI.hpp.items.map(function (it, i) { var old = (c.p.bahan.filter(function (b) { return b.id === it.id; })[0]) || null, badge = ''; if (old && it.harga > old.harga) badge = '<span class="badge b-pink" style="padding:3px 10px;font-size:11.5px">naik</span>'; var log = D().hargaBahan.filter(function (x) { return x.produkId === c.p.id && x.nama === it.nama; }).sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; }); if (!badge && log.length >= 2) { var f = log[0].harga, l = log[log.length - 1].harga; if (f > 0 && (l - f) / f >= 0.05) badge = '<span class="badge b-pink" style="padding:3px 10px;font-size:11.5px">naik ' + Math.round((l - f) / f * 100) + '%</span>'; } return '<div class="ing"><div class="n"><input class="nm" value="' + esc(it.nama) + '" data-nm="' + i + '" aria-label="Nama biaya" placeholder="Nama biaya / bahan">' + badge + '</div><div class="pr"><b>Rp</b><input class="p" inputmode="numeric" value="' + (+it.harga).toLocaleString('id-ID') + '" data-p="' + i + '" aria-label="Harga ' + esc(it.nama) + '"><button class="x" data-rm="' + i + '" aria-label="Hapus">×</button></div></div>'; }).join('');
  }
  function hppSum(c) {
    var rs = c.rs, p = c.p, out;
    out = '<div class="sum3"><div><small>Bahan baku</small><b>' + rp(Math.round(rs.cost)) + '</b></div><div><small>Biaya tambahan</small><b>' + rp(c.extra) + '</b></div><div class="hi"><small>HPP per ' + esc(p.satuan) + '</small><b id="hppTotal">' + rp(c.total) + '</b></div></div>';
    if (!rs.n) out += '<div class="note-box" style="margin:12px 0 0">Resep masih kosong. Pilih bahan dari stok dan isi takarannya agar HPP dan kapasitas produksi terhitung.</div>';
    else {
      var empty = rs.rows.filter(function (x) { return x.b.stok <= 0; });
      if (empty.length) out += '<div class="note-box warn" style="margin:12px 0 0" role="alert"><b>Stok habis:</b> ' + empty.map(function (x) { return esc(x.b.nama); }).join(', ') + '. Perbarui stok di <a class="link" href="#/bahan" style="font-size:inherit">Bahan baku</a>; produksi tidak bisa dihitung sebelum stok diisi.</div>';
      else out += '<div class="capline ' + (rs.cap > 0 ? 'ok' : 'warn') + '" style="margin-top:12px">' + (rs.cap > 0 ? 'Dengan stok sekarang bisa dibuat <b>' + fmtN(rs.cap) + ' ' + esc(p.satuan) + '</b>, terbatas oleh <b>' + esc(rs.lim.nama) + '</b>.' : 'Stok ' + esc(rs.lim.nama) + ' belum cukup untuk membuat satu ' + esc(p.satuan) + '.') + '</div>';
      out += '<button class="btn btn-line btn-block" data-act="go-prod" data-id="' + p.id + '" style="margin-top:12px">Catat produksi</button>';
    }
    return out;
  }
  function resepCard(c) {
    var h = UI.hpp, p = c.p, list = bbList(), m = bbById(), hs = Math.max(1e-4, +h.hasil || 1), body;
    if (!list.length) body = '<p class="sub" style="padding:8px 0">Belum ada bahan baku. Tambahkan stok bahan baku lebih dulu agar HPP bisa dihitung dari takaran resep.</p><a class="btn btn-red" href="#/bahan">Tambah bahan baku</a>';
    else {
      var rows = h.res.map(function (r, i) {
        var b = m[r.bahanId], cost = b ? toBase(r.q, r.u, b.satuan) * uPriceOf(b) / hs : 0, opts = '<option value="">Pilih bahan…</option>' + list.map(function (x) { return '<option value="' + x.id + '"' + (x.id === r.bahanId ? ' selected' : '') + '>' + esc(x.nama) + '</option>'; }).join('');
        var st = b ? (b.stok <= 0 ? '<span class="badge b-pink" style="padding:2px 10px;font-size:11px">Stok habis</span>' : '<small>stok ' + fmtQ(b.stok, b.satuan) + '</small>') : '';
        return '<div class="rrow"><select data-rbahan="' + i + '" aria-label="Bahan baku">' + opts + '</select><div class="rq"><input type="number" step="any" min="0" inputmode="decimal" value="' + numIn(r.q) + '" data-rqty="' + i + '" placeholder="takaran" aria-label="Takaran"><select data-runit="' + i + '" aria-label="Satuan takaran">' + (b ? unitOptions(b.satuan, r.u) : '<option>—</option>') + '</select></div><div class="rc"><b>' + rp(Math.round(cost)) + '</b>' + st + '</div><button class="x" data-rrm="' + i + '" aria-label="Hapus bahan">×</button></div>';
      }).join('');
      body = '<div class="hasil"><span>Resep ini menghasilkan</span><input type="number" step="any" min="0" inputmode="decimal" value="' + numIn(h.hasil) + '" data-hasil aria-label="Jumlah hasil resep"><span>' + esc(p.satuan) + '</span></div>' +
        '<div class="rhead"><span>Bahan</span><span>Takaran total resep</span><span>Biaya / ' + esc(p.satuan) + '</span><span></span></div>' + (rows || '<p class="sub" style="padding:8px 0">Belum ada bahan di resep.</p>') + '<button class="add-ing" data-act="add-rbahan">+ Tambah bahan dari stok</button>';
    }
    return '<div class="card"><div class="row"><div class="label">Resep · bahan baku</div><a class="link" href="#/bahan" style="font-size:12.5px">Kelola stok</a></div><div style="margin-top:6px">' + body + '</div></div>';
  }
  V.hpp = function () {
    var d = D();
    if (!UI.hpp || !prodById(UI.hpp.pid)) hppInit();
    var chips = '<div class="chips" style="margin-bottom:14px">' + d.produk.map(function (p) { return '<button class="chip" aria-pressed="' + (UI.hpp && UI.hpp.pid === p.id) + '" data-hpp-pid="' + p.id + '">' + esc(p.nama) + '</button>'; }).join('') + '<button class="chip sel" data-act="add-prod">+ Produk</button></div>';
    var addForm = UI.addProd || !d.produk.length ? '<form class="card" id="addProd" style="margin-bottom:14px"><div class="label">Produk baru</div><div class="two" style="margin-top:8px"><label class="field"><span>Nama produk</span><input name="nama" required maxlength="60" placeholder="mis. Risol Mayo"></label><label class="field"><span>Satuan</span><input name="satuan" value="pcs" maxlength="12"></label></div><label class="field"><span>Harga jual saat ini (Rp), kosongkan jika belum ada</span><input name="harga" type="number" inputmode="numeric" min="0" placeholder="Usaha berjalan: isi harga sekarang. Produk baru: kosongkan, harga dihitung dari HPP"></label><div class="act"><button type="button" class="btn btn-line" data-act="cancel-prod"' + (d.produk.length ? '' : ' style="visibility:hidden"') + '>Batal</button><button class="btn btn-red" type="submit">Tambah</button></div></form>' : '';
    if (!d.produk.length) return head('Hitung HPP dan harga jual', 'Kalkulator HPP', 'Hitung HPP dan harga jual', 'Kalkulator HPP', '') + '<div style="max-width:560px">' + addForm + '</div>';
    var c = hppCalc(), h = UI.hpp, left;
    if (capResep()) {
      var hasRec = c.rs && c.rs.n;
      left = resepCard(c) + '<div class="card"><div class="row"><div class="label">Biaya tambahan per ' + esc(c.p.satuan) + '</div></div><p class="sub" style="margin:2px 0 6px">Kemasan, gas, listrik, tenaga kerja: biaya yang tidak diambil dari stok bahan baku.</p><div>' + (ingRows(c) || '<p class="sub" style="padding:6px 0">Belum ada biaya tambahan.</p>') + '</div><button class="add-ing" data-act="add-ing">+ Tambah biaya</button><div class="total"><b>Total biaya tambahan</b><b id="hppExtra">' + rp(c.extra) + '</b></div>' + (h.items.length || hasRec ? '' : '<div class="field" style="margin-top:12px"><span>Atau isi HPP langsung (Rp)</span><input type="number" inputmode="numeric" min="0" value="' + c.p.hpp + '" data-hpp-direct></div>') + '</div>' +
        (hasRec || h.items.length ? '<div class="card" id="hppSum">' + hppSum(c) + '</div>' : '<div class="card" id="hppSum"><div class="sum3"><div class="hi"><small>HPP per ' + esc(c.p.satuan) + '</small><b id="hppTotal">' + rp(c.total) + '</b></div></div></div>');
      if (c.rs && !c.rs.n && h.items.length) left = left.replace('id="hppSum">', 'id="hppSum">');
    } else {
      left = '<div class="card"><div class="row"><div class="label">Bahan dan biaya per ' + esc(c.p.satuan) + '</div></div><div style="margin-top:6px">' + (ingRows(c) || '<p class="sub" style="padding:10px 0">Belum ada bahan. Tambahkan bahan untuk menghitung HPP otomatis.</p>') + '</div><button class="add-ing" data-act="add-ing">+ Tambah bahan</button><div class="total"><b>HPP per ' + esc(c.p.satuan) + '</b><b id="hppTotal">' + rp(c.total) + '</b></div>' + (h.items.length ? '' : '<div class="field" style="margin-top:12px"><span>Atau isi HPP langsung (Rp)</span><input type="number" inputmode="numeric" min="0" value="' + c.p.hpp + '" data-hpp-direct></div>') + '</div>';
    }
    return head(esc(c.p.nama) + ' · per ' + esc(c.p.satuan), 'Kalkulator HPP', esc(c.p.nama) + ' · per ' + esc(c.p.satuan), 'Kalkulator HPP', '') + chips + addForm +
      '<div class="two-col"><div class="stack">' + left + '</div><div class="stack"><div class="card" id="hppRight">' + hppRight() + '</div><div class="card" id="risetBox">' + risetCard(c) + '</div><button class="link" data-act="del-prod" style="color:var(--muted);font-weight:500;font-size:13px;margin-top:6px">Hapus produk ini</button></div></div><p class="foot-note">' + (capResep() ? 'HPP = (takaran × harga per satuan bahan ÷ jumlah hasil resep) + biaya tambahan. Harga bahan diambil dari pembelian terakhir di Bahan baku. ' : 'Ketuk harga bahan untuk mengubahnya. ') + 'Margin = (harga jual − HPP) ÷ harga jual. Perubahan harga bahan tercatat otomatis di Analitik. <a class="link" style="font-size:inherit" href="#/belajar/target-margin">Dari mana target margin?</a> · <a class="link" style="font-size:inherit" href="#/belajar/hpp-dasar">Belajar HPP</a>' + (capResep() ? ' · <a class="link" style="font-size:inherit" href="#/belajar/resep-stok-bahan">Resep &amp; stok bahan</a>' : '') + '</p>';
  };
  /* ---------- riset pasar AI ---------- */
  var KUAL = [['ekonomis', 'Ekonomis'], ['medium', 'Medium'], ['premium', 'Premium']];
  function risetOf(pid, kota, kual) { var L = (D().riset || []).filter(function (r) { return r.produkId === pid && r.kualitas === kual && (!kota || r.kota.toLowerCase() === kota.toLowerCase()); }); return L.length ? L[L.length - 1] : null; }
  function rbar(h, cur) {
    var lo = Math.min(h.rendah, cur > 0 ? cur : h.rendah) * 0.92, hi = Math.max(h.tinggi, cur > 0 ? cur : 0) * 1.06, pos = function (v) { return Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100)); };
    var mk = function (v, cls, lbl) { return '<i class="' + cls + '" style="left:' + pos(v).toFixed(1) + '%"><b>' + lbl + '</b><small>' + rp(v) + '</small></i>'; };
    return '<div class="rbar" aria-hidden="true"><span class="rng" style="left:' + pos(h.rendah).toFixed(1) + '%;width:' + (pos(h.tinggi) - pos(h.rendah)).toFixed(1) + '%"></span>' + mk(h.tengah, 'mid', 'Tengah') + (cur > 0 ? mk(cur, 'me', 'Anda') : '') + '</div><div class="rlegend"><span>Rendah ' + rp(h.rendah) + '</span><span>Tinggi ' + rp(h.tinggi) + '</span></div>';
  }
  function risetElapsed(startedAt) {
    var seconds = Math.floor((performance.now() - startedAt) / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function risetCard(c) {
    var p = c.p, rs = UI.rs || (UI.rs = { kual: 'medium', kota: '', busy: false }), kota = rs.kota || D().usaha.kota || '';
    var head = '<div class="row"><div class="label">Riset pasar AI</div><span class="badge b-dark">Beta</span></div>';
    var auto = capRiset(), man = capManual();
    if (!auto && !man) return head + '<p class="sub" style="margin:8px 0 0">AI menilai harga Anda terhadap pasar di wilayah usaha: overprice, kompetitif, atau underprice, lengkap dengan rekomendasi harga. Perbarui backend (Code.gs terbaru) untuk mengaktifkannya.</p>';
    var form = '<p class="sub" style="margin:6px 0 10px">Bandingkan harga ' + esc(p.nama) + ' dengan produk sejenis di wilayah Anda.</p><div class="chips" role="radiogroup" aria-label="Kualitas produk" style="margin-bottom:10px">' + KUAL.map(function (k) { return '<button class="chip" role="radio" aria-checked="' + (rs.kual === k[0]) + '" aria-pressed="' + (rs.kual === k[0]) + '" data-rkual="' + k[0] + '">' + k[1] + '</button>'; }).join('') + '</div>' +
      '<label class="field"><span>Kota / wilayah</span><input id="rsKota" maxlength="60" value="' + esc(kota) + '" placeholder="mis. Bandung"></label>';
    var res = risetOf(p.id, kota, rs.kual), body = '', quota = D().kuotaRiset;
    var exhausted = quota && (!quota.sisa || quota.sisaBulanan === 0);
    var quotaText = quota ? '<p class="sub" aria-live="polite">Paket ' + quota.paket + ' · Sisa ' + quota.sisa + ' dari ' + quota.batas + ' riset minggu ini. Reset Senin pukul 00.00 WIB.' +
      (quota.sisaBulanan === null ? '' : ' Sisa bulan ini ' + quota.sisaBulanan + ' dari 90.') + '</p>' : '';
    var upgrade = exhausted && quota.paket === 'Free' ? '<div class="note-box">Kuota otomatis minggu ini habis. ' + linkPro() + '</div>' : '';
    if (rs.startedAt != null) {
      body = '<div class="note-box riset-progress"><span class="riset-spinner" aria-hidden="true"></span>' +
        '<span role="status">' + (rs.cacheOnly ? 'Mencari hasil tersimpan…' : 'Riset harga sedang berjalan…') + '</span>' +
        '<span class="riset-elapsed" aria-label="Waktu berjalan"><span id="rsElapsed">' + risetElapsed(rs.startedAt) + '</span></span></div>';
    } else if (rs.busy) body = '<div class="note-box" role="status">Menganalisis jawaban…</div>';
    else if (res) {
      var h = res.hasil, pos = A.posisiHarga(c.cur, h, c.total, c.tm, rs.kual), tone = pos.label === 'kompetitif' ? 'ok' : (pos.label === 'belum' ? '' : 'warn');
      var comp = h.pembanding.length ? '<div class="label" style="margin-top:14px">Pembanding ditemukan</div>' + h.pembanding.map(function (x) { return '<div class="cmp"><span>' + (x.url ? '<a class="link" style="font-size:inherit" target="_blank" rel="noopener noreferrer" href="' + esc(x.url) + '">' + esc(x.nama) + '</a>' : esc(x.nama)) + '<small>' + esc(x.sumber) + '</small></span><b>' + rp(x.harga) + '</b></div>'; }).join('') : '';
      body = '<div class="rv ' + tone + '"><span class="badge ' + (tone === 'ok' ? 'b-ok' : (tone === 'warn' ? 'b-pink' : 'b-gray')) + '">' + ({ overprice: 'Overprice', underprice: 'Underprice', kompetitif: 'Kompetitif', belum: 'Belum ada harga' })[pos.label] + '</span><b>' + rp(h.tengah) + '</b><small>harga tengah pasar · ' + KUAL.filter(function (k) { return k[0] === rs.kual; })[0][1] + '</small></div>' + rbar(h, c.cur) +
        (h.ringkas ? '<p class="sub" style="margin:12px 0 0">' + esc(h.ringkas) + '</p>' : '') + pos.catatan.map(function (t) { return '<p class="rnote">' + esc(t) + '</p>'; }).join('') +
        '<div class="rrec"><div><small>Harga rekomendasi</small><b>' + rp(pos.rec) + '</b><small>' + (pos.marginRec != null ? 'margin ' + pos.marginRec + '%' : '') + '</small></div>' + (pos.rec !== c.cur ? '<button class="btn btn-red" data-act="apply-rec" data-v="' + pos.rec + '">Pakai harga ini</button>' : '<span class="badge b-ok">Sudah sesuai</span>') + '</div>' +
        (h.saranValue.length ? '<div class="label" style="margin-top:14px">Saran nilai produk</div><ul class="rsv">' + h.saranValue.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') + comp +
        '<p class="sub" style="margin:12px 0 0;font-size:12px">Cakupan: ' + esc(h.cakupan || res.kota) + (h.asal === 'manual' ? ' · diisi manual dari AI pilihan Anda' : '') + ' · keyakinan ' + esc(h.keyakinan) + ' · riset ' + esc(String(res.dibuat).slice(0, 10)) + (h.catatan ? ' · ' + esc(h.catatan) : '') + '. Data dari pencarian web oleh AI, bukan survei resmi; cek ulang sebelum mengubah harga.</p>';
    }
    var pm = LC.risetPrompt({ produk: p.nama, satuan: p.satuan, jenis: D().usaha.jenis || 'UMKM', kota: kota || '(isi kota)', kualitas: rs.kual }), manual = !man ? '' :
      '<details class="rman"' + (rs.paste || !auto ? ' open' : '') + '><summary>' + (auto ? 'Atau pakai ChatGPT / Gemini / Claude langganan Anda (tanpa API)' : 'Pakai ChatGPT / Gemini / Claude langganan Anda (tanpa API)') + '</summary>' +
      '<ol><li>Salin prompt ini, tempel di AI favorit Anda <b>dengan pencarian web aktif</b>.</li><li>Salin jawaban JSON-nya, tempel di kotak bawah.</li></ol>' +
      '<textarea id="rsPrompt" readonly rows="4" aria-label="Prompt riset">' + esc(pm.system + '\n\n' + pm.user) + '</textarea><button class="btn btn-line btn-sm" data-act="rs-copy" style="margin:6px 0 10px">Salin prompt</button>' +
      '<textarea id="rsPaste" maxlength="20000" rows="5" placeholder="Tempel jawaban JSON dari AI di sini" aria-label="Jawaban AI">' + esc(rs.paste || '') + '</textarea><button class="btn btn-red btn-block" data-act="rs-manual" style="margin-top:8px"' + (rs.busy ? ' disabled' : '') + '>Analisis jawaban</button>' +
      '<p class="sub" style="font-size:12px;margin:8px 0 0">Jawaban AI bisa keliru. Cek pembanding dan sumbernya sebelum mengubah harga.</p></details>';
    return head + form + body + (auto ? quotaText + upgrade + '<button class="btn ' + (res ? 'btn-line' : 'btn-red') + ' btn-block" data-act="riset" style="margin-top:12px"' + (rs.busy ? ' disabled' : '') + '>' + (exhausted ? 'Cek hasil tersimpan' : (res ? 'Riset ulang' : 'Riset otomatis')) + '</button>' : '') + manual;
  }
  function hppLive() {
    var c = hppCalc(), sum = $('#hppSum'); if (sum && c.rs) { if (c.rs.n || UI.hpp.items.length) sum.innerHTML = hppSum(c); else { var t0 = $('#hppTotal'); if (t0) t0.textContent = rp(c.total); } } else { var t1 = $('#hppTotal'); if (t1) t1.textContent = rp(c.total); }
    var ex = $('#hppExtra'); if (ex) ex.textContent = rp(c.extra); var r = $('#hppRight'); if (r) r.innerHTML = hppRight();
  }

  /* ---------- bahan baku ---------- */
  var BB_UNITS = LC.units.PRESET;
  function bbPrevText(f) {
    var base = f.sat || 'gram', isi = +f.isi, harga = +f.harga;
    if (!(isi > 0) || !(harga > 0)) return 'Isi jumlah dan harga beli untuk menghitung harga per satuan.';
    var per = harga / toBase(isi, f.isiU || base, base); return 'Harga per ' + esc(base) + ': <b>' + fmtPrice(per) + '</b>';
  }
  function bbFormHtml(f) {
    var isCustom = f.sat && BB_UNITS.indexOf(f.sat) < 0, used = f.id && D().produk.some(function (p) { return (p.resep || []).some(function (r) { return r.bahanId === f.id; }); }), base = f.sat || 'gram';
    var satOpts = BB_UNITS.map(function (u) { return '<option' + (u === f.sat ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '<option value="__c"' + (isCustom ? ' selected' : '') + '>Lainnya (ketik sendiri)…</option>';
    return '<form class="card" id="bbForm" data-id="' + esc(f.id || '') + '"><div class="label">' + (f.id ? 'Ubah bahan baku' : 'Tambah bahan baku') + '</div>' +
      '<label class="field"><span>Nama bahan</span><input name="nama" required maxlength="60" value="' + esc(f.nama || '') + '" placeholder="mis. Daging ayam"></label>' +
      '<div class="two"><label class="field"><span>Satuan stok</span><select name="sat" id="bbSat"' + (used ? ' disabled' : '') + '>' + satOpts + '</select><input name="custom" id="bbCustom" maxlength="12" placeholder="mis. ikat, sdm, botol" value="' + (isCustom ? esc(f.sat) : '') + '"' + (isCustom ? '' : ' hidden') + '></label><label class="field"><span>Stok sekarang</span><input name="stok" type="number" step="any" min="0" inputmode="decimal" value="' + numIn(f.stok) + '" placeholder="0"></label></div>' + (used ? '<p class="sub" style="margin:-4px 0 8px">Satuan terkunci karena bahan ini dipakai di resep.</p>' : '') +
      '<div class="label" style="margin-top:4px">Harga beli</div><div class="two"><label class="field"><span>Beli sebanyak</span><div class="inrow"><input name="isi" type="number" step="any" min="0" inputmode="decimal" value="' + numIn(f.isi) + '" data-bbcalc placeholder="mis. 1"><select name="isiU" id="bbIsiU" data-bbcalc>' + unitOptions(base, f.isiU || base) + '</select></div></label><label class="field"><span>Seharga (Rp)</span><input name="harga" type="number" min="0" inputmode="numeric" value="' + numIn(f.harga) + '" data-bbcalc placeholder="mis. 44000"></label></div><div class="sub" id="bbPrev" style="margin:-2px 0 10px">' + bbPrevText(f) + '</div>' +
      '<label class="field"><span>Batas minimum stok (opsional)</span><input name="min" type="number" step="any" min="0" inputmode="decimal" value="' + numIn(f.min) + '" placeholder="Ditandai menipis di bawah angka ini"></label>' +
      '<div class="act"><button type="button" class="btn btn-line" data-act="bb-cancel">Batal</button><button class="btn btn-red" type="submit">Simpan</button></div></form>';
  }
  function bbBeliHtml(b) {
    return '<form class="card" id="bbBeli" data-id="' + b.id + '"><div class="label">Beli ' + esc(b.nama) + '</div><p class="sub" style="margin:2px 0 10px">Stok sekarang ' + fmtQ(b.stok, b.satuan) + '. Pembelian menambah stok dan memperbarui harga per satuan.</p><div class="two"><label class="field"><span>Jumlah dibeli</span><div class="inrow"><input name="jml" type="number" step="any" min="0" inputmode="decimal" required placeholder="mis. 2"><select name="u">' + unitOptions(b.satuan, b.satuan) + '</select></div></label><label class="field"><span>Total harga (Rp)</span><input name="total" type="number" min="0" inputmode="numeric" required placeholder="mis. 88000"></label></div><div class="act"><button type="button" class="btn btn-line" data-act="bb-cancel">Batal</button><button class="btn btn-red" type="submit">Simpan pembelian</button></div></form>';
  }
  V.bahan = function () {
    var d = D(), ui = UI.bb || (UI.bb = { form: null, beli: null });
    var hd = head('Stok, satuan, dan harga beli', 'Bahan baku', 'Stok, satuan, dan harga beli', 'Bahan baku', '');
    if (!capResep()) return hd + '<div class="card"><p>Fitur bahan baku butuh pembaruan backend. Salin <b>Code.gs</b> terbaru ke Apps Script, lalu buat versi baru. Panduannya ada di README backend.</p></div>';
    var M = compute(30), B = M.bahan, list = B.list, adding = ui.form ? bbFormHtml(ui.form) : '', beli = ui.beli && bbOne(ui.beli) ? bbBeliHtml(bbOne(ui.beli)) : '';
    var cards = '<div class="stock-stats"><div class="card"><div class="label">Nilai persediaan</div><b class="v">' + rp(Math.round(B.nilai)) + '</b><span class="d">' + list.length + ' bahan baku</span></div><div class="card"><div class="label">Perlu dibeli</div><b class="v">' + B.kurang.length + ' bahan</b><span class="d" style="color:' + (B.kurang.length ? 'var(--red)' : 'var(--ink)') + '">' + (B.kurang.length ? 'Perkiraan ' + rp(B.totalBiaya) : 'Stok cukup') + '</span></div><div class="card"><div class="label">Habis / menipis</div><b class="v">' + (list.filter(function (b) { return b.status === 'habis' || b.status === 'menipis'; }).length) + ' bahan</b><span class="d">' + (list.filter(function (b) { return b.status === 'habis' || b.status === 'menipis'; }).slice(0, 3).map(function (b) { return esc(b.nama); }).join(', ') || '–') + '</span></div></div>';
    var shop = B.kurang.length ? '<div class="note-box warn"><b>Perlu dibeli:</b> ' + B.kurang.map(function (k) { return esc(k.nama) + ' ' + fmtQ(k.beli, k.satuan); }).join(', ') + ' (≈ ' + rp(B.totalBiaya) + '). Lihat rinciannya di <a class="link" href="#/stok" style="font-size:inherit">Rekomendasi stok</a>.</div>' : '';
    var btn = '<div class="act" style="margin:0 0 12px;justify-content:flex-start"><button class="btn btn-red" data-act="bb-new">+ Tambah bahan baku</button></div>';
    if (!list.length) return hd + btn + adding + '<div class="card"><p>Belum ada bahan baku. Tambahkan bahan (mis. daging ayam, tepung) beserta stok dan harga belinya. Satuannya bebas: kg, gram, pcs, ml, atau satuan sendiri. Setelah itu isi resep tiap produk di <a class="link" href="#/hpp" style="font-size:inherit">Kalkulator HPP</a>.</p></div>';
    var stat = function (b) { var s2 = statusB[b.status]; return '<span class="badge ' + s2[1] + '">' + s2[0] + '</span>'; };
    var full = function (b) { return bbOne(b.id); };
    var rows = list.map(function (b) { var o = full(b); return '<tr><td class="nm">' + esc(b.nama) + '</td><td style="white-space:nowrap"><input class="inl sm" type="number" step="any" min="0" value="' + numIn(b.stok) + '" data-bbstok="' + b.id + '" aria-label="Stok ' + esc(b.nama) + '"> ' + esc(b.satuan) + '<div class="sub">' + (b.satuan === 'gram' || b.satuan === 'ml' ? '≈ ' + fmtQ(b.stok, b.satuan) : '') + '</div></td><td>' + fmtPrice(b.harga) + '/' + esc(b.satuan) + '<div class="sub">beli ' + fmtQ(o.isiBeli, o.satuan) + ' = ' + rp(o.hargaBeli) + '</div></td><td class="why-t">' + (b.dipakai.length ? esc(b.dipakai.join(', ')) : '<span class="sub">Belum dipakai di resep</span>') + '</td><td>' + stat(b) + '</td><td><div class="acts"><button class="btn btn-line" data-act="bb-beli" data-id="' + b.id + '">Beli</button><button class="btn btn-line" data-act="bb-edit" data-id="' + b.id + '">Ubah</button><button class="btn btn-line" data-act="bb-del" data-id="' + b.id + '" aria-label="Hapus ' + esc(b.nama) + '">Hapus</button></div></td></tr>'; }).join('');
    var web = '<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Bahan</th><th>Stok</th><th>Harga per satuan</th><th>Dipakai di</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    var mobile = '<div class="stack">' + list.map(function (b) { var o = full(b); return '<div class="card bb-card"><div class="head"><h3>' + esc(b.nama) + '</h3>' + stat(b) + '</div><div class="kv"><div><small>Stok (' + esc(b.satuan) + ')</small><input class="inl" type="number" step="any" min="0" inputmode="decimal" value="' + numIn(b.stok) + '" data-bbstok="' + b.id + '" aria-label="Stok ' + esc(b.nama) + '"></div><div class="hi"><small>Harga per ' + esc(b.satuan) + '</small><b>' + fmtPrice(b.harga) + '</b></div></div><div class="sub">Beli ' + fmtQ(o.isiBeli, o.satuan) + ' = ' + rp(o.hargaBeli) + ' · ' + (b.dipakai.length ? 'dipakai di ' + esc(b.dipakai.join(', ')) : 'belum dipakai di resep') + '</div><div class="act"><button class="btn btn-red" data-act="bb-beli" data-id="' + b.id + '">Beli</button><button class="btn btn-line" data-act="bb-edit" data-id="' + b.id + '">Ubah</button><button class="btn btn-line" data-act="bb-del" data-id="' + b.id + '">Hapus</button></div></div>'; }).join('') + '</div>';
    return hd + cards + shop + btn + adding + beli + mw(mobile, web) + '<p class="foot-note">Stok produk jadi diatur di <a class="link" href="#/stok" style="font-size:inherit">Rekomendasi stok</a>. Perbarui stok bahan setiap kali belanja atau menghitung ulang di gudang. <a class="link" style="font-size:inherit" href="#/belajar/resep-stok-bahan">Pelajari resep &amp; stok bahan</a></p>';
  };
  function bbRead(f) {
    var base = f.elements.sat.value === '__c' ? f.elements.custom.value.trim().toLowerCase() : f.elements.sat.value;
    return { sat: base, isi: f.elements.isi.value, isiU: f.elements.isiU.value, harga: f.elements.harga.value };
  }
  function bbPreview() { var f = $('#bbForm'); if (!f) return; var el = $('#bbPrev'); if (el) el.innerHTML = bbPrevText(bbRead(f)); }
  function bbLog(b) { D().hargaBahan.push({ id: uid('h'), produkId: '', nama: b.nama, harga: Math.round(uPriceOf(b) * 100) / 100, tanggal: today() }); }
  function bbRefresh(msg) { return reload().then(function () { UI.hpp = null; render(true); if (msg) toast(msg); }); }

  /* ---------- catat ---------- */
  var KANAL = [['toko', 'Toko sendiri'], ['wa', 'WhatsApp'], ['reseller', 'Reseller'], ['gofood', 'GoFood / Grab / Shopee'], ['marketplace', 'Marketplace'], ['lainnya', 'Lainnya']];
  var prodOpts = function (sel) { return D().produk.map(function (p) { return '<option value="' + p.id + '" data-h="' + p.harga + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.nama) + '</option>'; }).join(''); };
  V.catat = function () {
    var d = D(), tabs = [['cepat', 'Isi cepat'], ['foto', 'Foto nota'], ['impor', 'Impor']];
    if (proActive()) tabs.push(['promosi', 'Promosi']);
    else if (UI.cat === 'promosi') UI.cat = 'cepat';
    var seg = '<div class="seg" role="tablist">' + tabs.map(function (t) { return '<button role="tab" aria-selected="' + (UI.cat === t[0]) + '" data-ct="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var noProd = '<div class="card"><p>Belum ada produk. <a class="link" href="#/hpp" style="font-size:inherit">Tambah produk dulu di Kalkulator HPP</a>.</p></div>', pane = '';
    var kanalSel = function (n) { return '<select name="' + (n || 'kanal') + '">' + KANAL.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select>'; };
    if (UI.cat === 'cepat') {
      var hist = d.penjualan.slice(-10).reverse();   // urut berdasarkan waktu dicatat (terbaru di atas)
      pane = !d.produk.length ? noProd : '<div class="card"><form id="saleForm" novalidate><div class="two"><label class="field"><span>Tanggal</span><input name="tanggal" type="date" value="' + today() + '" max="' + today() + '" required></label><label class="field"><span>Jam</span><input name="jam" type="time" value="' + nowTime() + '"></label></div><label class="field"><span>Produk</span><select name="produk" id="saleProd">' + prodOpts() + '</select></label><div class="two"><label class="field"><span>Jumlah terjual</span><input name="qty" type="number" inputmode="decimal" step="any" min="0.000001" max="1000000" placeholder="mis. 24" required></label><label class="field"><span>Harga per unit (Rp)</span><input name="harga" id="saleHarga" type="number" inputmode="decimal" step="any" min="0" max="1000000000" value="' + d.produk[0].harga + '" required></label></div><label class="field"><span>Kanal</span>' + kanalSel() + '</label><button class="btn btn-red btn-block" type="submit">Simpan catatan</button></form></div>' +
        '<div class="card"><div class="label" style="margin-bottom:6px">Catatan terbaru</div><div class="list">' + (hist.length ? hist.map(function (s) { var p = prodById(s.produkId); return '<div><span><b>' + esc(p ? p.nama : '?') + '</b><br><small>' + s.tanggal + ' ' + s.jam + ' · ' + s.qty + ' terjual · ' + esc((KANAL.filter(function (k) { return k[0] === s.kanal; })[0] || [0, s.kanal])[1]) + '</small></span><span style="text-align:right"><b>' + rp(s.qty * s.harga) + '</b><br><button class="x" data-deltx="' + s.id + '" aria-label="Hapus catatan" style="color:var(--muted-2);font-size:12px">hapus</button></span></div>'; }).join('') : '<p class="sub">Belum ada catatan.</p>') + '</div></div>';
    } else if (UI.cat === 'foto') {
      var rows = ''; for (var i = 0; i < UI.notaRows; i++) rows += '<div class="nota-row"><select name="np' + i + '">' + prodOpts() + '</select><input name="nq' + i + '" type="number" inputmode="numeric" min="0" placeholder="Jumlah"><input name="nh' + i + '" type="number" inputmode="numeric" min="0" placeholder="Harga"></div>';
      pane = !d.produk.length ? noProd : '<div class="card"><label class="drop" for="nota">' + ic('camera') + '<b>Foto nota atau catatan tulis</b><span>Ambil foto sebagai rujukan, lalu ketik isinya di bawah.</span><span class="btn btn-red btn-sm" style="margin-top:4px">Ambil / pilih foto</span></label><input id="nota" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" capture="environment" class="sr">' + (UI.notaImg ? '<img class="preview" alt="Foto nota" src="' + UI.notaImg + '">' : '') + '<p class="sub" style="margin-top:10px">Pembacaan otomatis dari foto belum aktif; foto ini hanya rujukan di layar dan tidak diunggah.</p></div>' +
        '<form class="card" id="notaForm"><div class="label">Isi dari nota</div><label class="field" style="margin-top:8px"><span>Tanggal nota</span><input name="tanggal" type="date" value="' + today() + '" max="' + today() + '"></label><div class="nota-head"><span>Produk</span><span>Jumlah</span><span>Harga</span></div>' + rows + '<button type="button" class="add-ing" data-act="nota-row">+ Tambah baris</button><button class="btn btn-red btn-block" type="submit" style="margin-top:12px">Simpan semua</button></form>';
    } else if (UI.cat === 'impor') {
      pane = '<div class="card"><div class="src"><div class="ic">CSV</div><div class="t"><b>CSV</b><small>Kolom: produk, jumlah, harga, tanggal (harga &amp; tanggal opsional)</small></div><label class="btn btn-line btn-sm" for="csv">Pilih file</label><input id="csv" type="file" accept=".csv,text/csv" class="sr"></div>' +
        '<div class="src"><div class="ic">POS</div><div class="t"><b>Aplikasi kasir</b><small>Impor penjualan otomatis dari POS</small></div><span class="badge b-gray">Segera</span></div><div class="src"><div class="ic">GF</div><div class="t"><b>GoFood, GrabFood, ShopeeFood</b><small>Tarik laporan penjualan marketplace</small></div><span class="badge b-gray">Segera</span></div></div>' +
        '<p class="foot-note" style="text-align:left">Simpan Excel sebagai CSV. Nama produk harus sama dengan produk di akun Anda. <a class="link" style="font-size:inherit" href="data:text/csv;charset=utf-8,produk%2Cjumlah%2Charga%2Ctanggal%0ARisol%20Mayo%2C24%2C10000%2C' + today() + '%0A" download="contoh-impor-laku-ai.csv">Unduh contoh CSV</a></p>';
    } else {
      var M = compute(30);
      pane = '<form class="card" id="promoForm"><div class="label">Catat promosi</div><label class="field" style="margin-top:8px"><span>Nama promosi</span><input name="nama" required maxlength="80" placeholder="mis. Diskon Risol Mayo Jumat"></label><label class="field"><span>Produk</span><select name="produk"><option value="">Semua produk</option>' + prodOpts() + '</select></label><div class="two"><label class="field"><span>Mulai</span><input name="mulai" type="date" value="' + A.addDays(today(), -7) + '" required></label><label class="field"><span>Selesai</span><input name="selesai" type="date" value="' + today() + '" required></label></div><button class="btn btn-red btn-block" type="submit">Simpan promosi</button></form>' +
        '<div class="card"><div class="label" style="margin-bottom:6px">Promosi tercatat</div><div class="list">' + (M.promos.length ? M.promos.map(function (p) { return '<div><span><b>' + esc(p.nama) + '</b><br><small>' + p.mulai + ' s/d ' + p.selesai + ' · ' + (p.effect == null ? p.verdict : (p.effect >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(p.effect * 100)) + '% · ' + p.verdict) + '</small></span><button class="x" data-delpromo="' + p.id + '" style="color:var(--muted-2);font-size:12px">hapus</button></div>'; }).join('') : '<p class="sub">Belum ada promosi.</p>') + '</div></div>';
    }
    return head('Isi cepat, foto nota, dan impor', 'Catat penjualan', 'Isi cepat, foto nota, dan impor dari aplikasi kasir', 'Catat penjualan', '') + '<div style="max-width:660px"><div class="stack">' + seg + pane + '</div></div>';
  };

  /* ---------- roadmap ---------- */
  V.roadmap = function () {
    var M = compute(30), st = M.stages, cur = M.curStage, learnT = function (id) { var t = Pus.topics.filter(function (x) { return x.id === id; })[0]; return t ? t.judul : ''; };
    var crit = function (c, withLinks) {
      var inner = '<i>' + (c.ok ? ic('check', 3) : '') + '</i><span>' + esc(c.text) + '</span>';
      var left = c.manual ? '<button class="check' + (c.ok ? ' done' : '') + '" data-chk="' + c.manual + '" aria-pressed="' + c.ok + '">' + inner + '</button>' : '<div class="check' + (c.ok ? ' done' : '') + '">' + inner + '</div>';
      var links = withLinks ? '<div class="clinks">' + (!c.ok && c.href && c.href.indexOf('#/belajar') !== 0 ? '<a href="' + c.href + '">Buka</a>' : '') + (c.learn ? '<a href="#/belajar/' + c.learn + '" title="' + esc(learnT(c.learn)) + '">Pelajari</a>' : '') + '</div>' : '';
      return '<div class="crit">' + left + links + '</div>';
    };
    var next = null; st[cur].k.forEach(function (c) { if (!next && !c.ok) next = c; });
    var doneN = st.filter(function (x) { return x.done; }).length;
    var summary = '<div class="card rm-sum"><div class="row"><div><div class="label">Perjalanan usaha</div><h2 style="font-size:22px;margin:4px 0 2px">' + (doneN === st.length ? 'Semua tahap selesai' : 'Tahap ' + (cur + 1) + ' dari ' + st.length + ': ' + esc(st[cur].nama)) + '</h2><div class="sub">' + doneN + ' tahap selesai · kemajuan keseluruhan ' + M.stagePct + '%</div></div><div class="rm-ring">' + donut(M.stagePct, 84).replace('dari 100', '%') + '</div></div><div class="track" style="margin-top:12px"><i style="width:' + M.stagePct + '%"></i></div>' +
      (next ? '<div class="why" style="margin-top:12px"><b>Langkah berikutnya:</b> ' + esc(next.text) + (next.href && next.href.indexOf('#/belajar') !== 0 ? ' <a class="link" style="font-size:13px" href="' + next.href + '">Buka →</a>' : '') + '</div>' : '') + '</div>';
    var rows = st.map(function (x, i) {
      var head = '<div class="stage-h"><span class="sn">' + (x.done ? ic('check', 3) : (x.status === 'locked' ? ic('lock', 2) : (i + 1))) + '</span><div class="st"><small>Tahap ' + (i + 1) + ' · perkiraan ' + x.est + '</small><h3>' + esc(x.nama) + '</h3><p>' + esc(x.ringkas) + '</p></div><span class="badge ' + (x.done ? 'b-ok' : (x.status === 'now' ? 'b-pink' : 'b-gray')) + '">' + (x.done ? 'Selesai' : (x.status === 'now' ? x.pct + '%' : 'Terkunci')) + '</span></div>';
      if (x.status === 'now') return '<div class="stage now" id="stage-' + x.id + '"><div class="here">Anda di sini</div>' + head + '<div class="track red" style="margin:10px 0 6px"><i style="width:' + x.pct + '%"></i></div>' + x.k.map(function (c) { return crit(c, true); }).join('') + '</div>';
      if (x.done) return '<details class="stage done" id="stage-' + x.id + '"><summary>' + head + '</summary><div class="stage-b">' + x.k.map(function (c) { return crit(c, false); }).join('') + '</div></details>';
      return '<details class="stage locked" id="stage-' + x.id + '"><summary>' + head + '</summary><div class="stage-b"><p class="sub" style="margin:0 0 6px">Terbuka setelah Tahap ' + cur + ' selesai. Syaratnya:</p>' + x.k.map(function (c) { return crit(c, false); }).join('') + '</div></details>';
    }).join('');
    return head('Tahap usaha dari data Anda', 'Roadmap usaha', 'Tahap usaha, dihitung dari data penjualan Anda', 'Roadmap usaha', '') +
      '<div class="two-col"><div class="stack">' + summary + '<div class="card"><div class="label" style="margin-bottom:6px">Cara membaca roadmap</div><p class="sub" style="line-height:1.6">Roadmap ini <b>berbasis pencapaian, bukan kalender</b>. Tahap berikutnya terbuka setelah semua syarat tahap sekarang terpenuhi, dan syaratnya dinilai otomatis dari catatan Anda. Tahap yang sudah lewat tetap bisa dibuka untuk melihat syaratnya; bila data berubah dan syarat tidak lagi terpenuhi, tahapnya kembali aktif. Perkiraan waktu hanya gambaran umum.</p><a class="link" style="font-size:13px;margin-top:8px" href="#/belajar/baca-skor">Pelajari cara perhitungannya →</a></div></div>' +
      '<div class="timeline">' + rows + '</div></div>';
  };

  V.paket = function () {
    var d = D(), tl = trialLeft(), used = tl == null ? 0 : Math.max(0, Math.min(14, 14 - tl)), pro = proActive(), pr = d.usaha.prefs;
    var ya = '<span class="yes">' + ic('check', 3) + '</span>', no = '<span class="no">–</span>';
    var rowsT = [['Kalkulator HPP dan harga jual', 1, 1], ['Catat penjualan (isi cepat, nota, impor CSV)', 1, 1], ['Pustaka belajar dan kamus istilah', 1, 1], ['Ringkasan dasar penjualan', 1, 1], ['Riset pasar otomatis', '5/minggu', '20/minggu · maks. 90/bulan'], ['Skor kesehatan usaha dan diagnosis', 0, 1], ['Insight AI dengan alasan dan data', 0, 1], ['Analitik: produk, waktu ramai, kanal, promosi', 0, 1], ['Rekomendasi stok per produk', 0, 1], ['Roadmap tahap usaha', 0, 1]];
    var table = '<table class="ptable"><thead><tr><th>Fitur</th><th>Gratis</th><th class="pro">Klinik Pro</th></tr></thead><tbody>' + rowsT.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + (typeof r[1] === 'string' ? r[1] : (r[1] ? ya : no)) + '</td><td class="pro">' + (typeof r[2] === 'string' ? r[2] : (r[2] ? ya : no)) + '</td></tr>'; }).join('') + '</tbody></table>';
    return head('Paket dan uji coba', 'Paket', 'Paket dan uji coba', 'Paket', '') +
      '<div class="two-col"><div class="stack">' +
      '<div class="planbox"><div class="label">Paket Anda</div><h3>' + (pro ? 'Klinik Pro' : 'Gratis') + '</h3><div style="color:#B0BEC5;font-size:13.5px">' + (pro ? (tl > 0 ? 'Uji coba 14 hari · sisa ' + tl + ' hari' : 'Paket Pro aktif') : 'Fitur dasar') + '</div>' + (pro && tl !== null ? '<div class="track" style="margin:14px 0 4px;background:rgba(255,255,255,.18)"><i style="width:' + (used / 14 * 100) + '%;background:#F4B7B2"></i></div><div style="color:#B0BEC5;font-size:12.5px">Hari ke-' + used + ' dari 14</div>' : '') + '<div class="price-big">Rp49.000<small> / bulan</small></div><div style="color:#B0BEC5;font-size:12.5px">Harga awal, akan diuji di beta dan dapat berubah.</div></div>' +
      '<div class="card"><div class="label">Status saat ini</div><p style="margin:8px 0 0;color:var(--ink-2)"><b>Belum ada penagihan selama beta.</b> Anda bisa meminta pemberitahuan saat langganan dibuka. Data akun tetap tersimpan setelah masa uji coba.</p>' +
      '<div class="menu" style="margin-top:6px"><div><span><b>Kabari saya saat berlangganan dibuka</b><small>Hanya pemberitahuan di aplikasi, tidak ada kewajiban</small></span><button class="switch" role="switch" aria-checked="' + !!pr.pro_notify + '" data-pref="pro_notify"></button></div></div></div></div>' +
      '<div class="stack"><div class="card"><div class="label" style="margin-bottom:8px">Gratis dan Klinik Pro</div>' + table + '</div>' +
      '<div class="card"><div class="label">Pertanyaan umum</div><div class="faq"><details><summary>Apa yang terjadi setelah uji coba berakhir?</summary><p>Setelah 14 hari, akun kembali ke paket Gratis. Modul Pro terkunci sampai paket Pro aktif.</p></details><details><summary>Mengapa Pro diberi harga?</summary><p>Diagnosis, analitik, dan saran stok membutuhkan penyimpanan dan pengolahan data, dan layanan ini dirancang berkelanjutan.</p></details><details><summary>Apakah data saya aman?</summary><p>Data hanya dipakai untuk analisis akun Anda dan bisa diunduh atau dihapus kapan saja. Baca <a href="../privasi/">Kebijakan Privasi</a>.</p></details></div></div></div></div>';
  };

  var calcOut = function (k) { return '<div class="calc-out" data-out="' + k + '"></div>'; };
  function renderCalc(name) {
    var inp = function (id, label, val, suf) { return '<label class="field"><span>' + label + '</span><input data-calc-in="' + id + '" type="number" inputmode="decimal" min="0" value="' + val + '"' + (suf ? ' placeholder="' + suf + '"' : '') + '></label>'; };
    if (name === 'margin') return '<div class="card calc" data-calc="margin"><div class="label">Hitung margin dan markup</div><div class="two" style="margin-top:8px">' + inp('hpp', 'HPP per unit (Rp)', 35500) + inp('harga', 'Harga jual (Rp)', 45000) + '</div>' + calcOut('margin') + '</div>';
    if (name === 'target') return '<div class="card calc" data-calc="target"><div class="label">Hitung target margin kotor Anda</div><div style="margin-top:8px">' + inp('omzet', 'Perkiraan omzet per bulan (Rp)', 12000000) + inp('biaya', 'Biaya operasional per bulan (Rp)', 2400000) + inp('laba', 'Laba bersih yang diinginkan (% dari omzet)', 15) + '</div>' + calcOut('target') + '<button class="btn btn-red btn-block" data-act="apply-target" style="margin-top:12px">Pakai sebagai target margin saya</button><div class="hint">Angka awal di kolom adalah contoh. Isi dengan angka usaha Anda.</div></div>';
    if (name === 'bep') return '<div class="card calc" data-calc="bep"><div class="label">Hitung titik impas cabang</div><div style="margin-top:8px">' + inp('tetap', 'Biaya tetap cabang per bulan (Rp)', 6000000) + inp('harga', 'Harga jual per unit (Rp)', 45000) + inp('var', 'Biaya variabel per unit (Rp)', 35500) + '</div>' + calcOut('bep') + '</div>';
    return '';
  }
  function updateCalc(box) {
    var g = function (id) { var e = $('[data-calc-in="' + id + '"]', box); return e ? (+e.value || 0) : 0; }, out = $('.calc-out', box), n = box.dataset.calc, f = function (v, d) { return (+v).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 1 : d }); };
    if (n === 'margin') { var h = g('hpp'), p = g('harga'); out.innerHTML = p > 0 ? '<div class="co"><span>Laba kotor per unit</span><b>' + rp(p - h) + '</b></div><div class="co"><span>Margin kotor</span><b>' + f((p - h) / p * 100) + '%</b></div><div class="co"><span>Markup</span><b>' + (h > 0 ? f((p - h) / h * 100) + '%' : '–') + '</b></div>' : '<span class="sub">Isi harga jual.</span>'; }
    if (n === 'target') { var o = g('omzet'), b = g('biaya'), l = g('laba'), t = o > 0 ? (b + o * l / 100) / o * 100 : 0; box.dataset.val = t; out.innerHTML = o > 0 ? '<div class="co"><span>Biaya operasional + laba yang diinginkan</span><b>' + rp(b + o * l / 100) + '</b></div><div class="co big"><span>Target margin kotor</span><b>' + f(t) + '%</b></div>' + (t >= 90 ? '<div class="hint" style="color:var(--red)">Terlalu tinggi untuk dicapai. Periksa biaya atau naikkan omzet.</div>' : '') : '<span class="sub">Isi perkiraan omzet.</span>'; }
    if (n === 'bep') { var tt = g('tetap'), hh = g('harga'), vv = g('var'), k = hh - vv; out.innerHTML = k > 0 ? '<div class="co"><span>Sumbangan per unit</span><b>' + rp(k) + '</b></div><div class="co big"><span>Titik impas</span><b>' + f(Math.ceil(tt / k), 0) + ' unit / bulan</b></div><div class="co"><span>Setara</span><b>±' + f(tt / k / 30, 1) + ' unit / hari</b></div>' : '<span class="sub">Harga jual harus lebih besar dari biaya variabel.</span>'; }
  }
  function blok(b) {
    var t = b[0];
    if (t === 'h') return '<h3 class="ah">' + b[1] + '</h3>';
    if (t === 'p') return '<p>' + b[1] + '</p>';
    if (t === 'ul') return '<ul>' + b[1].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    if (t === 'ol') return '<ol>' + b[1].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>';
    if (t === 'box') { var lbl = { rumus: 'Rumus', contoh: 'Contoh', tip: 'Tips', catatan: 'Catatan' }[b[1]] || ''; return '<div class="abox ' + b[1] + '"><b>' + lbl + '</b><div>' + b[2] + '</div></div>'; }
    if (t === 'calc') return renderCalc(b[1]);
    if (t === 'tabel') return '<div class="atable"><table><thead><tr>' + b[1].map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + b[2].map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    return '';
  }
  var learned = function () { var a = D().usaha.prefs.belajar; return Array.isArray(a) ? a : []; };
  V.belajar = function (id) {
    var T = Pus.topics, done = learned();
    if (id === 'kamus' || (id && !T.filter(function (x) { return x.id === id; })[0])) id = id === 'kamus' ? 'kamus' : '';
    if (id && id !== 'kamus') {
      var t = T.filter(function (x) { return x.id === id; })[0], isDone = done.indexOf(t.id) >= 0;
      var rel = (t.terkait || []).map(function (r) { return T.filter(function (x) { return x.id === r; })[0]; }).filter(Boolean);
      return '<a class="back" href="#/belajar">' + ic('back', 2) + 'Pustaka belajar</a><article class="article"><div class="eyebrow">' + esc(t.kat) + ' · ' + t.menit + ' menit baca</div><h1 class="h1" style="margin:4px 0 8px">' + esc(t.judul) + '</h1><p class="lead2">' + esc(t.ringkas) + '</p>' + t.blok.map(blok).join('') +
        '<div class="act" style="margin-top:22px"><a class="btn btn-red" href="' + t.aksi.h + '">' + esc(t.aksi.t) + '</a><button class="btn ' + (isDone ? 'btn-ok' : 'btn-line') + '" data-learn="' + t.id + '">' + (isDone ? '✓ Sudah dipelajari' : 'Tandai selesai') + '</button></div>' +
        (rel.length ? '<div class="label" style="margin:26px 0 8px">Materi terkait</div><div class="lgrid">' + rel.map(function (r) { return '<a class="lcard" href="#/belajar/' + r.id + '"><span class="badge b-gray">' + esc(r.kat) + '</span><b>' + esc(r.judul) + '</b><small>' + r.menit + ' menit</small></a>'; }).join('') + '</div>' : '') +
        '<p class="foot-note" style="text-align:left;margin-top:26px">Panduan umum dan angka contoh untuk latihan. Bukan nasihat keuangan, pajak, atau hukum.</p></article>';
    }
    var q = (UI.q || '').toLowerCase().trim(), kat = UI.kat || '';
    var list = T.filter(function (x) { return (!kat || x.kat === kat) && (!q || (x.judul + ' ' + x.ringkas + ' ' + x.kat).toLowerCase().indexOf(q) >= 0); });
    var pct = Math.round(done.filter(function (i) { return T.some(function (x) { return x.id === i; }); }).length / T.length * 100);
    var seg = '<div class="seg" role="tablist"><button role="tab" aria-selected="' + (id !== 'kamus') + '" data-go="#/belajar">Materi</button><button role="tab" aria-selected="' + (id === 'kamus') + '" data-go="#/belajar/kamus">Kamus istilah</button></div>';
    var body;
    if (id === 'kamus') body = '<div class="card"><div class="kamus">' + Pus.kamus.map(function (k) { return '<div><b>' + esc(k[0]) + '</b><p>' + esc(k[1]) + '</p></div>'; }).join('') + '</div></div>';
    else body = '<div class="card" style="margin-bottom:12px"><div class="row"><div><div class="label">Kemajuan belajar</div><b style="font-size:18px">' + done.filter(function (i) { return T.some(function (x) { return x.id === i; }); }).length + ' dari ' + T.length + ' materi</b></div><b>' + pct + '%</b></div><div class="track" style="margin-top:10px"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="toolbar"><input class="search" type="search" data-search placeholder="Cari materi, mis. margin atau stok" value="' + esc(UI.q || '') + '" aria-label="Cari materi"></div>' +
      '<div class="chips" style="margin-bottom:14px"><button class="chip" aria-pressed="' + !kat + '" data-kat="">Semua</button>' + Pus.kategori.map(function (k) { return '<button class="chip" aria-pressed="' + (kat === k) + '" data-kat="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      (list.length ? '<div class="lgrid">' + list.map(function (x) { var dn = done.indexOf(x.id) >= 0; return '<a class="lcard' + (dn ? ' dn' : '') + '" href="#/belajar/' + x.id + '"><span class="badge ' + (dn ? 'b-ok' : 'b-gray') + '">' + (dn ? '✓ ' : '') + esc(x.kat) + '</span><b>' + esc(x.judul) + '</b><p>' + esc(x.ringkas) + '</p><small>' + x.menit + ' menit baca</small></a>'; }).join('') + '</div>' : '<div class="card"><p class="sub">Tidak ada materi yang cocok.</p></div>');
    return head('Panduan singkat untuk pemilik usaha', 'Belajar', 'Panduan singkat untuk pemilik usaha: harga, stok, promosi, dan keuangan', 'Pustaka belajar', '') + seg + body;
  };

  /* ---------- akun ---------- */
  var deferredInstall = null;
  V.akun = function () {
    var d = D(), u = d.user, b = d.usaha, ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var tl = trialLeft(), plan = proActive() ? (tl > 0 ? 'Uji coba ' + tl + ' hari lagi' : 'Paket Pro aktif') : 'Paket gratis';
    var sw = function (k, v) { return '<button class="switch" role="switch" aria-checked="' + !!v + '" data-pref="' + k + '"></button>'; };
    var install = standalone ? '' : '<div class="card install"><div class="label" style="color:var(--red)">Pasang aplikasi</div><h3 style="font-size:17px;margin:6px 0 6px">Jadikan ikon di layar utama</h3>' + (ios ? '<ol><li>Ketuk tombol <b>Bagikan</b> di Safari</li><li>Pilih <b>Tambah ke Layar Utama</b></li><li>Ketuk <b>Tambah</b></li></ol>' : '<p class="sub" style="color:var(--ink-2)">Buka laku.ai langsung dari layar utama, tanpa toko aplikasi.</p><button class="btn btn-red btn-block" data-act="install" style="margin-top:12px">Pasang di Android</button><p class="sub" style="margin-top:8px;font-size:12px">iPhone: ketuk Bagikan, lalu Tambah ke Layar Utama.</p>') + '</div>';
    var hasSample = d.produk.some(function (p) { return p.sumber === 'contoh'; });
    return '<div class="pagehead"><div><div class="eyebrow">Pengaturan dan paket</div><h1 class="h1">Akun</h1></div></div>' +
      '<div class="acc-grid"><div class="stack">' +
      '<div class="card profile"><div class="avatar">' + avatarIn() + '</div><div><b style="font-size:17px">' + esc(b.nama) + '</b><div class="sub">' + esc(u.nama) + ' · ' + esc(u.email) + '</div></div></div>' +
      '<div class="planbox"><div class="label">Paket aktif</div><h3>' + (proActive() ? 'Klinik Pro' : 'Gratis') + '</h3><div style="color:#B0BEC5;font-size:13.5px">' + plan + '</div><ul><li>Cek kesehatan pendapatan</li><li>Analitik penjualan, produk, dan waktu ramai</li><li>Rekomendasi stok per produk</li><li>Roadmap tahap usaha</li></ul><a class="btn btn-red btn-block" href="#/paket" style="margin-top:14px">Lihat paket</a></div>' + install +
      '<form class="card" id="profileForm"><div class="label">Profil</div>' + (capLogo() ? '<div class="logo-row"><div class="logo-prev">' + (b.logo ? '<img alt="Logo usaha" src="' + esc(b.logo) + '">' : '<span>' + esc(initials(b.nama)) + '</span>') + '</div><div class="logo-t"><b>Logo usaha</b><small>PNG, JPG, atau WebP. Otomatis dipotong persegi dan dikecilkan.</small><div class="logo-b"><label class="btn btn-line btn-sm" for="logoFile">' + (b.logo ? 'Ganti logo' : 'Unggah logo') + '</label>' + (b.logo ? '<button type="button" class="btn btn-sm" data-act="logo-del" style="color:var(--red)">Hapus</button>' : '') + '</div><input id="logoFile" type="file" accept="image/png,image/jpeg,image/webp" class="sr"></div></div>' : '') + '<label class="field" style="margin-top:8px"><span>Nama pemilik</span><input name="nama" value="' + esc(u.nama) + '" required maxlength="80"></label><label class="field"><span>Nama usaha</span><input name="usaha" value="' + esc(b.nama) + '" required maxlength="80"></label><div class="two"><label class="field"><span>Jenis usaha</span><input name="jenis" value="' + esc(b.jenis) + '" maxlength="40"></label><label class="field"><span>Kota</span><input name="kota" value="' + esc(b.kota) + '" maxlength="60"></label></div><label class="field"><span>WhatsApp</span><input name="wa" maxlength="20" type="tel" value="' + esc(u.wa) + '"></label><button class="btn btn-red btn-block" type="submit">Simpan profil</button></form></div>' +
      '<div class="stack"><form class="card" id="targetForm"><div class="label">Target usaha</div><div class="two" style="margin-top:8px"><label class="field"><span>Omzet per bulan (Rp)</span><input name="omzet" type="number" inputmode="numeric" min="0" max="1000000000000" value="' + b.targetOmzet + '"></label><label class="field"><span>Margin kotor (%)</span><input name="margin" type="number" inputmode="numeric" min="1" max="90" value="' + b.targetMargin + '"></label></div><button class="btn btn-line btn-block" type="submit">Simpan target</button><a class="link" style="font-size:13px;margin-top:10px" href="#/belajar/target-margin">Dari mana angka target margin? Hitung milik Anda →</a></form>' +
      '<div class="card"><div class="label">Pengingat</div><div class="menu"><div><span><b>Ringkasan mingguan WhatsApp</b><small>Skor dan saran stok tiap Senin pagi (segera hadir)</small></span>' + sw('wa', b.prefs.wa) + '</div><div><span><b>Peringatan dini</b><small>Margin turun atau stok berisiko habis</small></span>' + sw('alert', b.prefs.alert !== false) + '</div></div></div>' +
      '<div class="card"><div class="label">Privasi dan data</div><div class="menu"><div><span><b>Saran selalu disertai alasan dan data</b><small>Tidak ada saran yang dijalankan otomatis</small></span><span class="badge b-ok">Aktif</span></div><div><span><b>Penyimpanan data</b><small>' + (Api.mode === 'sheets' ? 'Tersambung ke database Google Sheets. Data hanya dipakai untuk analisis akun ini.' : 'Mode demo: data tersimpan di perangkat ini saja.') + '</small></span><span class="badge ' + (Api.mode === 'sheets' ? 'b-ok' : 'b-gray') + '">' + (Api.mode === 'sheets' ? 'Terhubung' : 'Demo') + '</span></div>' +
      '<button data-act="export"><span><b>Unduh data saya</b><small>Produk, penjualan, dan keputusan (JSON)</small></span>' + ic('chev', 2) + '</button>' + (hasSample ? '<button data-act="del-sample"><span><b>Hapus data contoh</b><small>Menghapus produk dan penjualan contoh saja</small></span>' + ic('chev', 2) + '</button>' : '<button data-act="seed"><span><b>Isi data contoh</b><small>8 minggu penjualan untuk mencoba tampilan</small></span>' + ic('chev', 2) + '</button>') + '<button data-act="del-account" style="color:var(--red)"><span><b>Hapus akun dan semua data</b><small>Permanen. Perlu ' + (u.google ? 'konfirmasi email' : 'kata sandi') + '.</small></span>' + ic('chev', 2) + '</button></div></div>' +
      '<div class="card"><div class="label">Lainnya</div><div class="menu"><a href="#/roadmap"><span><b>Roadmap usaha</b><small>Tahap usaha dari data Anda</small></span>' + ic('chev', 2) + '</a><a href="#/bahan"><span><b>Bahan baku</b><small>Stok, satuan, dan harga beli bahan</small></span>' + ic('chev', 2) + '</a><a href="#/belajar"><span><b>Pustaka belajar</b><small>Harga, stok, promosi, dan keuangan</small></span>' + ic('chev', 2) + '</a><a href="#/catat"><span><b>Catat penjualan</b><small>Isi cepat, foto nota, impor, promosi</small></span>' + ic('chev', 2) + '</a></div></div>' +
      '<button class="btn btn-line btn-block" data-act="logout">Keluar</button></div></div>';
  };

  /* ---------- auth & onboarding ---------- */
  /* Panel samping bergambar gerobak (varian A, krem hangat). Di HP tampil sebagai spanduk di atas form. */
  function authSide() {
    return '<aside class="auth-side art va"><div class="art-top"><a class="wordmark" href="../"><span>laku</span><i>.ai</i></a><h2>Usaha kecil,<br>keputusan yang tepat.</h2><p>Catat penjualan, lihat kesehatan usaha, dan tahu kapan harus produksi.</p><ul class="chips-ul"><li>Kalkulator HPP gratis</li><li>Coba Pro 14 hari</li><li>Data milik Anda</li></ul></div>' + (window.LakuArt ? window.LakuArt.scene('a', { mode: 'panel' }) : '') + '</aside>';
  }
  var banner = function () { return window.LakuArt ? '<div class="auth-banner va">' + window.LakuArt.scene('a', { mode: 'crop' }) + '</div>' : ''; };
  var wmk = function () { return '<a class="wordmark" style="font-size:36px" href="../"><span>laku</span><i>.ai</i></a>'; };
  var modeNote = function () { return Api.mode === 'demo' ? '<p class="legalnote" style="margin-top:10px">Mode demo: akun dan data tersimpan di perangkat ini saja.</p>' : ''; };
  function signupPasswordMin() { return Api.mode === 'sheets' && St.caps && St.caps.version === 14 ? 12 : 8; }
  V.daftar = function () {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + banner() + wmk() + '<h1>Daftar gratis</h1><p class="lead">Mulai dengan kalkulator HPP. Diagnosis usaha terbuka setelah data masuk.</p>' + (GID ? '<div id="gWrap" data-k="daftar"></div>' : '') +
      '<form id="formDaftar" novalidate><div id="authErr" class="err" role="alert" hidden></div><label class="field"><span>Nama pemilik</span><input name="nama" required maxlength="80" autocomplete="name" placeholder="mis. Bu Sari"></label><label class="field"><span>Nama usaha</span><input name="usaha" required maxlength="80" placeholder="mis. Dapur Bu Sari"></label>' +
      '<label class="field"><span>Jenis usaha</span><select name="jenis"><option>Makanan berat</option><option>Frozen food</option><option>Camilan</option><option>Kafe / minuman</option><option>Jasa</option><option>Lainnya</option></select></label>' +
      '<div class="two"><label class="field"><span>Nomor WhatsApp</span><input name="wa" maxlength="20" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></label><label class="field"><span>Kota</span><input name="kota" maxlength="60" autocomplete="address-level2" placeholder="mis. Malang"></label></div>' +
      '<label class="field"><span>Email</span><input name="email" type="email" required maxlength="120" autocomplete="email" placeholder="nama@email.com"></label><label class="field"><span>Kata sandi</span><div class="pw"><input name="password" type="password" required minlength="' + signupPasswordMin() + '" maxlength="100" autocomplete="new-password" placeholder="' + signupPasswordMin() + '–100 karakter"><em data-act="showpw">Lihat</em></div><small>Gunakan huruf besar, huruf kecil, angka, dan simbol.</small></label>' +
      '<label class="agree"><input type="checkbox" name="setuju" required><span>Saya setuju data usaha saya dipakai <b>hanya untuk analisis akun saya</b> dan tidak dibagikan ke pihak lain.</span></label><button class="btn btn-red btn-block" type="submit">Daftar gratis</button></form>' +
      '<div class="auth-foot">Sudah punya akun? <a href="#/masuk">Masuk</a></div><p class="legalnote">Tanpa kartu kredit. Bisa dihapus kapan saja. <a href="../privasi/" target="_blank" rel="noopener">Kebijakan Privasi</a> · <a href="../syarat/" target="_blank" rel="noopener">Syarat</a></p>' + modeNote() + '</main></div>';
  };
  V.masuk = function () {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + banner() + wmk() + '<h1>Selamat datang kembali</h1><p class="lead">Masuk untuk melihat kesehatan usaha Anda.</p>' + (GID ? '<div id="gWrap" data-k="masuk"></div>' : '') +
      '<form id="formMasuk" novalidate><div id="authErr" class="err" role="alert" hidden></div><label class="field"><span>Email</span><input name="email" type="email" required maxlength="120" autocomplete="email" placeholder="nama@email.com"></label><label class="field"><span>Kata sandi</span><div class="pw"><input name="password" type="password" required maxlength="100" autocomplete="current-password"><em data-act="showpw">Lihat</em></div></label><button class="btn btn-red btn-block" type="submit" style="margin-top:6px">Masuk</button></form>' +
      '<div class="auth-foot">Belum punya akun? <a href="#/daftar">Daftar gratis</a></div>' + modeNote() + '</main></div>';
  };
  var chipSel = function (group, label) { var on = group === 'kanal' ? UI.onb.kanal.indexOf(label) >= 0 : UI.onb[group] === label; return '<button type="button" class="chip' + (on ? ' sel' : '') + '" data-onb="' + group + '" data-v="' + esc(label) + '">' + esc(label) + '</button>'; };
  function onbWrap(step, label, inner, nextLabel, skip) {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + banner() + wmk() + '<div class="stepper-top">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="step-label">Langkah ' + step + ' dari 3 · ' + label + '</div>' + inner + '<div id="authErr" class="err" role="alert" hidden></div><div class="sticky-cta">' + (step > 1 ? '<button class="btn btn-line" data-act="onb-back">Kembali</button>' : '') + '<button class="btn btn-red" data-act="onb-next">' + nextLabel + '</button></div>' + (skip ? '<div class="auth-foot"><button class="link" data-act="onb-skip" style="font-size:13px;color:var(--muted)">' + skip + '</button></div>' : '') + '</main></div>';
  }
  V.onboarding = function (step) {
    if (step === 1) return onbWrap(1, 'Profil usaha', '<h1>Ceritakan usaha Anda</h1><p class="lead">Informasi ini membantu menyesuaikan saran. Perkiraan omzet, lama usaha, dan kanal penjualan boleh dikosongkan.</p>' + (D().usaha.prefs.g ? '<label class="field"><span>Nama usaha</span><input data-onb-text="usaha" maxlength="80" placeholder="mis. Dapur Bu Sari" value="' + esc(UI.onb.usaha != null ? UI.onb.usaha : D().usaha.nama) + '"></label><label class="field"><span>Jenis usaha</span><select data-onb-text="jenis">' + ['Makanan berat', 'Frozen food', 'Camilan', 'Kafe / minuman', 'Jasa', 'Lainnya'].map(function (j) { return '<option' + ((UI.onb.jenis || 'Makanan berat') === j ? ' selected' : '') + '>' + j + '</option>'; }).join('') + '</select></label>' : '') + '<div class="field"><span>Jumlah outlet</span><div class="chips">' + ['1 outlet', '2-3 outlet', '4+ outlet'].map(function (x) { return chipSel('outlet', x); }).join('') + '</div></div><div class="field"><span>Omzet per bulan (perkiraan)</span><div class="chips">' + ['< Rp5 jt', 'Rp5-15 jt', 'Rp15-50 jt', '> Rp50 jt', 'Belum tahu'].map(function (x) { return chipSel('omzet', x); }).join('') + '</div></div><div class="field"><span>Lama usaha</span><div class="chips">' + ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'].map(function (x) { return chipSel('lama', x); }).join('') + '</div></div><div class="field"><span>Jual lewat (boleh lebih dari satu)</span><div class="chips">' + KANAL.map(function (k) { return chipSel('kanal', k[1]); }).join('') + '</div></div>', 'Lanjut');
    if (step === 2) { var rows = ''; for (var i = 0; i < 3; i++) rows += '<div class="prod-row onb-prod"><input name="n' + i + '" placeholder="Nama produk" maxlength="60"><input name="h' + i + '" type="number" inputmode="numeric" min="0" max="1000000000" placeholder="Harga jual"></div>'; return onbWrap(2, 'Produk utama', '<h1>Produk andalan Anda</h1><p class="lead">Produk dan harga jual boleh diisi nanti. HPP dihitung dari item bahan di Kalkulator HPP.</p><form id="formOnb2"><div class="prod-head onb-prod"><span>PRODUK</span><span>HARGA JUAL</span></div><div id="onbRows">' + rows + '</div><button type="button" class="link" data-act="onb-addrow" style="margin:6px 0 4px">+ Tambah produk</button></form><div class="hint">Anda bisa mengubah semuanya nanti di Kalkulator HPP.</div>', 'Lanjut', 'Lewati, isi nanti'); }
    var o = function (ic2, t, s, k) { return '<button type="button" class="opt-card' + (UI.onb.data === k ? ' sel' : '') + '" data-onb="data" data-v="' + k + '"><span class="ic2">' + ic(ic2) + '</span><b>' + t + '</b><small>' + s + '</small></button>'; };
    return onbWrap(3, 'Data penjualan', '<h1>Masukkan data penjualan</h1><p class="lead">Pilih cara paling ringan. Cukup 8 minggu data untuk diagnosis pertama.</p><div class="opt-grid">' + o('pen', 'Isi cepat', 'Ketik jumlah terjual per produk, 1 menit per hari.', 'cepat') + o('camera', 'Foto nota', 'Foto nota, lalu ketik isinya.', 'foto') + o('upload', 'Impor CSV', 'Unggah rekap penjualan yang sudah ada.', 'impor') + o('spark', 'Data contoh', '8 minggu data contoh untuk mencoba semua fitur.', 'contoh') + '</div><div class="hint" style="margin-top:12px">Data Anda hanya dipakai untuk analisis akun ini. Data contoh bisa dihapus kapan saja.</div>', 'Selesai, masuk ke beranda', 'Mulai kosong dulu');
  };

  /* ================= render & routing ================= */
  var ROUTES = { '/': 'beranda', '/diagnosis': 'diagnosis', '/analitik': 'analitik', '/stok': 'stok', '/hpp': 'hpp', '/catat': 'catat', '/roadmap': 'roadmap', '/akun': 'akun', '/paket': 'paket', '/bahan': 'bahan' };
  var PRO_ROUTES = ['/diagnosis', '/analitik', '/stok', '/roadmap'];
  var NAV = [
    { id: 'beranda', path: '/', label: 'Beranda', icon: 'home', tab: 1 }, { id: 'analitik', path: '/analitik', label: 'Analitik', icon: 'chart', tab: 1 },
    { id: 'stok', path: '/stok', label: 'Rekomendasi stok', short: 'Stok', icon: 'box', tab: 1 }, { id: 'hpp', path: '/hpp', label: 'Kalkulator HPP', short: 'HPP', icon: 'hpp', tab: 1 }, { id: 'bahan', path: '/bahan', label: 'Bahan baku', icon: 'jar' },
    { id: 'catat', path: '/catat', label: 'Catat penjualan', icon: 'plus' }, { id: 'roadmap', path: '/roadmap', label: 'Roadmap usaha', icon: 'flag' }, { id: 'belajar', path: '/belajar', label: 'Belajar', icon: 'book' }, { id: 'akun', path: '/akun', label: 'Akun', icon: 'user', tab: 1, tabOnly: 1 }
  ];
  var TITLES = { beranda: 'Beranda', diagnosis: 'Diagnosis', analitik: 'Analitik', stok: 'Rekomendasi stok', hpp: 'Kalkulator HPP', catat: 'Catat penjualan', roadmap: 'Roadmap usaha', akun: 'Akun', paket: 'Paket', bahan: 'Bahan baku', belajar: 'Belajar', daftar: 'Daftar gratis', masuk: 'Masuk', onboarding: 'Mulai' };
  var path = function () { return (location.hash.replace(/^#/, '') || '/').split('?')[0]; };
  function redirect(p) { if (location.hash === '#' + p) render(); else location.replace('#' + p); }
  function route() {
    var p = path(), d = D();
    if (!St.token || !d) { if (p !== '/daftar' && p !== '/masuk') return redirect('/masuk'); }
    else {
      var ob = d.usaha.onboarding;
      if (ob !== 'selesai') { if (p.indexOf('/onboarding/') !== 0) return redirect('/onboarding/' + ({ profil: 1, produk: 2, data: 3 }[ob] || 1)); }
      else if (p === '/masuk' || p === '/daftar' || p.indexOf('/onboarding') === 0) return redirect('/');
    }
    render();
    refreshQuota();
  }
  function refreshQuota() {
    var d = D();
    if (d && path() === '/hpp' && d.kuotaRiset && d.kuotaRiset.resetPada) {
      var previous = d.kuotaRiset;
      Api.call({ action: 'risetKuota', token: St.token }).then(function (quota) {
        if (D() !== d || d.kuotaRiset !== previous) return;
        d.kuotaRiset = quota;
        if (path() !== '/hpp' || JSON.stringify(quota) === JSON.stringify(previous) || !UI.rs || UI.rs.busy) return;
        var city = $('#rsKota'), paste = $('#rsPaste'), box = $('#risetBox');
        if (city) UI.rs.kota = city.value;
        if (paste) UI.rs.paste = paste.value;
        if (box) box.innerHTML = risetCard(hppCalc());
      }, function () {});
    }
  }
  function renderChrome(act) {
    var d = D(); if (!d) return;
    $('#sideNav').innerHTML = NAV.filter(function (n) { return !n.tabOnly && (proActive() || PRO_ROUTES.indexOf(n.path) < 0); }).map(function (n) { return '<a href="#' + n.path + '"' + (n.id === act ? ' aria-current="page"' : '') + '>' + ic(n.icon) + n.label + '</a>'; }).join('');
    $('#tabbar').innerHTML = NAV.filter(function (n) { return n.tab && (proActive() || PRO_ROUTES.indexOf(n.path) < 0); }).map(function (n) { return '<a class="tab" href="#' + n.path + '"' + (n.id === act ? ' aria-current="page"' : '') + '>' + ic(n.icon, n.id === act ? 2.2 : 1.8) + '<span>' + (n.short || n.label) + '</span></a>'; }).join('');
    $('.m-top .avatar').innerHTML = avatarIn();
    var tl = trialLeft(), pc = $('#proCard'); pc.innerHTML = proActive() ? '<b>KLINIK PRO</b><span>' + (tl > 0 ? 'Uji coba · sisa ' + tl + ' hari' : 'Paket aktif') + '</span>' : '<b>PAKET GRATIS</b><span>Rp0</span>';
  }
  function render(keepScroll) {
    var p = path(), v = $('#view'), y = window.scrollY, key, html, authMode = false;
    if (p === '/masuk' || p === '/daftar') { key = p.slice(1); html = V[key](); authMode = true; }
    else if (p.indexOf('/onboarding/') === 0) { key = 'onboarding'; html = V.onboarding(+p.split('/')[2] || 1); authMode = true; }
    else if (p.indexOf('/belajar') === 0) { key = 'belajar'; html = V.belajar(p.split('/')[2] || ''); }
    else { key = ROUTES[p] || 'beranda'; html = PRO_ROUTES.indexOf(p) >= 0 && !proActive() ? head(TITLES[key], 'Klinik Pro', TITLES[key], 'Klinik Pro', '') + '<div class="card"><p>Modul ini tersedia di Klinik Pro.</p>' + linkPro() + '</div>' : V[key](); }
    document.body.classList.toggle('noshell', authMode);
    v.innerHTML = html; v.classList.remove('view-in'); void v.offsetWidth; if (!keepScroll) v.classList.add('view-in');
    $$('[data-calc]', v).forEach(updateCalc);
    if (!authMode) renderChrome(key === 'diagnosis' ? 'beranda' : key); else if (key === 'daftar' || key === 'masuk') initGoogle();
    document.title = (TITLES[key] || 'laku.ai') + ' · laku.ai';
    window.scrollTo(0, keepScroll ? y : 0);
    if (key === 'roadmap' && !keepScroll) { var cur = $('.stage.now'); if (cur) setTimeout(function () { var r = cur.getBoundingClientRect(); window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 90), behavior: 'smooth' }); }, 250); }
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('focus', refreshQuota);

  /* ================= aksi ================= */
  function showErr(msg) { var e = $('#authErr'); if (e) { e.textContent = msg; e.hidden = false; } else toast(msg); }
  function fieldError(form, name, message) {
    var input = form.elements.namedItem(name);
    if (!input || !input.closest) return false;
    var label = input.closest('label');
    if (!label) return false;
    var error = $('.auth-field-error', label);
    if (!error) {
      error = document.createElement('span');
      error.className = 'auth-field-error';
      error.id = form.id + '-' + name + '-error';
      error.setAttribute('role', 'alert');
      (input.type === 'checkbox' ? label.lastElementChild : label).appendChild(error);
    }
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', error.id);
    return true;
  }
  function clearFieldError(input) {
    var errorId = input.getAttribute('aria-describedby');
    if (!errorId || !/^(formDaftar|formMasuk)-/.test(errorId)) return;
    var error = document.getElementById(errorId);
    if (error) error.remove();
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }
  function authResponseError(form, error) {
    var name = error.field || ({ exists: 'email', google: 'email', login: 'password', email_domain: 'email', email_check: 'email' })[error.code];
    if (!name || !fieldError(form, name, error.message)) showErr(error.message);
    else form.elements.namedItem(name).focus();
  }
  document.addEventListener('input', function (event) {
    var input = event.target;
    if (input.form && /^(formDaftar|formMasuk)$/.test(input.form.id)) clearFieldError(input);
  });
  function busy(btn, on, txt) { if (!btn) return; if (on) { btn.dataset.t = btn.textContent; btn.textContent = txt || 'Memproses…'; btn.disabled = true; } else { btn.textContent = btn.dataset.t || btn.textContent; btn.disabled = false; } }

  function afterAuth(res) { fetchCaps(); St.token = res.token; setToken(res.token); St.data = res.data; UI.hpp = null; UI.onb = { outlet: '1 outlet', omzet: '', lama: '', kanal: [] }; route(); }   // route() mengarahkan lewat redirect (satu render)
  document.addEventListener('submit', function (e) {
    var f = e.target, id = f.id; if (!id) return; e.preventDefault();
    var fd = function (n) { return f.elements[n] ? f.elements[n].value : ''; }, btn = $('button[type=submit]', f);
    if (id !== 'formDaftar' && id !== 'formMasuk' && !f.reportValidity()) return;
    try {
      if (id === 'profileForm') {
        LC.validation.text(fd('nama'), 'Nama pemilik', 80, true); LC.validation.phone(fd('wa'));
        LC.validation.text(fd('usaha'), 'Nama usaha', 80, true);
        LC.validation.text(fd('jenis'), 'Jenis usaha', 40, false); LC.validation.text(fd('kota'), 'Kota', 60, false);
      } else if (id === 'addProd') {
        LC.validation.text(fd('nama'), 'Nama produk', 60, true); LC.validation.text(fd('satuan'), 'Satuan', 12, false);
        LC.validation.number(fd('harga'), 0, 1e9, 0);
      } else if (id === 'bbForm' || id === 'promoForm') {
        LC.validation.text(fd('nama'), id === 'bbForm' ? 'Nama bahan' : 'Nama promosi', id === 'bbForm' ? 60 : 80, true);
      }
    } catch (err) { return toast(err.message); }
    if (id === 'formDaftar' || id === 'formMasuk') {
      if (btn.disabled) return;
      var registering = id === 'formDaftar', invalid = [];
      Array.prototype.forEach.call(f.elements, clearFieldError);
      $('#authErr', f).hidden = true;
      var checks = {
        email: LC.validation.email,
        password: function (value) {
          if (registering) {
            LC.validation.password(value);
            if (value.length < signupPasswordMin()) throw new Error('Kata sandi harus minimal ' + signupPasswordMin() + ' karakter.');
          } else if (!value || value.length > 100) throw new Error('Isi kata sandi yang valid.');
        }
      };
      if (registering) {
        checks = Object.assign({
          nama: function (value) { LC.validation.text(value, 'Nama pemilik', 80, true); },
          usaha: function (value) { LC.validation.text(value, 'Nama usaha', 80, true); },
          wa: LC.validation.phone,
          kota: function (value) { LC.validation.text(value, 'Kota', 60, false); }
        }, checks, {
          setuju: function () { if (!f.elements.setuju.checked) throw new Error('Centang persetujuan untuk melanjutkan.'); }
        });
      }
      Object.keys(checks).forEach(function (name) {
        try { checks[name](fd(name)); }
        catch (err) { fieldError(f, name, err.message); invalid.push(name); }
      });
      if (invalid.length) return f.elements.namedItem(invalid[0]).focus();
      var request = { action: registering ? 'register' : 'login', email: fd('email'), password: fd('password') };
      if (registering) ['nama', 'usaha', 'jenis', 'wa', 'kota'].forEach(function (name) { request[name] = fd(name); });
      busy(btn, true, registering ? 'Memeriksa email…' : 'Masuk…');
      Api.call(request).then(afterAuth, function (error) { busy(btn, false); authResponseError(f, error); });
    } else if (id === 'saleForm') {
      var q, h, tg = fd('tanggal');
      try { q = LC.validation.number(fd('qty'), 0.000001, 1e6); h = LC.validation.number(fd('harga'), 0, 1e9); }
      catch (err) { return toast(err.message); } if (!(q > 0) || !(h >= 0) || !tg) return toast('Isi jumlah dan harga dengan benar.');
      var row = { id: uid('t'), tanggal: tg, jam: fd('jam') || '12:00', produkId: fd('produk'), qty: q, harga: h, kanal: fd('kanal'), sumber: 'manual' };
      D().penjualan.push(row); persist([{ op: 'penjualan.add', rows: [row] }]).then(function () { toast('Catatan disimpan: ' + rp(q * h)); }, function () { D().penjualan.pop(); render(true); }); render(true);
    } else if (id === 'notaForm') {
      var rows = [], tg2 = fd('tanggal'); for (var i = 0; i < UI.notaRows; i++) { var q2 = +fd('nq' + i); if (q2 > 0) { var pr = prodById(fd('np' + i)), hh = fd('nh' + i) === '' ? pr.harga : +fd('nh' + i); rows.push({ id: uid('t'), tanggal: tg2, jam: nowTime(), produkId: pr.id, qty: q2, harga: hh, kanal: 'toko', sumber: 'nota' }); } }
      if (!rows.length) return toast('Isi minimal satu baris dengan jumlah.');
      persist([{ op: 'penjualan.add', rows: rows }]).then(function () { D().penjualan = D().penjualan.concat(rows); UI.cat = 'cepat'; UI.notaImg = null; render(true); toast(rows.length + ' catatan dari nota disimpan'); });
    } else if (id === 'promoForm') {
      var row2 = { id: uid('r'), nama: fd('nama'), produkId: fd('produk'), mulai: fd('mulai'), selesai: fd('selesai'), sumber: 'manual' }; if (row2.selesai < row2.mulai) return toast('Tanggal selesai harus setelah mulai.');
      persist([{ op: 'promosi.add', rows: [row2] }]).then(function () { D().promosi.push(row2); render(true); toast('Promosi disimpan'); });
    } else if (id === 'addProd') {
      var np = { id: uid('p'), nama: fd('nama').trim(), satuan: (fd('satuan') || 'pcs').trim(), harga: +fd('harga') || 0, hpp: 0, stok: 0, produksiLalu: 0, sumber: 'manual', bahan: [] };
      if (!np.nama) return; D().produk.push(np); persist([prodOp(np, false)]).then(function () { toast('Produk ditambahkan'); }, function () { D().produk.pop(); render(true); }); UI.addProd = false; hppInit(np.id); render(true);
    } else if (id === 'bbForm') {
      var bf = bbRead(f), nm = fd('nama').trim(); if (!nm) return toast('Isi nama bahan.'); if (!bf.sat) return toast('Isi satuan.');
      var isi = +bf.isi, hg = +bf.harga; if (hg > 0 && !(isi > 0)) return toast('Isi jumlah yang dibeli dengan harga tersebut.');
      var exb = f.dataset.id ? bbOne(f.dataset.id) : null, nb = { id: exb ? exb.id : uid('bb'), nama: nm, satuan: exb && f.elements.sat.disabled ? exb.satuan : bf.sat, stok: Math.max(0, +fd('stok') || 0), hargaBeli: Math.max(0, hg || 0), isiBeli: isi > 0 ? toBase(isi, bf.isiU, exb && f.elements.sat.disabled ? exb.satuan : bf.sat) : 1, minStok: Math.max(0, +fd('min') || 0), sumber: exb ? exb.sumber : 'manual' };
      var before = exb ? uPriceOf(exb) : null, L = D().bahanBaku || (D().bahanBaku = []);
      if (exb) L[L.indexOf(exb)] = nb; else L.push(nb);
      if (before == null || Math.abs(before - uPriceOf(nb)) > 1e-9) bbLog(nb); recalcLocalHpp(); UI.bb = { form: null, beli: null }; UI.hpp = null;
      persist([{ op: 'bahanbaku.upsert', bahan: nb }]).then(function () { toast('Bahan baku disimpan'); }, function () { bbRefresh(); }); render(true);
    } else if (id === 'bbBeli') {
      var bb0 = bbOne(f.dataset.id), jm = toBase(+fd('jml'), fd('u'), bb0.satuan), tt = +fd('total'); if (!(jm > 0) || !(tt >= 0)) return toast('Isi jumlah dan total harga dengan benar.');
      bb0.stok += jm; bb0.hargaBeli = tt; bb0.isiBeli = jm; bbLog(bb0); recalcLocalHpp(); UI.bb = { form: null, beli: null }; UI.hpp = null;
      persist([{ op: 'bahanbaku.beli', id: bb0.id, jumlah: jm, hargaTotal: tt }]).then(function () { toast('Pembelian dicatat: stok ' + bb0.nama + ' jadi ' + fmtQ(bb0.stok, bb0.satuan)); }, function () { bbRefresh(); }); render(true);
    } else if (id === 'prodForm') {
      var pid = fd('produk'), qn = +fd('qty'); if (!(qn > 0)) return toast('Isi jumlah produksi.'); var pn = prodById(pid);
      busy(btn, true, 'Mencatat…');
      persist([{ op: 'produksi.catat', produkId: pid, qty: qn }]).then(reload).then(function () { UI.prod = null; UI.hpp = null; render(true); toast('Produksi dicatat: ' + fmtN(qn) + ' ' + pn.satuan + ' ' + pn.nama + '. Stok bahan baku berkurang.', 4000); }, function () { busy(btn, false); reload().then(function () { render(true); }); });
    } else if (id === 'profileForm') {
      var d = D(); busy(btn, true, 'Menyimpan…');
      persist([{ op: 'profil.update', fields: { nama: fd('nama'), wa: fd('wa') } }, { op: 'usaha.update', fields: { nama: fd('usaha'), jenis: fd('jenis'), kota: fd('kota') } }]).then(function () { d.user.nama = fd('nama').trim(); d.user.wa = fd('wa').trim(); d.usaha.nama = fd('usaha').trim(); d.usaha.jenis = fd('jenis').trim(); d.usaha.kota = fd('kota').trim(); toast('Profil disimpan'); render(true); }, function () { busy(btn, false); });
    } else if (id === 'targetForm') {
      var om = +fd('omzet'), mg = +fd('margin'); if (!(om >= 0) || !(mg >= 1 && mg <= 90)) return toast('Periksa angka target.');
      persist([{ op: 'usaha.update', fields: { targetOmzet: om, targetMargin: mg } }]).then(function () { D().usaha.targetOmzet = om; D().usaha.targetMargin = mg; toast('Target disimpan'); render(true); });
    }
  });

  function stockOp(p, extra) { return prodOp(Object.assign({}, p, extra), false); }
  function seedSample(btn) {
    if (UI.busy) return; UI.busy = true; busy(btn, true, 'Menyiapkan data contoh…'); toast('Menyiapkan data contoh, mohon tunggu…', 6000);
    var s = Seed.make(today()), chunks = [], rows = s.penjualan, adv = capResep();
    for (var i = 0; i < rows.length; i += 350) chunks.push(rows.slice(i, i + 350));
    var prodList = s.produk;
    if (!adv) prodList = s.produk.map(function (p) { var flat = p.bahan.reduce(function (a, b) { return a + b.harga; }, 0); return Object.assign({}, p, { bahan: [{ id: uid('m'), nama: 'Bahan baku (rekap)', harga: Math.max(0, p.hpp - flat) }].concat(p.bahan) }); });
    var first = (adv ? s.bahanBaku.map(function (b) { return { op: 'bahanbaku.upsert', bahan: b }; }) : []).concat(prodList.map(function (p) { return prodOp(p, true); }));
    var second = (adv ? s.produk.map(function (p) { return { op: 'resep.set', produkId: p.id, hasil: 1, items: p.resep }; }) : []).concat([{ op: 'hargabahan.add', rows: s.hargaBahan }]);
    if (proActive()) second.push({ op: 'promosi.add', rows: s.promosi });
    var chain = persist(first).then(function () { return persist(second); }); chunks.forEach(function (c) { chain = chain.then(function () { return persist([{ op: 'penjualan.add', rows: c }]); }); });
    chain.then(reload).then(function () { UI.busy = false; UI.hpp = null; toast('Data contoh siap: ' + rows.length + ' catatan penjualan'); if (path().indexOf('/onboarding/') === 0) finishOnboarding('/'); else render(); }, function () { UI.busy = false; busy(btn, false); });
  }
  function finishOnboarding(dest) { persist([{ op: 'usaha.update', fields: { onboarding: 'selesai' } }]).then(function () { D().usaha.onboarding = 'selesai'; navigate(dest); }); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act],[data-ct],[data-seg],[data-period],[data-pick],[data-hpp-pid],[data-rm],[data-rrm],[data-rkual],[data-deltx],[data-delpromo],[data-chk],[data-pref],[data-onb],[data-step],[data-go],[data-kat],[data-learn]');
    if (!t) return; var ds = t.dataset, act = ds.act, d = D();
    if (ds.onb) { var g = ds.onb, v = ds.v; if (g === 'kanal') { var i = UI.onb.kanal.indexOf(v); if (i >= 0) UI.onb.kanal.splice(i, 1); else UI.onb.kanal.push(v); } else UI.onb[g] = (UI.onb[g] === v && g !== 'data') ? '' : v; return render(true); }
    if (ds.go) { return navigate(ds.go.replace(/^#/, '')); }
    if (ds.kat !== undefined && t.hasAttribute('data-kat')) { UI.kat = ds.kat; return render(true); }
    if (ds.learn) { var L = learned().slice(), ix = L.indexOf(ds.learn); if (ix >= 0) L.splice(ix, 1); else L.push(ds.learn); d.usaha.prefs.belajar = L; persist([{ op: 'usaha.update', fields: { prefs: d.usaha.prefs } }]); render(true); return toast(ix >= 0 ? 'Penanda dihapus' : 'Materi ditandai selesai'); }
    if (ds.ct) { UI.cat = ds.ct; return render(true); }
    if (ds.seg) { UI.seg = ds.seg; return render(true); }
    if (ds.period) { UI.period = +ds.period; return render(true); }
    if (ds.hppPid) { hppInit(ds.hppPid); return render(true); }
    if (ds.pick !== undefined) { UI.hpp.pick = +ds.pick; $('#hppRight').innerHTML = hppRight(); return; }
    if (ds.rkual) { (UI.rs || (UI.rs = { kual: 'medium', kota: '', busy: false })).kual = ds.rkual; var ki2 = $('#rsKota'); if (ki2) UI.rs.kota = ki2.value; return render(true); }
    if (ds.rrm !== undefined) { var hr = UI.hpp, pr0 = prodById(hr.pid); hr.res.splice(+ds.rrm, 1); saveBahan(pr0); return render(true); }
    if (ds.rm !== undefined) { var h = UI.hpp, p = prodById(h.pid); h.items.splice(+ds.rm, 1); saveBahan(p); return render(true); }
    if (ds.deltx) { var tx = d.penjualan.filter(function (x) { return x.id === ds.deltx; })[0]; d.penjualan = d.penjualan.filter(function (x) { return x.id !== ds.deltx; }); persist([{ op: 'penjualan.delete', ids: [ds.deltx] }]).catch(function () { d.penjualan.push(tx); render(true); }); return render(true); }
    if (ds.delpromo) { d.promosi = d.promosi.filter(function (x) { return x.id !== ds.delpromo; }); persist([{ op: 'promosi.delete', id: ds.delpromo }]); return render(true); }
    if (ds.chk) { d.usaha.prefs[ds.chk] = !d.usaha.prefs[ds.chk]; persist([{ op: 'usaha.update', fields: { prefs: d.usaha.prefs } }]); return render(true); }
    if (ds.pref) { var cur = ds.pref === 'alert' ? d.usaha.prefs.alert !== false : !!d.usaha.prefs[ds.pref]; d.usaha.prefs[ds.pref] = !cur; persist([{ op: 'usaha.update', fields: { prefs: d.usaha.prefs } }]); return render(true); }
    if (ds.step) { UI.edit.q = Math.max(0, (+UI.edit.q || 0) + (+ds.step)); return render(true); }
    switch (act) {
      case 'follow': { var pp = A.compute(d, { today: today() }).prods.filter(function (x) { return x.id === ds.id; })[0], rv = recOf(pp), row = { id: uid('k'), tipe: 'stok', produkId: pp.id, saran: pp.saran, tindakan: rv === pp.saran ? 'ikuti' : 'ubah', nilaiAkhir: rv, waktu: new Date().toISOString() }; d.keputusan.push(row); persist([{ op: 'keputusan.add', row: row }]); render(true); return toast('Saran ' + pp.nama + ' diikuti: ' + rv + ' ' + pp.satuan); }
      case 'edit': { var p3 = A.compute(d, { today: today() }).prods.filter(function (x) { return x.id === ds.id; })[0]; UI.edit = { id: ds.id, q: recOf(p3) }; return render(true); }
      case 'undo': { UI.edit = null; d.keputusan = d.keputusan.filter(function (k) { return !(k.produkId === ds.id && k.tipe === 'stok' && k.waktu.slice(0, 10) >= A.mondayOf(today())); }); return render(true); }
      case 'save-edit': { var pe = A.compute(d, { today: today() }).prods.filter(function (x) { return x.id === ds.id; })[0], q = Math.max(0, +UI.edit.q || 0), r2 = { id: uid('k'), tipe: 'stok', produkId: ds.id, saran: pe.saran, tindakan: 'ubah', nilaiAkhir: q, waktu: new Date().toISOString() }; d.keputusan.push(r2); UI.edit = null; persist([{ op: 'keputusan.add', row: r2 }]); render(true); return toast('Jumlah produksi disimpan'); }
      case 'riset': {
        var rs = UI.rs || (UI.rs = { kual: 'medium', kota: '', busy: false }), ki = $('#rsKota'), kt = ki ? ki.value.trim() : rs.kota; if (!kt) return toast('Isi kota atau wilayah usaha Anda.');
        if (rs.busy) return;
        try { kt = LC.validation.text(kt, 'Kota', 60, true); } catch (err) { return toast(err.message); }
        rs.kota = kt; rs.busy = true; rs.startedAt = performance.now();
        rs.cacheOnly = !!(d.kuotaRiset && (!d.kuotaRiset.sisa || d.kuotaRiset.sisaBulanan === 0));
        var pidr = UI.hpp.pid, kual = rs.kual;
        render(true);
        var clock = setInterval(function () {
          var elapsed = $('#rsElapsed');
          if (elapsed && UI.rs === rs) elapsed.textContent = risetElapsed(rs.startedAt);
        }, 250);
        Api.call({ action: 'riset', token: St.token, produkId: pidr, kota: kt, kualitas: kual, cacheOnly: rs.cacheOnly, refresh: !!risetOf(pidr, kt, kual) && (!d.kuotaRiset || (d.kuotaRiset.sisa > 0 && d.kuotaRiset.sisaBulanan !== 0)) }).then(function (r) {
          clearInterval(clock); rs.startedAt = null; rs.busy = false; if (r.kuotaRiset) d.kuotaRiset = r.kuotaRiset; d.riset = (d.riset || []).filter(function (x) { return !(x.produkId === r.produkId && x.kualitas === r.kualitas && x.kota.toLowerCase() === r.kota.toLowerCase()); }).concat([{ produkId: r.produkId, kota: r.kota, kualitas: r.kualitas, dibuat: r.dibuat, hasil: r.hasil }]);
          if (path() === '/hpp') render(true); toast(r.cached ? 'Memakai hasil riset terakhir (kurang dari 7 hari)' : 'Riset selesai.');
        }, function (er) { clearInterval(clock); rs.startedAt = null; rs.busy = false; if (er.kuotaRiset) d.kuotaRiset = er.kuotaRiset; if (er.code === 'auth') return forceLogout('Sesi berakhir. Silakan masuk lagi.'); if (path() === '/hpp') render(true); toast(er.message, 5000); });
        return;
      }
      case 'rs-copy': { var ta = $('#rsPrompt'); if (!ta) return; ta.select(); var okc = false; try { if (navigator.clipboard) { navigator.clipboard.writeText(ta.value); okc = true; } else okc = document.execCommand('copy'); } catch (er) { } return toast(okc ? 'Prompt disalin. Tempel di ChatGPT, Gemini, atau Claude.' : 'Prompt terpilih. Salin dengan Ctrl/Cmd+C.', 3500); }
      case 'rs-manual': {
        var rsm = UI.rs || (UI.rs = { kual: 'medium', kota: '', busy: false }), ti = $('#rsPaste'), txt = ti ? ti.value.trim() : '', ki3 = $('#rsKota'), kt3 = ki3 ? ki3.value.trim() : rsm.kota; if (!txt) return toast('Tempel dulu jawaban JSON dari AI.'); if (!kt3) return toast('Isi kota atau wilayah usaha Anda.');
        if (rsm.busy) return;
        try { kt3 = LC.validation.text(kt3, 'Kota', 60, true); } catch (err) { return toast(err.message); }
        if (txt.length > 20000) return toast('Jawaban JSON maksimal 20.000 karakter.');
        rsm.kota = kt3; rsm.paste = txt; rsm.busy = true; var pidm = UI.hpp.pid; render(true);
        Api.call({ action: 'risetManual', token: St.token, produkId: pidm, kota: kt3, kualitas: rsm.kual, json: txt }).then(function (r) {
          rsm.busy = false; rsm.paste = ''; d.riset = (d.riset || []).filter(function (x) { return !(x.produkId === r.produkId && x.kualitas === r.kualitas && x.kota.toLowerCase() === r.kota.toLowerCase()); }).concat([{ produkId: r.produkId, kota: r.kota, kualitas: r.kualitas, dibuat: r.dibuat, hasil: r.hasil }]); if (path() === '/hpp') render(true); toast('Jawaban dianalisis');
        }, function (er) { rsm.busy = false; if (er.code === 'auth') return forceLogout('Sesi berakhir. Silakan masuk lagi.'); if (path() === '/hpp') render(true); toast(er.message, 5000); });
        return;
      }
      case 'apply-rec': { var vr = Math.round(+ds.v || 0), prr = prodById(UI.hpp.pid); if (!(vr > 0)) return; prr.harga = vr; syncBahan(prr); persist([prodOp(prr, UI.hpp.items.length > 0)]); UI.hpp.pick = 0; render(true); return toast('Harga ' + prr.nama + ' diubah menjadi ' + rp(vr)); }
      case 'follow-cap': { var Mc = A.compute(d, { today: today() }), n = 0; Mc.prods.forEach(function (x) { if (x.resep && !x.cukup && !decisions()[x.id]) { var kr = { id: uid('k'), tipe: 'stok', produkId: x.id, saran: x.saran, tindakan: 'ubah', nilaiAkhir: x.bisa, waktu: new Date().toISOString() }; d.keputusan.push(kr); persist([{ op: 'keputusan.add', row: kr }]); n++; } }); render(true); return toast(n + ' produk disesuaikan dengan stok bahan baku'); }
      case 'go-prod': UI.prod = { id: ds.id, q: null }; return navigate('/stok');
      case 'add-rbahan': UI.hpp.res.push({ bahanId: '', q: 0, u: 'gram' }); return render(true);
      case 'bb-new': UI.bb = { form: { sat: 'gram' }, beli: null }; return render(true);
      case 'bb-cancel': UI.bb = { form: null, beli: null }; return render(true);
      case 'bb-edit': { var be = bbOne(ds.id); UI.bb = { form: { id: be.id, nama: be.nama, sat: be.satuan, stok: be.stok, isi: be.isiBeli, isiU: be.satuan, harga: be.hargaBeli, min: be.minStok }, beli: null }; render(true); var fe = $('#bbForm'); if (fe) fe.scrollIntoView({ block: 'center' }); return; }
      case 'bb-beli': UI.bb = { form: null, beli: ds.id }; render(true); var fb = $('#bbBeli'); if (fb) { fb.scrollIntoView({ block: 'center' }); fb.elements.jml.focus(); } return;
      case 'bb-del': { var bd = bbOne(ds.id), usedIn = d.produk.filter(function (x) { return (x.resep || []).some(function (r) { return r.bahanId === bd.id; }); }); if (!confirm('Hapus bahan "' + bd.nama + '"?' + (usedIn.length ? '\nBahan ini akan dihapus dari resep: ' + usedIn.map(function (x) { return x.nama; }).join(', ') + '.' : ''))) return; d.bahanBaku = d.bahanBaku.filter(function (x) { return x.id !== bd.id; }); d.produk.forEach(function (x) { if (x.resep) x.resep = x.resep.filter(function (r) { return r.bahanId !== bd.id; }); }); recalcLocalHpp(); UI.hpp = null; persist([{ op: 'bahanbaku.delete', id: bd.id }]).then(function () { toast('Bahan dihapus'); }, function () { bbRefresh(); }); return render(true); }
      case 'add-prod': UI.addProd = true; return render(true);
      case 'cancel-prod': UI.addProd = false; return render(true);
      case 'add-ing': { var hh = UI.hpp; hh.items.push({ id: 'm_' + uid('x').slice(2), nama: '', harga: 0 }); render(true); var ni = $('[data-nm="' + (hh.items.length - 1) + '"]'); if (ni) ni.focus(); return; }
      case 'save-price': { var c = hppCalc(), pr = c.p, oldB = pr.bahan.slice(); pr.harga = c.np; pr.hpp = c.total; syncBahan(pr); logBahan(pr, oldB); UI.hpp.pick = 0; persist([prodOp(pr, UI.hpp.items.length > 0)]); render(true); return toast('Harga baru ' + rp(c.np) + ' disimpan · margin ' + c.mg(c.np) + '%'); }
      case 'del-prod': { var pd = prodById(UI.hpp.pid); if (!confirm('Hapus produk "' + pd.nama + '"? Catatan penjualannya tetap tersimpan.')) return; d.produk = d.produk.filter(function (x) { return x.id !== pd.id; }); persist([{ op: 'produk.delete', id: pd.id }]); UI.hpp = null; return render(true); }
      case 'apply-target': { var box = t.closest('[data-calc]'), v = Math.round(+box.dataset.val || 0); if (!(v >= 1 && v <= 90)) return toast('Angka target belum masuk akal. Periksa isian Anda.', 4000); persist([{ op: 'usaha.update', fields: { targetMargin: v } }]).then(function () { d.usaha.targetMargin = v; toast('Target margin diubah menjadi ' + v + '%. Beranda dan skor memakai angka ini.', 4500); }); return; }
      case 'logo-del': { persist([{ op: 'usaha.update', fields: { logo: '' } }]).then(function () { d.usaha.logo = ''; render(true); toast('Logo dihapus'); }); return; }
      case 'nota-row': UI.notaRows = Math.min(15, UI.notaRows + 1); return render(true);
      case 'seed': return seedSample(t);
      case 'print': return window.print();
      case 'showpw': { var inp = t.parentNode.querySelector('input'); inp.type = inp.type === 'password' ? 'text' : 'password'; t.textContent = inp.type === 'password' ? 'Lihat' : 'Sembunyi'; return; }
      case 'logout': Api.call({ action: 'logout', token: St.token }).catch(function () { }); return forceLogout();
      case 'export': { try { var b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'data-laku-ai.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); } catch (er) { toast('Tidak bisa mengunduh di perangkat ini'); } return; }
      case 'del-sample': { if (!confirm('Hapus semua data contoh? Produk dan penjualan yang Anda input sendiri tidak ikut terhapus.')) return; persist([{ op: 'contoh.hapus' }]).then(reload).then(function () { UI.hpp = null; toast('Data contoh dihapus'); render(true); }); return; }
      case 'del-account': { var pw = prompt('Hapus akun dan SEMUA data secara permanen.\n' + (d.user.google ? 'Ketik email Anda (' + d.user.email + ') untuk konfirmasi:' : 'Ketik kata sandi Anda untuk melanjutkan:')); if (!pw) return; Api.call({ action: 'hapusAkun', token: St.token, password: pw }).then(function () { forceLogout('Akun dan data telah dihapus.'); }, function (er) { toast(er.message); }); return; }
      case 'install': if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } else toast('Buka menu browser, lalu pilih "Instal aplikasi" atau "Tambahkan ke layar utama".', 4500); return;
      case 'onb-back': { var cs = +path().split('/')[2]; navigate('/onboarding/' + Math.max(1, cs - 1)); return; }
      case 'onb-addrow': { var rws = $('#onbRows'), n = rws.children.length; if (n >= 8) return; var dv = document.createElement('div'); dv.className = 'prod-row onb-prod'; dv.innerHTML = '<input name="n' + n + '" placeholder="Nama produk" maxlength="60"><input name="h' + n + '" type="number" inputmode="numeric" min="0" max="1000000000" placeholder="Harga jual">'; rws.appendChild(dv); return; }
      case 'onb-skip': { var st = +path().split('/')[2]; if (st === 2) { persist([{ op: 'usaha.update', fields: { onboarding: 'data' } }]).then(function () { D().usaha.onboarding = 'data'; navigate('/onboarding/3'); }); } else finishOnboarding('/'); return; }
      case 'onb-next': return onbNext(t);
    }
  });
  function onbNext(btn) {
    var step = +path().split('/')[2], o = UI.onb;
    if (step === 1) {
      var kanal = o.kanal.map(function (l) { return (KANAL.filter(function (k) { return k[1] === l; })[0] || [])[0]; }).filter(Boolean), f = { outlet: o.outlet, omzetRange: o.omzet, lamaUsaha: o.lama, kanal: kanal, onboarding: 'produk' }, extra = {};
      if (D().usaha.prefs.g) { var nm = (o.usaha != null ? o.usaha : D().usaha.nama).trim(); try { nm = LC.validation.text(nm, 'Nama usaha', 80, true); } catch (err) { return showErr(err.message); } extra = { nama: nm, jenis: o.jenis || 'Makanan berat' }; f.nama = extra.nama; f.jenis = extra.jenis; f.prefs = Object.assign({}, D().usaha.prefs, { g: false }); }
      persist([{ op: 'usaha.update', fields: f }]).then(function () { Object.assign(D().usaha, { outlet: o.outlet, omzetRange: o.omzet, lamaUsaha: o.lama, kanal: kanal, onboarding: 'produk' }, extra); if (f.prefs) D().usaha.prefs = f.prefs; navigate('/onboarding/2'); });
    } else if (step === 2) {
      var form = $('#formOnb2'), made = [];
      try {
        for (var i = 0; i < $('#onbRows').children.length; i++) {
          var name = form.elements['n' + i].value, price = form.elements['h' + i].value;
          if (!name.trim() && price === '') continue;
          var n = LC.validation.text(name, 'Nama produk', 60, true), h = LC.validation.number(price, 0, 1e9, 0);
          made.push({ id: uid('p'), nama: n, satuan: 'pcs', harga: h, hpp: 0, stok: 0, produksiLalu: 0, sumber: 'manual', bahan: [] });
        }
      } catch (err) { return showErr(err.message); }
      var ops = made.map(function (p) { return prodOp(p, false); }).concat([{ op: 'usaha.update', fields: { onboarding: 'data' } }]);
      busy(btn, true, 'Menyimpan…'); persist(ops).then(function () { D().produk = D().produk.concat(made); D().usaha.onboarding = 'data'; navigate('/onboarding/3'); }, function () { busy(btn, false); });
    } else {
      var sel = o.data; if (!sel) return showErr('Pilih salah satu cara memasukkan data, atau ketuk "Mulai kosong dulu".');
      if (sel === 'contoh') return seedSample(btn);
      UI.cat = sel; finishOnboarding('/catat');
    }
  }
  function syncBahan(p) {
    var h = UI.hpp; if (!h || h.pid !== p.id) return;
    p.bahan = h.items.filter(function (x) { return x.nama.trim(); }).map(function (x) { return { id: x.id, nama: x.nama.trim(), harga: +x.harga || 0 }; });
    var flat = p.bahan.reduce(function (a, b) { return a + b.harga; }, 0);
    if (capResep()) { p.hasil = Math.max(1e-4, +h.hasil || 1); p.resep = resFromUI().map(function (x) { return { bahanId: x.b.id, qty: x.qty }; }); }
    if (p.resep && p.resep.length) p.hpp = Math.round(recipeCostRaw(p) + flat); else if (h.items.length) p.hpp = flat;
  }
  function saveBahan(p) {
    var oldB = p.bahan.slice(); syncBahan(p);
    logBahan(p, oldB);
    var ops = capResep() ? [{ op: 'resep.set', produkId: p.id, hasil: p.hasil || 1, items: (p.resep || []).map(function (r) { return { bahanId: r.bahanId, qty: r.qty }; }) }] : [];
    persist(ops.concat([prodOp(p, true)])).catch(function () { bbRefresh(); });
  }

  function prodUpdate() {
    var sel = $('#prodSel'), qe = $('#prodQty'); if (!sel || !qe) return;
    var q = +qe.value || 0; UI.prod = { id: sel.value, q: q }; var pv = prodPreview(sel.value, q);
    $('#prodPrev').innerHTML = pv.html; var sb = $('#prodForm button[type=submit]'); if (sb) sb.disabled = pv.lack || !(q > 0);
  }
  /* input & change */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.p !== undefined) { var it = UI.hpp.items[+t.dataset.p], raw = parseInt(String(t.value).replace(/\D/g, ''), 10) || 0; it.harga = raw; t.value = raw ? raw.toLocaleString('id-ID') : ''; hppLive(); }
    else if (t.dataset.rqty !== undefined) { UI.hpp.res[+t.dataset.rqty].q = +t.value || 0; hppLive(); }
    else if (t.hasAttribute && t.hasAttribute('data-hasil')) { UI.hpp.hasil = +t.value || 0; hppLive(); }
    else if (t.hasAttribute && t.hasAttribute('data-bbcalc')) bbPreview();
    else if (t.id === 'prodQty') prodUpdate();
    else if (t.id === 'rsPaste') (UI.rs || (UI.rs = { kual: 'medium', kota: '', busy: false })).paste = t.value;
    else if (t.dataset.nm !== undefined) UI.hpp.items[+t.dataset.nm].nama = t.value;
    else if (t.hasAttribute && t.hasAttribute('data-calc-in')) { var bx = t.closest('[data-calc]'); if (bx) updateCalc(bx); }
    else if (t.hasAttribute && t.hasAttribute('data-search')) { UI.q = t.value; var pos = t.selectionStart; render(true); var ns = $('[data-search]'); if (ns) { ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (er) { } } }
    else if (t.dataset.onbText) UI.onb[t.dataset.onbText] = t.value;
    else if (t.hasAttribute && t.hasAttribute('data-q') && UI.edit) UI.edit.q = Math.max(0, +t.value || 0);
  });
  document.addEventListener('change', function (e) {
    var t = e.target, d = D();
    if (t.dataset.onbText) { UI.onb[t.dataset.onbText] = t.value; return; }
    if (t.id === 'bbSat') { var cu = $('#bbCustom'), isU = $('#bbIsiU'), bs = t.value === '__c' ? (cu.value.trim().toLowerCase() || 'unit') : t.value; cu.hidden = t.value !== '__c'; if (t.value === '__c') cu.focus(); isU.innerHTML = unitOptions(bs, bs); bbPreview(); return; }
    if (t.hasAttribute('data-bbcalc')) return bbPreview();
    if (t.id === 'prodSel') { UI.prod = { id: t.value, q: null }; return render(true); }
    if (t.id === 'prodQty') return prodUpdate();
    if (t.dataset.bbstok) { var bk = bbOne(t.dataset.bbstok); bk.stok = Math.max(0, +t.value || 0); persist([{ op: 'bahanbaku.koreksi', id: bk.id, stok: bk.stok }]).catch(function () { bbRefresh(); }); return render(true); }
    if (t.dataset.rbahan !== undefined) { var rr = UI.hpp.res[+t.dataset.rbahan], nb2 = bbOne(t.value); rr.bahanId = t.value; if (nb2) rr.u = nb2.satuan; saveBahan(prodById(UI.hpp.pid)); return render(true); }
    if (t.dataset.runit !== undefined) { UI.hpp.res[+t.dataset.runit].u = t.value; saveBahan(prodById(UI.hpp.pid)); return render(true); }
    if (t.dataset.rqty !== undefined || t.hasAttribute('data-hasil')) { if (t.hasAttribute('data-hasil')) UI.hpp.hasil = +t.value || 1; saveBahan(prodById(UI.hpp.pid)); return render(true); }
    if (t.dataset.p !== undefined || t.dataset.nm !== undefined) { saveBahan(prodById(UI.hpp.pid)); return render(true); }
    if (t.hasAttribute('data-hpp-direct')) { var pd = prodById(UI.hpp.pid); pd.hpp = Math.max(0, +t.value || 0); persist([prodOp(pd, false)]); return render(true); }
    if (t.dataset.stok) { var p = prodById(t.dataset.stok); p.stok = Math.max(0, +t.value || 0); persist([prodOp(p, false)]); return render(true); }
    if (t.dataset.lalu) { var p2 = prodById(t.dataset.lalu); p2.produksiLalu = Math.max(0, +t.value || 0); persist([prodOp(p2, false)]); return render(true); }
    if (t.id === 'saleProd') { var o = t.options[t.selectedIndex]; $('#saleHarga').value = o.dataset.h; return; }
    if ((t.id === 'logoFile' || t.id === 'nota') && t.files && t.files[0]) {
      var file = t.files[0], isLogo = t.id === 'logoFile';
      t.value = '';
      processImage(file, isLogo).then(function (url) {
        if (D() !== d) return;
        if (!isLogo) { UI.notaImg = url; if (path() === '/catat') render(true); return; }
        return persist([{ op: 'usaha.update', fields: { logo: url } }]).then(function () {
          d.usaha.logo = url; render(true); toast('Logo disimpan');
        });
      }).catch(function (err) { toast(err.message || 'Gambar tidak bisa diproses.', 4000); });
      return;
    }
    if (t.id === 'csv' && t.files && t.files[0]) {
      var csv = t.files[0];
      t.value = '';
      if (!csv.size || csv.size > 512 * 1024 || !/\.csv$/i.test(csv.name) ||
          !/^(text\/(csv|plain)|application\/(csv|vnd.ms-excel))?$/.test(csv.type)) {
        return toast('Pilih file CSV teks berukuran maksimal 512 KB.');
      }
      csv.arrayBuffer().then(function (data) {
        if (D() === d) return importCsv(new TextDecoder('utf-8', { fatal: true }).decode(data));
      }).catch(function (err) { toast(err.message || 'CSV tidak bisa dibaca.', 4500); });
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches && e.target.matches('input.p')) e.target.blur(); });
  async function processImage(file, logo) {
    var type = file.type;
    if (!file.size || file.size > 8 * 1024 * 1024 || !/^image\/(png|jpeg|webp)$/.test(type)) {
      throw new Error('Pilih gambar JPG, PNG, atau WebP berukuran maksimal 8 MB.');
    }
    var bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    var png = [137, 80, 78, 71, 13, 10, 26, 10].every(function (b, i) { return bytes[i] === b; });
    var jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    var webp = String.fromCharCode.apply(null, bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode.apply(null, bytes.slice(8, 12)) === 'WEBP';
    if (!(type === 'image/png' && png || type === 'image/jpeg' && jpeg || type === 'image/webp' && webp)) {
      throw new Error('Isi file tidak cocok dengan format gambar.');
    }
    var img = new Image(), url = URL.createObjectURL(file);
    try {
      img.src = url;
      await img.decode();
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h || w > 8192 || h > 8192 || w * h > 16000000) throw new Error('Dimensi gambar terlalu besar (maks. 16 megapiksel).');
      var canvas = document.createElement('canvas'), scale = Math.min(1, 1600 / Math.max(w, h)), crop = Math.min(w, h);
      canvas.width = logo ? 192 : Math.max(1, Math.round(w * scale));
      canvas.height = logo ? 192 : Math.max(1, Math.round(h * scale));
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (logo) ctx.drawImage(img, (w - crop) / 2, (h - crop) / 2, crop, crop, 0, 0, 192, 192);
      else ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var q = 0.86, result = canvas.toDataURL('image/jpeg', q);
      while (logo && result.length > 30000 && q > 0.3) { q -= 0.1; result = canvas.toDataURL('image/jpeg', q); }
      if (!result.startsWith('data:image/jpeg;base64,') || (logo && result.length > 30000)) throw new Error('Gambar tidak bisa dikecilkan.');
      return logo ? stripLogoMetadata(result) : result;
    } finally { URL.revokeObjectURL(url); }
  }
  function stripLogoMetadata(url) {
    var prefix = 'data:image/jpeg;base64,', raw = atob(url.slice(prefix.length)), out = raw.slice(0, 2), pos = 2;
    while (pos + 3 < raw.length && raw.charCodeAt(pos) === 255) {
      var marker = raw.charCodeAt(pos + 1);
      if (marker === 218) return prefix + btoa(out + raw.slice(pos));
      var length = raw.charCodeAt(pos + 2) * 256 + raw.charCodeAt(pos + 3), end = pos + 2 + length;
      if (length < 2 || end >= raw.length) break;
      if (!(marker >= 225 && marker <= 239) && marker !== 254) out += raw.slice(pos, end);
      pos = end;
    }
    throw new Error('File JPEG tidak dapat diproses.');
  }
  function csvCells(line, sep) {
    var cells = [], cell = '', quoted = false, closed = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (quoted) {
        if (ch !== '"') cell += ch;
        else if (line[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else if (ch === sep) {
        cells.push(cell.trim()); cell = ''; closed = false;
      } else if (ch === '"' && !cell && !closed) quoted = true;
      else if (!closed && ch !== '"') cell += ch;
      else if (!(closed && ch === ' ')) throw new Error('Format kutip CSV tidak valid.');
    }
    if (quoted) throw new Error('Format kutip CSV tidak valid.');
    cells.push(cell.trim());
    if (cells.length < 2 || cells.length > 4 || cells.some(function (v) { return v.length > 120; })) throw new Error('CSV harus berisi 2–4 kolom dengan maksimal 120 karakter per kolom.');
    return cells;
  }
  function importCsv(text) {
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new Error('CSV mengandung karakter yang tidak valid.');
    var lines = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).filter(function (line) { return line.trim(); });
    if (!lines.length || lines.length > 2001) throw new Error('CSV harus berisi 1–2.000 baris transaksi.');
    var first = lines[0], sep = first.indexOf('\t') >= 0 ? '\t' : (first.indexOf(';') >= 0 && first.indexOf(',') < 0 ? ';' : ',');
    var cells = lines.map(function (line) { return csvCells(line, sep); });
    var head = cells[0].map(function (value) { return value.toLowerCase(); });
    var col = { produk: 0, jumlah: 1, harga: 2, tanggal: 3 };
    if (head.indexOf('produk') >= 0) {
      col = { produk: head.indexOf('produk'), jumlah: head.findIndex(function (v) { return /^(jumlah|qty|jml)$/.test(v); }), harga: head.indexOf('harga'), tanggal: head.indexOf('tanggal') };
      if (col.jumlah < 0) throw new Error('Header CSV wajib berisi produk dan jumlah.');
      cells.shift();
    }
    if (!cells.length || cells.length > 2000) throw new Error('CSV harus berisi 1–2.000 baris transaksi.');
    var data = D(), byName = Object.create(null);
    data.produk.forEach(function (p) { byName[p.nama.normalize('NFC').toLowerCase()] = p; });
    var rows = cells.map(function (c, i) {
      try {
        var product = LC.validation.text(c[col.produk], 'Nama produk', 60, true);
        var p = byName[product.toLowerCase()];
        if (!p) throw new Error('Produk tidak ditemukan.');
        var qty = LC.validation.number(c[col.jumlah], 0.000001, 1e6);
        var price = LC.validation.number(c[col.harga], 0, 1e9, p.harga);
        var date = c[col.tanggal] || today();
        if (!LC.validation.date(date) || date > today()) throw new Error('Tanggal penjualan tidak valid.');
        return { id: uid('t'), tanggal: date, jam: '12:00', produkId: p.id, qty: qty, harga: price, kanal: 'toko', sumber: 'impor' };
      } catch (err) { throw new Error('Baris transaksi ' + (i + 1) + ': ' + err.message); }
    });
    return persist([{ op: 'penjualan.add', rows: rows }]).then(function () {
      if (D() !== data) return;
      data.penjualan = data.penjualan.concat(rows); UI.cat = 'cepat'; render(true); toast(rows.length + ' baris diimpor');
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) window.addEventListener('load', function () { navigator.serviceWorker.register('../sw.js', { scope: './' }).catch(function () { }); });

  /* ================= boot ================= */
  function boot() {
    var tk = getToken(); St.token = tk;
    if (!tk) { fetchCaps(); return route(); }
    $('#view').innerHTML = '<div class="boot"><div class="spin"></div><p>Memuat data…</p></div>'; document.body.classList.add('noshell');
    fetchCaps(); Api.call({ action: 'load', token: tk }).then(function (d) { St.data = d; route(); }, function (er) {
      if (er.code === 'auth') { setToken(null); St.token = null; return route(); }
      $('#view').innerHTML = '<div class="boot"><p>' + esc(er.message) + '</p><button class="btn btn-red" onclick="location.reload()">Coba lagi</button></div>';
    });
  }
  boot();
})();
