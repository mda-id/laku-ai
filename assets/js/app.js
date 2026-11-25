/* laku.ai — aplikasi web + PWA. Isi dan modul sama di web dan HP; hanya tata letak yang berbeda (CSS).
   Data: LakuApi (Google Sheets atau mode demo) -> LakuAnalytics -> tampilan. */
(function () {
  'use strict';
  var A = window.LakuAnalytics, Api = window.LakuApi, Seed = window.LakuSeed;
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
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>', sheet: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>', back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>', spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>'
  };
  var ic = function (n, sw) { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; };

  /* ================= state ================= */
  var St = { token: null, data: null };
  var UI = { period: 30, seg: 'penjualan', cat: 'cepat', hpp: null, onb: { outlet: '1 outlet', omzet: '', lama: '', kanal: [] }, busy: false, notaRows: 3, notaImg: null };
  var getToken = function () { try { return localStorage.getItem('laku.session'); } catch (e) { return null; } };
  var setToken = function (t) { try { if (t) localStorage.setItem('laku.session', t); else localStorage.removeItem('laku.session'); } catch (e) { } };

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
  var initials = function (n) { var w = String(n || '?').trim().split(/\s+/); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase(); };
  var hello = function () { var h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : (h < 15 ? 'Selamat siang' : (h < 18 ? 'Selamat sore' : 'Selamat malam')); };
  var firstName = function () { return String(D().user.nama).trim(); };
  var trialLeft = function () { var d = D(); if (d.user.paket !== 'pro_trial') return null; return Math.ceil((Date.parse(d.user.dibuat) + 14 * 864e5 - Date.now()) / 864e5); };

  function prodOp(p, withBahan) {
    var o = { id: p.id, nama: p.nama, satuan: p.satuan, harga: p.harga, hpp: p.hpp, stok: p.stok, produksiLalu: p.produksiLalu, sumber: p.sumber };
    if (withBahan) o.bahan = p.bahan.map(function (b) { return { id: b.id, nama: b.nama, harga: b.harga }; });
    return { op: 'produk.upsert', produk: o };
  }
  function logBahan(p, oldList) {
    var t = today(); p.bahan.forEach(function (b) { var o = oldList.filter(function (x) { return x.nama === b.nama; })[0]; if (!o || o.harga !== b.harga) D().hargaBahan.push({ id: uid('h'), produkId: p.id, nama: b.nama, harga: b.harga, tanggal: t }); });
  }

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
    return L.sort(function (a, b) { return a.cover - b.cover; }).map(function (p) { var c = p.cover, cls = c < 3.5 ? 'r' : (c > 10 ? 'g' : ''), tx = c < 3.5 ? 'Rawan habis' : (c > 10 ? 'Menumpuk' : 'Aman'); return '<div class="cov"><span>' + esc(p.nama) + '</span><div class="tr"><i class="' + cls + '" style="width:' + clampPct(c / 14 * 100) + '%"></i></div><span class="badge ' + (cls === 'r' ? 'b-pink' : (cls === 'g' ? 'b-gray' : 'b-ok')) + '" style="font-size:11.5px;padding:3px 10px">' + Math.round(c) + ' hari · ' + tx + '</span></div>'; }).join('') + '<div class="mbar-note">Cakupan stok = sisa stok ÷ rata-rata penjualan harian (4 minggu). Ideal 4-7 hari.</div>';
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
    var d = D(), who = '<div class="who w">' + (extra || '') + '<div><b>' + esc(d.usaha.nama) + '</b><small>' + esc([d.usaha.jenis, d.usaha.kota].filter(Boolean).join(' · ')) + '</small></div><a class="avatar" href="#/akun" aria-label="Akun">' + esc(initials(d.user.nama)) + '</a></div>';
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
    var M = compute(30), d = D();
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
        '<div class="goal" style="margin-top:18px"><div class="row"><span>Kesiapan buka cabang</span><b>' + M.readiness.cabang.pct + '%</b></div><div class="track"><i style="width:' + M.readiness.cabang.pct + '%"></i></div><a class="link" href="#/roadmap" style="margin-top:10px;font-size:13px">Lihat roadmap →</a></div>', 'c4') +
      card(title('Margin per produk') + marginBars(M), 'c6') +
      card(title('Produk terlaris', '<span class="sub">30 hari</span>') + top.map(function (p, i) { return '<div class="mbar" style="grid-template-columns:124px 1fr 96px"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (i + 1) + '. ' + esc(p.nama) + '</span><div class="tr"><i class="' + (i === 0 ? 'low' : '') + '" style="width:' + clampPct(p.share / (top[0].share || 1) * 92) + '%"></i></div><b style="font-weight:500;color:var(--muted);font-size:12.5px">' + Math.round(p.share) + '%' + (p.change != null ? ' · ' + (p.change >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(p.change * 100)) + '%' : '') + '</b></div>'; }).join(''), 'c6') +
      '<div class="quick m c12"><a href="#/catat">' + ic('plus') + 'Catat penjualan</a><a href="#/roadmap">' + ic('flag') + 'Roadmap usaha</a></div></div>';
    return body;
  };

  V.diagnosis = function () {
    var M = compute(30), comps = M.comps.map(function (h) { return '<div class="comp"><div class="row"><b>' + h.k + '</b><span class="badge ' + (h.warn ? 'b-pink' : (h.v >= 80 ? 'b-ok' : 'b-gray')) + '">' + h.l + ' · ' + h.v + '</span></div><div class="track' + (h.warn ? ' red' : '') + '" style="margin-top:10px"><i style="width:' + h.v + '%"></i></div><p><b style="color:var(--red)">Kenapa?</b> ' + esc(h.d) + '</p></div>'; }).join('');
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
  function stokCard(p, dec, edit) {
    var badge = p.act === 'Naikkan' ? 'b-dark' : (p.act === 'Kurangi' ? 'b-pink' : 'b-gray'), lbl = p.act === 'Naikkan' ? 'Naikkan produksi' : (p.act === 'Kurangi' ? 'Kurangi produksi' : 'Pertahankan');
    var d = dec[p.id], acts;
    if (edit && edit.id === p.id) acts = '<div class="stepper"><button class="s" data-step="-5" aria-label="Kurangi 5">−</button><input type="number" inputmode="numeric" min="0" value="' + edit.q + '" data-q aria-label="Jumlah produksi"><button class="s" data-step="5" aria-label="Tambah 5">+</button></div><div class="act"><button class="btn btn-line" data-act="undo" data-id="' + p.id + '">Batal</button><button class="btn btn-red" data-act="save-edit" data-id="' + p.id + '">Simpan</button></div>';
    else if (d) acts = '<div class="act"><button class="btn btn-ok" disabled>✓ ' + (d.tindakan === 'ikuti' ? 'Mengikuti saran' : 'Diubah: ' + d.nilaiAkhir + ' ' + esc(p.satuan)) + '</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ubah lagi</button></div>';
    else acts = '<div class="act"><button class="btn btn-red" data-act="follow" data-id="' + p.id + '">Ikuti saran</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ubah sendiri</button></div>';
    return '<div class="card stock-card"><div class="head"><h3>' + esc(p.nama) + '</h3><span class="badge ' + badge + '">' + lbl + '</span></div>' +
      '<div class="kv"><div><small>Sisa stok (' + esc(p.satuan) + ')</small><input class="inl" type="number" inputmode="numeric" min="0" value="' + p.stok + '" data-stok="' + p.id + '" aria-label="Sisa stok ' + esc(p.nama) + '"></div><div class="hi"><small>Saran produksi</small><b>' + p.saran + ' ' + esc(p.satuan) + '</b></div></div>' +
      '<div class="why"><b>Kenapa?</b> ' + esc(p.why) + '</div><div class="lalu"><span>Produksi minggu lalu</span><input class="inl sm" type="number" inputmode="numeric" min="0" value="' + p.lalu + '" data-lalu="' + p.id + '" aria-label="Produksi minggu lalu ' + esc(p.nama) + '"></div>' + acts + '</div>';
  }
  V.stok = function () {
    var M = compute(30), dec = decisions(), ss = M.stockSummary, edit = UI.edit;
    if (!D().produk.length) return head('Untuk minggu ' + weekRange(), 'Rekomendasi stok', 'Untuk minggu ' + weekRange(), 'Rekomendasi stok', '') + '<div class="card"><p>Belum ada produk. <a class="link" href="#/hpp" style="font-size:inherit">Tambah produk di Kalkulator HPP</a>, lalu catat penjualan agar saran stok bisa dihitung.</p></div>';
    var sumCards = '<div class="stock-stats"><div class="card"><div class="label">Produk perlu dinaikkan</div><b class="v">' + ss.up.length + ' produk</b><span class="d">' + (ss.up.map(function (p) { return esc(p.nama); }).join(', ') || '–') + '</span></div><div class="card"><div class="label">Produk perlu dikurangi</div><b class="v">' + ss.down.length + ' produk</b><span class="d">' + (ss.down.map(function (p) { return esc(p.nama); }).join(', ') || '–') + '</span></div><div class="card"><div class="label">Risiko kehabisan</div><b class="v">' + ss.risk.length + ' produk</b><span class="d" style="color:var(--red)">' + (ss.risk.map(function (p) { return esc(p.nama) + ' (' + Math.round(p.cover) + ' hari)'; }).join(', ') || 'Tidak ada') + '</span></div></div>';
    var order = M.prods.slice().sort(function (a, b) { var r = { Naikkan: 0, Kurangi: 1, Tetap: 2 }; return r[a.act] - r[b.act]; });
    var rows = M.prods.map(function (p) {
      var d = dec[p.id], b = p.act === 'Naikkan' ? 'b-dark' : (p.act === 'Kurangi' ? 'b-pink' : 'b-gray'), isEdit = edit && edit.id === p.id;
      var rec = isEdit ? '<input class="q" type="number" min="0" value="' + edit.q + '" data-q aria-label="Jumlah produksi"> ' + esc(p.satuan) : '<span class="rec">' + (d ? d.nilaiAkhir : p.saran) + ' ' + esc(p.satuan) + '</span>';
      var acts = isEdit ? '<button class="btn btn-red" data-act="save-edit" data-id="' + p.id + '">Simpan</button><button class="btn btn-line" data-act="undo" data-id="' + p.id + '">Batal</button>' : (d ? '<button class="btn btn-ok" disabled>✓ ' + (d.tindakan === 'ikuti' ? 'Diikuti' : 'Diubah') + '</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ulang</button>' : '<button class="btn btn-red" data-act="follow" data-id="' + p.id + '">Ikuti</button><button class="btn btn-line" data-act="edit" data-id="' + p.id + '">Ubah</button>');
      return '<tr><td class="nm">' + esc(p.nama) + '</td><td style="white-space:nowrap"><input class="inl sm" type="number" min="0" value="' + p.stok + '" data-stok="' + p.id + '" aria-label="Sisa stok ' + esc(p.nama) + '"> ' + esc(p.satuan) + '</td><td style="white-space:nowrap"><input class="inl sm" type="number" min="0" value="' + p.lalu + '" data-lalu="' + p.id + '" aria-label="Produksi minggu lalu ' + esc(p.nama) + '"> ' + esc(p.satuan) + '</td><td>' + rec + '</td><td><span class="badge ' + b + '">' + p.act + '</span></td><td class="why-t">' + esc(p.why) + '</td><td><div class="acts">' + acts + '</div></td></tr>';
    }).join('');
    var web = '<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Produk</th><th>Sisa stok</th><th>Produksi minggu lalu</th><th>Saran produksi</th><th>Aksi</th><th>Kenapa?</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    var mobile = '<div class="stack">' + order.map(function (p) { return stokCard(p, dec, edit); }).join('') + '</div>';
    return head('Untuk minggu ' + weekRange(), 'Rekomendasi stok', 'Untuk minggu ' + weekRange(), 'Rekomendasi stok', '') + sumCards + mw(mobile, web) +
      '<p class="foot-note">Saran dihitung dari penjualan 4-8 minggu terakhir dan sisa stok yang Anda isi. Keputusan akhir tetap di tangan Anda.</p>';
  };

  /* ---------- HPP ---------- */
  function hppInit(pid) {
    var d = D(); if (!d.produk.length) { UI.hpp = null; return; }
    var p = prodById(pid) || d.produk[0];
    UI.hpp = { pid: p.id, items: p.bahan.map(function (b) { return { id: b.id, nama: b.nama, harga: b.harga }; }), pick: 1 };
  }
  var r500 = function (v) { return Math.round(v / 500) * 500; };
  function hppCalc() {
    var h = UI.hpp, p = prodById(h.pid), total = h.items.length ? h.items.reduce(function (a, b) { return a + (+b.harga || 0); }, 0) : p.hpp, cur = p.harga, tm = D().usaha.targetMargin;
    var mg = function (price) { return price > 0 ? Math.round(100 * (price - total) / price) : 0; };
    var opts = [cur, Math.max(cur + 500, r500(cur * 1.07)), Math.max(cur + 1000, r500(cur * 1.11))], np = opts[Math.min(h.pick, 2)];
    var goal = total > 0 && tm < 95 ? Math.ceil(total / (1 - tm / 100) / 500) * 500 : 0;
    var why = h.pick === 0 ? 'Harga tidak berubah. Margin tetap ' + mg(cur) + '% dan akan turun bila harga bahan naik.' : 'Kenaikan hanya ' + rp(np - cur) + ' (' + Math.round(100 * (np - cur) / (cur || 1)) + '%), ' + (mg(cur) < tm - 5 ? 'membantu menutup kenaikan harga bahan dan ' : '') + 'menaikkan margin ke ' + mg(np) + '%.' + (goal && goal > np ? ' Untuk mencapai target ' + tm + '% dibutuhkan harga ' + rp(goal) + '.' : '');
    return { p: p, total: total, cur: cur, opts: opts, np: np, mg: mg, why: why, tm: tm };
  }
  function hppRight() {
    var c = hppCalc(), h = UI.hpp, red = c.mg(c.cur) < c.tm - 5;
    return '<div class="row"><div><div class="label">Harga jual sekarang</div><div class="big" style="font-size:24px;margin-top:4px">' + rp(c.cur) + '</div></div><div style="text-align:right"><div class="label">Margin</div><div class="big" style="font-size:24px;margin-top:4px;color:' + (red ? 'var(--red)' : 'var(--ink)') + '">' + c.mg(c.cur) + '%</div></div></div>' +
      '<div class="label" style="margin-top:18px">Pilihan harga baru</div><div class="opts" role="radiogroup" aria-label="Pilihan harga baru">' + c.opts.map(function (o, i) { return '<button class="opt" role="radio" aria-checked="' + (i === h.pick) + '" data-pick="' + i + '"><b>' + rp(o) + '</b><small>margin ' + c.mg(o) + '%</small></button>'; }).join('') + '</div>' +
      '<div class="why"><b>Kenapa ' + rp(c.np) + '?</b> ' + esc(c.why) + '</div><button class="btn btn-red btn-block" data-act="save-price" style="margin-top:14px"' + (h.pick === 0 ? ' disabled' : '') + '>Simpan harga baru</button>';
  }
  V.hpp = function () {
    var d = D();
    if (!UI.hpp || !prodById(UI.hpp.pid)) hppInit();
    var chips = '<div class="chips" style="margin-bottom:14px">' + d.produk.map(function (p) { return '<button class="chip" aria-pressed="' + (UI.hpp && UI.hpp.pid === p.id) + '" data-hpp-pid="' + p.id + '">' + esc(p.nama) + '</button>'; }).join('') + '<button class="chip sel" data-act="add-prod">+ Produk</button></div>';
    var addForm = UI.addProd || !d.produk.length ? '<form class="card" id="addProd" style="margin-bottom:14px"><div class="label">Produk baru</div><div class="two" style="margin-top:8px"><label class="field"><span>Nama produk</span><input name="nama" required maxlength="60" placeholder="mis. Risol Mayo"></label><label class="field"><span>Satuan</span><input name="satuan" value="pcs" maxlength="12"></label></div><label class="field"><span>Harga jual (Rp)</span><input name="harga" type="number" inputmode="numeric" min="0" placeholder="mis. 10000" required></label><div class="act"><button type="button" class="btn btn-line" data-act="cancel-prod"' + (d.produk.length ? '' : ' style="visibility:hidden"') + '>Batal</button><button class="btn btn-red" type="submit">Tambah</button></div></form>' : '';
    if (!d.produk.length) return head('Hitung HPP dan harga jual', 'Kalkulator HPP', 'Hitung HPP dan harga jual', 'Kalkulator HPP', '') + '<div style="max-width:560px">' + addForm + '</div>';
    var c = hppCalc(), h = UI.hpp;
    var items = h.items.map(function (it, i) { var old = (c.p.bahan.filter(function (b) { return b.id === it.id; })[0]) || null, badge = ''; if (old && it.harga > old.harga) badge = '<span class="badge b-pink" style="padding:3px 10px;font-size:11.5px">naik</span>'; var log = D().hargaBahan.filter(function (x) { return x.produkId === c.p.id && x.nama === it.nama; }).sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; }); if (!badge && log.length >= 2) { var f = log[0].harga, l = log[log.length - 1].harga; if (f > 0 && (l - f) / f >= 0.05) badge = '<span class="badge b-pink" style="padding:3px 10px;font-size:11.5px">naik ' + Math.round((l - f) / f * 100) + '%</span>'; } return '<div class="ing"><div class="n"><input class="nm" value="' + esc(it.nama) + '" data-nm="' + i + '" aria-label="Nama bahan" placeholder="Nama bahan">' + badge + '</div><div class="pr"><b>Rp</b><input class="p" inputmode="numeric" value="' + (+it.harga).toLocaleString('id-ID') + '" data-p="' + i + '" aria-label="Harga ' + esc(it.nama) + '"><button class="x" data-rm="' + i + '" aria-label="Hapus bahan">×</button></div></div>'; }).join('');
    var left = '<div class="card"><div class="row"><div class="label">Bahan dan biaya per ' + esc(c.p.satuan) + '</div></div><div style="margin-top:6px">' + (items || '<p class="sub" style="padding:10px 0">Belum ada bahan. Tambahkan bahan untuk menghitung HPP otomatis.</p>') + '</div><button class="add-ing" data-act="add-ing">+ Tambah bahan</button><div class="total"><b>HPP per ' + esc(c.p.satuan) + '</b><b id="hppTotal">' + rp(c.total) + '</b></div>' + (h.items.length ? '' : '<div class="field" style="margin-top:12px"><span>Atau isi HPP langsung (Rp)</span><input type="number" inputmode="numeric" min="0" value="' + c.p.hpp + '" data-hpp-direct></div>') + '</div>';
    return head(esc(c.p.nama) + ' · per ' + esc(c.p.satuan), 'Kalkulator HPP', esc(c.p.nama) + ' · per ' + esc(c.p.satuan), 'Kalkulator HPP', '') + chips + addForm +
      '<div class="two-col"><div class="stack">' + left + '</div><div class="stack"><div class="card" id="hppRight">' + hppRight() + '</div><button class="link" data-act="del-prod" style="color:var(--muted);font-weight:500;font-size:13px;margin-top:6px">Hapus produk ini</button></div></div><p class="foot-note">Ketuk harga bahan untuk mengubahnya. Margin = (harga jual − HPP) ÷ harga jual. Perubahan harga bahan tercatat otomatis di Analitik.</p>';
  };

  /* ---------- catat ---------- */
  var KANAL = [['toko', 'Toko sendiri'], ['wa', 'WhatsApp'], ['reseller', 'Reseller'], ['gofood', 'GoFood / Grab / Shopee'], ['marketplace', 'Marketplace'], ['lainnya', 'Lainnya']];
  var prodOpts = function (sel) { return D().produk.map(function (p) { return '<option value="' + p.id + '" data-h="' + p.harga + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.nama) + '</option>'; }).join(''); };
  V.catat = function () {
    var d = D(), tabs = [['cepat', 'Isi cepat'], ['foto', 'Foto nota'], ['impor', 'Impor'], ['promosi', 'Promosi']];
    var seg = '<div class="seg" role="tablist">' + tabs.map(function (t) { return '<button role="tab" aria-selected="' + (UI.cat === t[0]) + '" data-ct="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var noProd = '<div class="card"><p>Belum ada produk. <a class="link" href="#/hpp" style="font-size:inherit">Tambah produk dulu di Kalkulator HPP</a>.</p></div>', pane = '';
    var kanalSel = function (n) { return '<select name="' + (n || 'kanal') + '">' + KANAL.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select>'; };
    if (UI.cat === 'cepat') {
      var hist = d.penjualan.slice(-10).reverse();   // urut berdasarkan waktu dicatat (terbaru di atas)
      pane = !d.produk.length ? noProd : '<div class="card"><form id="saleForm" novalidate><div class="two"><label class="field"><span>Tanggal</span><input name="tanggal" type="date" value="' + today() + '" max="' + today() + '" required></label><label class="field"><span>Jam</span><input name="jam" type="time" value="' + nowTime() + '"></label></div><label class="field"><span>Produk</span><select name="produk" id="saleProd">' + prodOpts() + '</select></label><div class="two"><label class="field"><span>Jumlah terjual</span><input name="qty" type="number" inputmode="numeric" min="1" placeholder="mis. 24" required></label><label class="field"><span>Harga per unit (Rp)</span><input name="harga" id="saleHarga" type="number" inputmode="numeric" min="0" value="' + d.produk[0].harga + '" required></label></div><label class="field"><span>Kanal</span>' + kanalSel() + '</label><button class="btn btn-red btn-block" type="submit">Simpan catatan</button></form></div>' +
        '<div class="card"><div class="label" style="margin-bottom:6px">Catatan terbaru</div><div class="list">' + (hist.length ? hist.map(function (s) { var p = prodById(s.produkId); return '<div><span><b>' + esc(p ? p.nama : '?') + '</b><br><small>' + s.tanggal + ' ' + s.jam + ' · ' + s.qty + ' terjual · ' + esc((KANAL.filter(function (k) { return k[0] === s.kanal; })[0] || [0, s.kanal])[1]) + '</small></span><span style="text-align:right"><b>' + rp(s.qty * s.harga) + '</b><br><button class="x" data-deltx="' + s.id + '" aria-label="Hapus catatan" style="color:var(--muted-2);font-size:12px">hapus</button></span></div>'; }).join('') : '<p class="sub">Belum ada catatan.</p>') + '</div></div>';
    } else if (UI.cat === 'foto') {
      var rows = ''; for (var i = 0; i < UI.notaRows; i++) rows += '<div class="nota-row"><select name="np' + i + '">' + prodOpts() + '</select><input name="nq' + i + '" type="number" inputmode="numeric" min="0" placeholder="Jumlah"><input name="nh' + i + '" type="number" inputmode="numeric" min="0" placeholder="Harga"></div>';
      pane = !d.produk.length ? noProd : '<div class="card"><label class="drop" for="nota">' + ic('camera') + '<b>Foto nota atau catatan tulis</b><span>Ambil foto sebagai rujukan, lalu ketik isinya di bawah.</span><span class="btn btn-red btn-sm" style="margin-top:4px">Ambil / pilih foto</span></label><input id="nota" type="file" accept="image/*" capture="environment" class="sr">' + (UI.notaImg ? '<img class="preview" alt="Foto nota" src="' + UI.notaImg + '">' : '') + '<p class="sub" style="margin-top:10px">Pembacaan otomatis dari foto belum aktif; foto ini hanya rujukan di layar dan tidak diunggah.</p></div>' +
        '<form class="card" id="notaForm"><div class="label">Isi dari nota</div><label class="field" style="margin-top:8px"><span>Tanggal nota</span><input name="tanggal" type="date" value="' + today() + '" max="' + today() + '"></label><div class="nota-head"><span>Produk</span><span>Jumlah</span><span>Harga</span></div>' + rows + '<button type="button" class="add-ing" data-act="nota-row">+ Tambah baris</button><button class="btn btn-red btn-block" type="submit" style="margin-top:12px">Simpan semua</button></form>';
    } else if (UI.cat === 'impor') {
      pane = '<div class="card"><div class="src"><div class="ic">CSV</div><div class="t"><b>Excel / CSV</b><small>Kolom: produk, jumlah, harga, tanggal (harga &amp; tanggal opsional)</small></div><label class="btn btn-line btn-sm" for="csv">Pilih file</label><input id="csv" type="file" accept=".csv,text/csv,.txt" class="sr"></div>' +
        '<div class="src"><div class="ic">POS</div><div class="t"><b>Aplikasi kasir</b><small>Impor penjualan otomatis dari POS</small></div><span class="badge b-gray">Segera</span></div><div class="src"><div class="ic">GF</div><div class="t"><b>GoFood, GrabFood, ShopeeFood</b><small>Tarik laporan penjualan marketplace</small></div><span class="badge b-gray">Segera</span></div></div>' +
        '<p class="foot-note" style="text-align:left">Simpan Excel sebagai CSV. Nama produk harus sama dengan produk di akun Anda. <a class="link" style="font-size:inherit" href="data:text/csv;charset=utf-8,produk%2Cjumlah%2Charga%2Ctanggal%0ARisol%20Mayo%2C24%2C10000%2C' + today() + '%0A" download="contoh-impor-laku-ai.csv">Unduh contoh CSV</a></p>';
    } else {
      var M = compute(30);
      pane = '<form class="card" id="promoForm"><div class="label">Catat promosi</div><label class="field" style="margin-top:8px"><span>Nama promosi</span><input name="nama" required maxlength="80" placeholder="mis. Diskon Risol Mayo Jumat"></label><label class="field"><span>Produk</span><select name="produk"><option value="">Semua produk</option>' + prodOpts() + '</select></label><div class="two"><label class="field"><span>Mulai</span><input name="mulai" type="date" value="' + A.addDays(today(), -7) + '" required></label><label class="field"><span>Selesai</span><input name="selesai" type="date" value="' + today() + '" required></label></div><button class="btn btn-red btn-block" type="submit">Simpan promosi</button></form>' +
        '<div class="card"><div class="label" style="margin-bottom:6px">Promosi tercatat</div><div class="list">' + (M.promos.length ? M.promos.map(function (p) { return '<div><span><b>' + esc(p.nama) + '</b><br><small>' + p.mulai + ' s/d ' + p.selesai + ' · ' + (p.effect == null ? p.verdict : (p.effect >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(p.effect * 100)) + '% · ' + p.verdict) + '</small></span><button class="x" data-delpromo="' + p.id + '" style="color:var(--muted-2);font-size:12px">hapus</button></div>'; }).join('') : '<p class="sub">Belum ada promosi.</p>') + '</div></div>';
    }
    return head('Isi cepat, foto nota, impor, dan promosi', 'Catat penjualan', 'Isi cepat, foto nota, impor dari aplikasi kasir, dan catat promosi', 'Catat penjualan', '') + '<div style="max-width:660px"><div class="stack">' + seg + pane + '</div></div>';
  };

  /* ---------- roadmap ---------- */
  V.roadmap = function () {
    var M = compute(30), R = M.readiness;
    var ph = [
      { t: 'Bulan 1-3', h: 'Jaga margin', now: 1, l: ['Hitung ulang HPP setiap bulan', 'Naikkan harga produk yang margin-nya di bawah ' + M.targetM + '%', 'Target margin kotor kembali ke ' + M.targetM + '%'] },
      { t: 'Bulan 4-6', h: 'Perkuat produk unggulan', l: ['Promosi di waktu ramai (' + A.DAYS_FULL[M.peak.d] + ' ' + A.SLOTS[M.peak.s][0].toLowerCase() + ')', 'Produksi mengikuti rekomendasi stok', 'Target omzet ' + jt(D().usaha.targetOmzet) + ' per bulan'] },
      { t: 'Bulan 7-9', h: 'Cek kesiapan cabang', l: ['Pencatatan konsisten 6 bulan', 'Margin stabil di atas ' + M.targetM + '%', 'Hitung modal dan titik impas cabang'] },
      { t: 'Bulan 10-12', h: 'Pola franchise', l: ['Standarkan resep dan HPP', 'Susun SOP produksi dan kemasan', 'Uji dengan satu mitra percontohan'] }
    ];
    var meter = function (k, v, items) { return '<div class="card"><div class="row"><b style="font-size:16px">' + k + '</b><span class="badge b-gray">Modul lanjut</span></div><div class="meter"><div class="row"><span class="sub">Tingkat kesiapan</span><b>' + v + '%</b></div><div class="track"><i style="width:' + v + '%"></i></div></div>' + items.map(function (c) { var inner = '<i>' + (c[0] ? ic('check', 3) : '') + '</i><span>' + esc(c[1]) + '</span>'; return c[2] ? '<button class="check' + (c[0] ? ' done' : '') + '" data-chk="' + c[2] + '" aria-pressed="' + c[0] + '">' + inner + '</button>' : '<div class="check' + (c[0] ? ' done' : '') + '">' + inner + '</div>'; }).join('') + '</div>'; };
    return head('Rencana 3-12 bulan', 'Roadmap usaha', 'Rencana 3-12 bulan dan kesiapan cabang atau franchise', 'Roadmap usaha', '') +
      '<div class="two-col"><div class="card"><div class="label" style="margin-bottom:14px">Rencana 12 bulan</div><div class="tl">' + ph.map(function (p) { return '<div class="ph' + (p.now ? ' now' : '') + '"><small>' + p.t + (p.now ? ' · sekarang' : '') + '</small><h3>' + p.h + '</h3><ul>' + p.l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div></div>' +
      '<div class="stack">' + meter('Kesiapan buka cabang', R.cabang.pct, R.cabang.items) + meter('Kesiapan franchise', R.franchise.pct, R.franchise.items) + '<p class="foot-note" style="text-align:left">Kesiapan dihitung otomatis dari data penjualan Anda. Ketuk butir "SOP" dan "cabang stabil" untuk menandainya sendiri.</p></div></div>';
  };

  /* ---------- akun ---------- */
  var deferredInstall = null;
  V.akun = function () {
    var d = D(), u = d.user, b = d.usaha, ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var tl = trialLeft(), plan = u.paket === 'pro_trial' ? (tl > 0 ? 'Uji coba ' + tl + ' hari lagi · lalu Rp49.000/bulan' : 'Uji coba selesai · Pro Rp49.000/bulan') : 'Paket gratis';
    var sw = function (k, v) { return '<button class="switch" role="switch" aria-checked="' + !!v + '" data-pref="' + k + '"></button>'; };
    var install = standalone ? '' : '<div class="card install"><div class="label" style="color:var(--red)">Pasang aplikasi</div><h3 style="font-size:17px;margin:6px 0 6px">Jadikan ikon di layar utama</h3>' + (ios ? '<ol><li>Ketuk tombol <b>Bagikan</b> di Safari</li><li>Pilih <b>Tambah ke Layar Utama</b></li><li>Ketuk <b>Tambah</b></li></ol>' : '<p class="sub" style="color:var(--ink-2)">Buka laku.ai langsung dari layar utama, tanpa toko aplikasi.</p><button class="btn btn-red btn-block" data-act="install" style="margin-top:12px">Pasang di Android</button><p class="sub" style="margin-top:8px;font-size:12px">iPhone: ketuk Bagikan, lalu Tambah ke Layar Utama.</p>') + '</div>';
    var hasSample = d.produk.some(function (p) { return p.sumber === 'contoh'; });
    return '<div class="pagehead"><div><div class="eyebrow">Pengaturan dan paket</div><h1 class="h1">Akun</h1></div></div>' +
      '<div class="acc-grid"><div class="stack">' +
      '<div class="card profile"><div class="avatar">' + esc(initials(u.nama)) + '</div><div><b style="font-size:17px">' + esc(b.nama) + '</b><div class="sub">' + esc(u.nama) + ' · ' + esc(u.email) + '</div></div></div>' +
      '<div class="planbox"><div class="label">Paket aktif</div><h3>' + (u.paket === 'pro_trial' ? 'Klinik Pro' : 'Gratis') + '</h3><div style="color:#B0BEC5;font-size:13.5px">' + plan + '</div><ul><li>Cek kesehatan pendapatan</li><li>Analitik penjualan, produk, dan waktu ramai</li><li>Rekomendasi stok per produk</li><li>Roadmap 3-12 bulan</li></ul></div>' + install +
      '<form class="card" id="profileForm"><div class="label">Profil</div><label class="field" style="margin-top:8px"><span>Nama pemilik</span><input name="nama" value="' + esc(u.nama) + '" required maxlength="80"></label><label class="field"><span>Nama usaha</span><input name="usaha" value="' + esc(b.nama) + '" required maxlength="80"></label><div class="two"><label class="field"><span>Jenis usaha</span><input name="jenis" value="' + esc(b.jenis) + '" maxlength="40"></label><label class="field"><span>Kota</span><input name="kota" value="' + esc(b.kota) + '" maxlength="60"></label></div><label class="field"><span>WhatsApp</span><input name="wa" type="tel" value="' + esc(u.wa) + '" maxlength="20"></label><button class="btn btn-red btn-block" type="submit">Simpan profil</button></form></div>' +
      '<div class="stack"><form class="card" id="targetForm"><div class="label">Target usaha</div><div class="two" style="margin-top:8px"><label class="field"><span>Omzet per bulan (Rp)</span><input name="omzet" type="number" inputmode="numeric" min="0" value="' + b.targetOmzet + '"></label><label class="field"><span>Margin kotor (%)</span><input name="margin" type="number" inputmode="numeric" min="1" max="90" value="' + b.targetMargin + '"></label></div><button class="btn btn-line btn-block" type="submit">Simpan target</button></form>' +
      '<div class="card"><div class="label">Pengingat</div><div class="menu"><div><span><b>Ringkasan mingguan WhatsApp</b><small>Skor dan saran stok tiap Senin pagi (segera hadir)</small></span>' + sw('wa', b.prefs.wa) + '</div><div><span><b>Peringatan dini</b><small>Margin turun atau stok berisiko habis</small></span>' + sw('alert', b.prefs.alert !== false) + '</div></div></div>' +
      '<div class="card"><div class="label">Privasi dan data</div><div class="menu"><div><span><b>Saran selalu disertai alasan dan data</b><small>Tidak ada saran yang dijalankan otomatis</small></span><span class="badge b-ok">Aktif</span></div><div><span><b>Penyimpanan data</b><small>' + (Api.mode === 'sheets' ? 'Tersambung ke database Google Sheets. Data hanya dipakai untuk analisis akun ini.' : 'Mode demo: data tersimpan di perangkat ini saja.') + '</small></span><span class="badge ' + (Api.mode === 'sheets' ? 'b-ok' : 'b-gray') + '">' + (Api.mode === 'sheets' ? 'Terhubung' : 'Demo') + '</span></div>' +
      '<button data-act="export"><span><b>Unduh data saya</b><small>Produk, penjualan, dan keputusan (JSON)</small></span>' + ic('chev', 2) + '</button>' + (hasSample ? '<button data-act="del-sample"><span><b>Hapus data contoh</b><small>Menghapus produk dan penjualan contoh saja</small></span>' + ic('chev', 2) + '</button>' : '<button data-act="seed"><span><b>Isi data contoh</b><small>8 minggu penjualan untuk mencoba tampilan</small></span>' + ic('chev', 2) + '</button>') + '<button data-act="del-account" style="color:var(--red)"><span><b>Hapus akun dan semua data</b><small>Permanen. Perlu kata sandi.</small></span>' + ic('chev', 2) + '</button></div></div>' +
      '<div class="card"><div class="label">Lainnya</div><div class="menu"><a href="#/roadmap"><span><b>Roadmap usaha</b><small>Cabang dan franchise (modul lanjut)</small></span>' + ic('chev', 2) + '</a><a href="#/catat"><span><b>Catat penjualan</b><small>Isi cepat, foto nota, impor, promosi</small></span>' + ic('chev', 2) + '</a></div></div>' +
      '<button class="btn btn-line btn-block" data-act="logout">Keluar</button></div></div>';
  };

  /* ---------- auth & onboarding ---------- */
  function authSide() { return '<aside class="auth-side"><a class="wordmark" style="font-size:40px" href="../"><span>laku</span><i>.ai</i></a><div><h2>Klinik bisnis untuk usaha Anda.</h2><ul><li>Kalkulator HPP dan harga jual gratis</li><li>Coba Klinik Pro 14 hari tanpa kartu</li><li>Setiap saran disertai alasan dan datanya</li><li>Keputusan akhir tetap di tangan Anda</li></ul></div><div class="quote"><b>74%</b>pemilik usaha dalam survei pilot kami pernah salah mengatur stok. Data penjualan Anda bisa mencegahnya.</div></aside>'; }
  var wmk = function () { return '<a class="wordmark" style="font-size:36px" href="../"><span>laku</span><i>.ai</i></a>'; };
  var modeNote = function () { return Api.mode === 'demo' ? '<p class="legalnote" style="margin-top:10px">Mode demo: akun dan data tersimpan di perangkat ini saja.</p>' : ''; };
  V.daftar = function () {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + wmk() + '<h1>Daftar gratis</h1><p class="lead">Mulai dengan kalkulator HPP. Diagnosis usaha terbuka setelah data masuk.</p>' +
      '<form id="formDaftar" novalidate><div id="authErr" class="err" role="alert" hidden></div><label class="field"><span>Nama pemilik</span><input name="nama" required maxlength="80" autocomplete="name" placeholder="mis. Bu Sari"></label><label class="field"><span>Nama usaha</span><input name="usaha" required maxlength="80" placeholder="mis. Dapur Bu Sari"></label>' +
      '<label class="field"><span>Jenis usaha</span><select name="jenis"><option>Makanan berat</option><option>Frozen food</option><option>Camilan</option><option>Kafe / minuman</option><option>Jasa</option><option>Lainnya</option></select></label>' +
      '<div class="two"><label class="field"><span>Nomor WhatsApp</span><input name="wa" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></label><label class="field"><span>Kota</span><input name="kota" autocomplete="address-level2" placeholder="mis. Malang"></label></div>' +
      '<label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email" placeholder="nama@email.com"></label><label class="field"><span>Kata sandi</span><div class="pw"><input name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Minimal 8 karakter"><em data-act="showpw">Lihat</em></div></label>' +
      '<label class="agree"><input type="checkbox" name="setuju" required><span>Saya setuju data usaha saya dipakai <b>hanya untuk analisis akun saya</b> dan tidak dibagikan ke pihak lain.</span></label><button class="btn btn-red btn-block" type="submit">Daftar gratis</button></form>' +
      '<div class="auth-foot">Sudah punya akun? <a href="#/masuk">Masuk</a></div><p class="legalnote">Tanpa kartu kredit. Bisa dihapus kapan saja.</p>' + modeNote() + '</main></div>';
  };
  V.masuk = function () {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + wmk() + '<h1>Selamat datang kembali</h1><p class="lead">Masuk untuk melihat kesehatan usaha Anda.</p>' +
      '<form id="formMasuk" novalidate><div id="authErr" class="err" role="alert" hidden></div><label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email" placeholder="nama@email.com"></label><label class="field"><span>Kata sandi</span><div class="pw"><input name="password" type="password" required autocomplete="current-password"><em data-act="showpw">Lihat</em></div></label><button class="btn btn-red btn-block" type="submit" style="margin-top:6px">Masuk</button></form>' +
      '<div class="auth-foot">Belum punya akun? <a href="#/daftar">Daftar gratis</a></div>' + modeNote() + '</main></div>';
  };
  var chipSel = function (group, label) { var on = group === 'kanal' ? UI.onb.kanal.indexOf(label) >= 0 : UI.onb[group] === label; return '<button type="button" class="chip' + (on ? ' sel' : '') + '" data-onb="' + group + '" data-v="' + esc(label) + '">' + esc(label) + '</button>'; };
  function onbWrap(step, label, inner, nextLabel, skip) {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + wmk() + '<div class="stepper-top">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="step-label">Langkah ' + step + ' dari 3 · ' + label + '</div>' + inner + '<div id="authErr" class="err" role="alert" hidden></div><div class="sticky-cta">' + (step > 1 ? '<button class="btn btn-line" data-act="onb-back">Kembali</button>' : '') + '<button class="btn btn-red" data-act="onb-next">' + nextLabel + '</button></div>' + (skip ? '<div class="auth-foot"><button class="link" data-act="onb-skip" style="font-size:13px;color:var(--muted)">' + skip + '</button></div>' : '') + '</main></div>';
  }
  V.onboarding = function (step) {
    if (step === 1) return onbWrap(1, 'Profil usaha', '<h1>Ceritakan usaha Anda</h1><p class="lead">Supaya saran sesuai dengan tahap usaha Anda.</p><div class="field"><span>Jumlah outlet</span><div class="chips">' + ['1 outlet', '2-3 outlet', '4+ outlet'].map(function (x) { return chipSel('outlet', x); }).join('') + '</div></div><div class="field"><span>Omzet per bulan (perkiraan)</span><div class="chips">' + ['< Rp5 jt', 'Rp5-15 jt', 'Rp15-50 jt', '> Rp50 jt', 'Belum tahu'].map(function (x) { return chipSel('omzet', x); }).join('') + '</div></div><div class="field"><span>Lama usaha</span><div class="chips">' + ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'].map(function (x) { return chipSel('lama', x); }).join('') + '</div></div><div class="field"><span>Jual lewat (boleh lebih dari satu)</span><div class="chips">' + KANAL.map(function (k) { return chipSel('kanal', k[1]); }).join('') + '</div></div>', 'Lanjut');
    if (step === 2) { var rows = ''; for (var i = 0; i < 3; i++) rows += '<div class="prod-row"><input name="n' + i + '" placeholder="Nama produk" maxlength="60"><input name="h' + i + '" type="number" inputmode="numeric" min="0" placeholder="Harga jual"><input name="c' + i + '" type="number" inputmode="numeric" min="0" placeholder="HPP"></div>'; return onbWrap(2, 'Produk utama', '<h1>Produk andalan Anda</h1><p class="lead">Mulai dari <b>3-5 produk utama</b> saja. HPP bisa diisi nanti lewat kalkulator.</p><form id="formOnb2"><div class="prod-head"><span>PRODUK</span><span>HARGA JUAL</span><span>HPP</span></div><div id="onbRows">' + rows + '</div><button type="button" class="link" data-act="onb-addrow" style="margin:6px 0 4px">+ Tambah produk</button></form><div class="hint">Anda bisa mengubah semuanya nanti di Kalkulator HPP.</div>', 'Lanjut', 'Lewati, isi nanti'); }
    var o = function (ic2, t, s, k) { return '<button type="button" class="opt-card' + (UI.onb.data === k ? ' sel' : '') + '" data-onb="data" data-v="' + k + '"><span class="ic2">' + ic(ic2) + '</span><b>' + t + '</b><small>' + s + '</small></button>'; };
    return onbWrap(3, 'Data penjualan', '<h1>Masukkan data penjualan</h1><p class="lead">Pilih cara paling ringan. Cukup 8 minggu data untuk diagnosis pertama.</p><div class="opt-grid">' + o('pen', 'Isi cepat', 'Ketik jumlah terjual per produk, 1 menit per hari.', 'cepat') + o('camera', 'Foto nota', 'Foto nota, lalu ketik isinya.', 'foto') + o('upload', 'Impor Excel / CSV', 'Unggah rekap penjualan yang sudah ada.', 'impor') + o('spark', 'Data contoh', '8 minggu data contoh untuk mencoba semua fitur.', 'contoh') + '</div><div class="hint" style="margin-top:12px">Data Anda hanya dipakai untuk analisis akun ini. Data contoh bisa dihapus kapan saja.</div>', 'Selesai, masuk ke beranda', 'Mulai kosong dulu');
  };

  /* ================= render & routing ================= */
  var ROUTES = { '/': 'beranda', '/diagnosis': 'diagnosis', '/analitik': 'analitik', '/stok': 'stok', '/hpp': 'hpp', '/catat': 'catat', '/roadmap': 'roadmap', '/akun': 'akun' };
  var NAV = [
    { id: 'beranda', path: '/', label: 'Beranda', icon: 'home', tab: 1 }, { id: 'analitik', path: '/analitik', label: 'Analitik', icon: 'chart', tab: 1 },
    { id: 'stok', path: '/stok', label: 'Rekomendasi stok', short: 'Stok', icon: 'box', tab: 1 }, { id: 'hpp', path: '/hpp', label: 'Kalkulator HPP', short: 'HPP', icon: 'hpp', tab: 1 },
    { id: 'catat', path: '/catat', label: 'Catat penjualan', icon: 'plus' }, { id: 'roadmap', path: '/roadmap', label: 'Roadmap usaha', icon: 'flag' }, { id: 'akun', path: '/akun', label: 'Akun', icon: 'user', tab: 1, tabOnly: 1 }
  ];
  var TITLES = { beranda: 'Beranda', diagnosis: 'Diagnosis', analitik: 'Analitik', stok: 'Rekomendasi stok', hpp: 'Kalkulator HPP', catat: 'Catat penjualan', roadmap: 'Roadmap usaha', akun: 'Akun', daftar: 'Daftar gratis', masuk: 'Masuk', onboarding: 'Mulai' };
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
  }
  function renderChrome(act) {
    var d = D(); if (!d) return;
    $('#sideNav').innerHTML = NAV.filter(function (n) { return !n.tabOnly; }).map(function (n) { return '<a href="#' + n.path + '"' + (n.id === act ? ' aria-current="page"' : '') + '>' + ic(n.icon) + n.label + '</a>'; }).join('');
    $('#tabbar').innerHTML = NAV.filter(function (n) { return n.tab; }).map(function (n) { return '<a class="tab" href="#' + n.path + '"' + (n.id === act ? ' aria-current="page"' : '') + '>' + ic(n.icon, n.id === act ? 2.2 : 1.8) + '<span>' + (n.short || n.label) + '</span></a>'; }).join('');
    $('.m-top .avatar').textContent = initials(d.user.nama);
    var tl = trialLeft(), pc = $('#proCard'); pc.innerHTML = d.user.paket === 'pro_trial' ? '<b>KLINIK PRO</b><span>' + (tl > 0 ? 'Uji coba · sisa ' + tl + ' hari' : 'Uji coba selesai') + '</span>' : '<b>PAKET GRATIS</b><span>Rp0</span>';
  }
  function render(keepScroll) {
    var p = path(), v = $('#view'), y = window.scrollY, key, html, authMode = false;
    if (p === '/masuk' || p === '/daftar') { key = p.slice(1); html = V[key](); authMode = true; }
    else if (p.indexOf('/onboarding/') === 0) { key = 'onboarding'; html = V.onboarding(+p.split('/')[2] || 1); authMode = true; }
    else { key = ROUTES[p] || 'beranda'; html = V[key](); }
    document.body.classList.toggle('noshell', authMode);
    v.innerHTML = html; v.classList.remove('view-in'); void v.offsetWidth; if (!keepScroll) v.classList.add('view-in');
    if (!authMode) renderChrome(key === 'diagnosis' ? 'beranda' : key);
    document.title = (TITLES[key] || 'laku.ai') + ' · laku.ai';
    window.scrollTo(0, keepScroll ? y : 0);
  }
  window.addEventListener('hashchange', route);

  /* ================= aksi ================= */
  function showErr(msg) { var e = $('#authErr'); if (e) { e.textContent = msg; e.hidden = false; } else toast(msg); }
  function busy(btn, on, txt) { if (!btn) return; if (on) { btn.dataset.t = btn.textContent; btn.textContent = txt || 'Memproses…'; btn.disabled = true; } else { btn.textContent = btn.dataset.t || btn.textContent; btn.disabled = false; } }

  function afterAuth(res) { St.token = res.token; setToken(res.token); St.data = res.data; UI.hpp = null; UI.onb = { outlet: '1 outlet', omzet: '', lama: '', kanal: [] }; route(); }   // route() mengarahkan lewat redirect (satu render)
  document.addEventListener('submit', function (e) {
    var f = e.target, id = f.id; if (!id) return; e.preventDefault();
    var fd = function (n) { return f.elements[n] ? f.elements[n].value : ''; }, btn = $('button[type=submit]', f);
    if (id === 'formDaftar') {
      if (!f.elements.setuju.checked) return showErr('Centang persetujuan penggunaan data untuk melanjutkan.');
      busy(btn, true, 'Mendaftar…');
      Api.call({ action: 'register', nama: fd('nama'), usaha: fd('usaha'), jenis: fd('jenis'), wa: fd('wa'), kota: fd('kota'), email: fd('email'), password: fd('password') }).then(afterAuth, function (er) { busy(btn, false); showErr(er.message); });
    } else if (id === 'formMasuk') {
      busy(btn, true, 'Masuk…');
      Api.call({ action: 'login', email: fd('email'), password: fd('password') }).then(afterAuth, function (er) { busy(btn, false); showErr(er.message); });
    } else if (id === 'saleForm') {
      var q = +fd('qty'), h = +fd('harga'), tg = fd('tanggal'); if (!(q > 0) || !(h >= 0) || !tg) return toast('Isi jumlah dan harga dengan benar.');
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
    var s = Seed.make(today()), chunks = [], rows = s.penjualan;
    for (var i = 0; i < rows.length; i += 350) chunks.push(rows.slice(i, i + 350));
    var first = s.produk.map(function (p) { return prodOp(p, true); }).concat([{ op: 'promosi.add', rows: s.promosi }, { op: 'hargabahan.add', rows: s.hargaBahan }]);
    var chain = persist(first); chunks.forEach(function (c) { chain = chain.then(function () { return persist([{ op: 'penjualan.add', rows: c }]); }); });
    chain.then(reload).then(function () { UI.busy = false; UI.hpp = null; toast('Data contoh siap: ' + rows.length + ' catatan penjualan'); if (path().indexOf('/onboarding/') === 0) finishOnboarding('/'); else render(); }, function () { UI.busy = false; busy(btn, false); });
  }
  function finishOnboarding(dest) { persist([{ op: 'usaha.update', fields: { onboarding: 'selesai' } }]).then(function () { D().usaha.onboarding = 'selesai'; navigate(dest); }); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act],[data-ct],[data-seg],[data-period],[data-pick],[data-hpp-pid],[data-rm],[data-deltx],[data-delpromo],[data-chk],[data-pref],[data-onb],[data-step]');
    if (!t) return; var ds = t.dataset, act = ds.act, d = D();
    if (ds.onb) { var g = ds.onb, v = ds.v; if (g === 'kanal') { var i = UI.onb.kanal.indexOf(v); if (i >= 0) UI.onb.kanal.splice(i, 1); else UI.onb.kanal.push(v); } else UI.onb[g] = (UI.onb[g] === v && g !== 'data') ? '' : v; return render(true); }
    if (ds.ct) { UI.cat = ds.ct; return render(true); }
    if (ds.seg) { UI.seg = ds.seg; return render(true); }
    if (ds.period) { UI.period = +ds.period; return render(true); }
    if (ds.hppPid) { hppInit(ds.hppPid); return render(true); }
    if (ds.pick !== undefined) { UI.hpp.pick = +ds.pick; $('#hppRight').innerHTML = hppRight(); return; }
    if (ds.rm !== undefined) { var h = UI.hpp, p = prodById(h.pid); h.items.splice(+ds.rm, 1); saveBahan(p); return render(true); }
    if (ds.deltx) { var tx = d.penjualan.filter(function (x) { return x.id === ds.deltx; })[0]; d.penjualan = d.penjualan.filter(function (x) { return x.id !== ds.deltx; }); persist([{ op: 'penjualan.delete', ids: [ds.deltx] }]).catch(function () { d.penjualan.push(tx); render(true); }); return render(true); }
    if (ds.delpromo) { d.promosi = d.promosi.filter(function (x) { return x.id !== ds.delpromo; }); persist([{ op: 'promosi.delete', id: ds.delpromo }]); return render(true); }
    if (ds.chk) { d.usaha.prefs[ds.chk] = !d.usaha.prefs[ds.chk]; persist([{ op: 'usaha.update', fields: { prefs: d.usaha.prefs } }]); return render(true); }
    if (ds.pref) { var cur = ds.pref === 'alert' ? d.usaha.prefs.alert !== false : !!d.usaha.prefs[ds.pref]; d.usaha.prefs[ds.pref] = !cur; persist([{ op: 'usaha.update', fields: { prefs: d.usaha.prefs } }]); return render(true); }
    if (ds.step) { UI.edit.q = Math.max(0, (+UI.edit.q || 0) + (+ds.step)); return render(true); }
    switch (act) {
      case 'follow': { var pp = A.compute(d, { today: today() }).prods.filter(function (x) { return x.id === ds.id; })[0], row = { id: uid('k'), tipe: 'stok', produkId: pp.id, saran: pp.saran, tindakan: 'ikuti', nilaiAkhir: pp.saran, waktu: new Date().toISOString() }; d.keputusan.push(row); persist([{ op: 'keputusan.add', row: row }]); render(true); return toast('Saran ' + pp.nama + ' diikuti: ' + pp.saran + ' ' + pp.satuan); }
      case 'edit': { var p3 = A.compute(d, { today: today() }).prods.filter(function (x) { return x.id === ds.id; })[0]; UI.edit = { id: ds.id, q: p3.saran }; return render(true); }
      case 'undo': { UI.edit = null; d.keputusan = d.keputusan.filter(function (k) { return !(k.produkId === ds.id && k.tipe === 'stok' && k.waktu.slice(0, 10) >= A.mondayOf(today())); }); return render(true); }
      case 'save-edit': { var pe = A.compute(d, { today: today() }).prods.filter(function (x) { return x.id === ds.id; })[0], q = Math.max(0, +UI.edit.q || 0), r2 = { id: uid('k'), tipe: 'stok', produkId: ds.id, saran: pe.saran, tindakan: 'ubah', nilaiAkhir: q, waktu: new Date().toISOString() }; d.keputusan.push(r2); UI.edit = null; persist([{ op: 'keputusan.add', row: r2 }]); render(true); return toast('Jumlah produksi disimpan'); }
      case 'add-prod': UI.addProd = true; return render(true);
      case 'cancel-prod': UI.addProd = false; return render(true);
      case 'add-ing': { var hh = UI.hpp; hh.items.push({ id: 'm_' + uid('x').slice(2), nama: '', harga: 0 }); render(true); var ni = $('[data-nm="' + (hh.items.length - 1) + '"]'); if (ni) ni.focus(); return; }
      case 'save-price': { var c = hppCalc(), pr = c.p, oldB = pr.bahan.slice(); pr.harga = c.np; pr.hpp = c.total; syncBahan(pr); logBahan(pr, oldB); UI.hpp.pick = 0; persist([prodOp(pr, UI.hpp.items.length > 0)]); render(true); return toast('Harga baru ' + rp(c.np) + ' disimpan · margin ' + c.mg(c.np) + '%'); }
      case 'del-prod': { var pd = prodById(UI.hpp.pid); if (!confirm('Hapus produk "' + pd.nama + '"? Catatan penjualannya tetap tersimpan.')) return; d.produk = d.produk.filter(function (x) { return x.id !== pd.id; }); persist([{ op: 'produk.delete', id: pd.id }]); UI.hpp = null; return render(true); }
      case 'nota-row': UI.notaRows = Math.min(15, UI.notaRows + 1); return render(true);
      case 'seed': return seedSample(t);
      case 'print': return window.print();
      case 'showpw': { var inp = t.parentNode.querySelector('input'); inp.type = inp.type === 'password' ? 'text' : 'password'; t.textContent = inp.type === 'password' ? 'Lihat' : 'Sembunyi'; return; }
      case 'logout': Api.call({ action: 'logout', token: St.token }).catch(function () { }); return forceLogout();
      case 'export': { try { var b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'data-laku-ai.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); } catch (er) { toast('Tidak bisa mengunduh di perangkat ini'); } return; }
      case 'del-sample': { if (!confirm('Hapus semua data contoh? Produk dan penjualan yang Anda input sendiri tidak ikut terhapus.')) return; persist([{ op: 'contoh.hapus' }]).then(reload).then(function () { UI.hpp = null; toast('Data contoh dihapus'); render(true); }); return; }
      case 'del-account': { var pw = prompt('Hapus akun dan SEMUA data secara permanen.\nKetik kata sandi Anda untuk melanjutkan:'); if (!pw) return; Api.call({ action: 'hapusAkun', token: St.token, password: pw }).then(function () { forceLogout('Akun dan data telah dihapus.'); }, function (er) { toast(er.message); }); return; }
      case 'install': if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } else toast('Buka menu browser, lalu pilih "Instal aplikasi" atau "Tambahkan ke layar utama".', 4500); return;
      case 'onb-back': { var cs = +path().split('/')[2]; navigate('/onboarding/' + Math.max(1, cs - 1)); return; }
      case 'onb-addrow': { var rws = $('#onbRows'), n = rws.children.length; if (n >= 8) return; var dv = document.createElement('div'); dv.className = 'prod-row'; dv.innerHTML = '<input name="n' + n + '" placeholder="Nama produk" maxlength="60"><input name="h' + n + '" type="number" inputmode="numeric" min="0" placeholder="Harga jual"><input name="c' + n + '" type="number" inputmode="numeric" min="0" placeholder="HPP">'; rws.appendChild(dv); return; }
      case 'onb-skip': { var st = +path().split('/')[2]; if (st === 2) { persist([{ op: 'usaha.update', fields: { onboarding: 'data' } }]).then(function () { D().usaha.onboarding = 'data'; navigate('/onboarding/3'); }); } else finishOnboarding('/'); return; }
      case 'onb-next': return onbNext(t);
    }
  });
  function onbNext(btn) {
    var step = +path().split('/')[2], o = UI.onb;
    if (step === 1) {
      var kanal = o.kanal.map(function (l) { return (KANAL.filter(function (k) { return k[1] === l; })[0] || [])[0]; }).filter(Boolean), f = { outlet: o.outlet, omzetRange: o.omzet, lamaUsaha: o.lama, kanal: kanal, onboarding: 'produk' };
      persist([{ op: 'usaha.update', fields: f }]).then(function () { Object.assign(D().usaha, { outlet: o.outlet, omzetRange: o.omzet, lamaUsaha: o.lama, kanal: kanal, onboarding: 'produk' }); navigate('/onboarding/2'); });
    } else if (step === 2) {
      var form = $('#formOnb2'), made = [];
      for (var i = 0; i < $('#onbRows').children.length; i++) { var n = form.elements['n' + i].value.trim(); if (!n) continue; var h = +form.elements['h' + i].value || 0, c = +form.elements['c' + i].value || 0; made.push({ id: uid('p'), nama: n, satuan: 'pcs', harga: h, hpp: c, stok: 0, produksiLalu: 0, sumber: 'manual', bahan: [] }); }
      var ops = made.map(function (p) { return prodOp(p, false); }).concat([{ op: 'usaha.update', fields: { onboarding: 'data' } }]);
      busy(btn, true, 'Menyimpan…'); persist(ops).then(function () { D().produk = D().produk.concat(made); D().usaha.onboarding = 'data'; navigate('/onboarding/3'); }, function () { busy(btn, false); });
    } else {
      var sel = o.data; if (!sel) return showErr('Pilih salah satu cara memasukkan data, atau ketuk "Mulai kosong dulu".');
      if (sel === 'contoh') return seedSample(btn);
      UI.cat = sel; finishOnboarding('/catat');
    }
  }
  function syncBahan(p) { var h = UI.hpp; if (h && h.pid === p.id && h.items.length) { p.bahan = h.items.filter(function (x) { return x.nama.trim(); }).map(function (x) { return { id: x.id, nama: x.nama.trim(), harga: +x.harga || 0 }; }); p.hpp = p.bahan.reduce(function (a, b) { return a + b.harga; }, 0); } }
  function saveBahan(p) {
    var oldB = p.bahan.slice(); syncBahan(p); if (!UI.hpp.items.length) { p.bahan = []; }
    logBahan(p, oldB); persist([prodOp(p, true)]);
  }

  /* input & change */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.p !== undefined) { var it = UI.hpp.items[+t.dataset.p], raw = parseInt(String(t.value).replace(/\D/g, ''), 10) || 0; it.harga = raw; t.value = raw ? raw.toLocaleString('id-ID') : ''; $('#hppTotal').textContent = rp(hppCalc().total); $('#hppRight').innerHTML = hppRight(); }
    else if (t.dataset.nm !== undefined) UI.hpp.items[+t.dataset.nm].nama = t.value;
    else if (t.hasAttribute && t.hasAttribute('data-q') && UI.edit) UI.edit.q = Math.max(0, +t.value || 0);
  });
  document.addEventListener('change', function (e) {
    var t = e.target, d = D();
    if (t.dataset.p !== undefined || t.dataset.nm !== undefined) { saveBahan(prodById(UI.hpp.pid)); return render(true); }
    if (t.hasAttribute('data-hpp-direct')) { var pd = prodById(UI.hpp.pid); pd.hpp = Math.max(0, +t.value || 0); persist([prodOp(pd, false)]); return render(true); }
    if (t.dataset.stok) { var p = prodById(t.dataset.stok); p.stok = Math.max(0, +t.value || 0); persist([prodOp(p, false)]); return render(true); }
    if (t.dataset.lalu) { var p2 = prodById(t.dataset.lalu); p2.produksiLalu = Math.max(0, +t.value || 0); persist([prodOp(p2, false)]); return render(true); }
    if (t.id === 'saleProd') { var o = t.options[t.selectedIndex]; $('#saleHarga').value = o.dataset.h; return; }
    if (t.id === 'nota' && t.files && t.files[0]) { try { UI.notaImg = URL.createObjectURL(t.files[0]); } catch (er) { } return render(true); }
    if (t.id === 'csv' && t.files && t.files[0]) {
      var fr = new FileReader(); fr.onload = function () { importCsv(String(fr.result)); t.value = ''; }; fr.readAsText(t.files[0]);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches && e.target.matches('input.p')) e.target.blur(); });
  function importCsv(text) {
    var lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(function (l) { return l.trim(); }), sep = (lines[0] || '').indexOf(';') >= 0 && lines[0].indexOf(',') < 0 ? ';' : (lines[0].indexOf('\t') >= 0 ? '\t' : ',');
    var cells = lines.map(function (l) { return l.split(sep).map(function (c) { return c.trim().replace(/^"|"$/g, ''); }); }), head = cells[0].map(function (c) { return c.toLowerCase(); }), hasHead = isNaN(+cells[0][1]);
    var col = { produk: 0, jumlah: 1, harga: 2, tanggal: 3 }; if (hasHead) { ['produk', 'jumlah', 'harga', 'tanggal'].forEach(function (k) { var i = head.findIndex(function (h) { return h === k || (k === 'jumlah' && (h === 'qty' || h === 'jml')); }); if (i >= 0) col[k] = i; }); cells.shift(); }
    var rows = [], skipped = 0, byName = {}; D().produk.forEach(function (p) { byName[p.nama.toLowerCase()] = p; });
    cells.forEach(function (c) { var p = byName[String(c[col.produk] || '').toLowerCase()], q = +String(c[col.jumlah] || '').replace(/[^\d.]/g, ''), tg = /^\d{4}-\d{2}-\d{2}$/.test(c[col.tanggal] || '') ? c[col.tanggal] : today(); if (!p || !(q > 0)) { skipped++; return; } var h = c[col.harga] ? +String(c[col.harga]).replace(/[^\d]/g, '') : p.harga; rows.push({ id: uid('t'), tanggal: tg, jam: '12:00', produkId: p.id, qty: q, harga: h || p.harga, kanal: 'toko', sumber: 'impor' }); });
    if (!rows.length) return toast('Tidak ada baris valid. Pakai kolom: produk, jumlah, harga, tanggal.', 4500);
    var chain = Promise.resolve(); for (var i = 0; i < rows.length; i += 500) (function (c) { chain = chain.then(function () { return persist([{ op: 'penjualan.add', rows: c }]); }); })(rows.slice(i, i + 500));
    chain.then(function () { D().penjualan = D().penjualan.concat(rows); UI.cat = 'cepat'; render(true); toast(rows.length + ' baris diimpor' + (skipped ? ', ' + skipped + ' dilewati (produk tidak dikenal)' : '')); });
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) window.addEventListener('load', function () { navigator.serviceWorker.register('../sw.js', { scope: './' }).catch(function () { }); });

  /* ================= boot ================= */
  function boot() {
    var tk = getToken(); St.token = tk;
    if (!tk) return route();
    $('#view').innerHTML = '<div class="boot"><div class="spin"></div><p>Memuat data…</p></div>'; document.body.classList.add('noshell');
    Api.call({ action: 'load', token: tk }).then(function (d) { St.data = d; route(); }, function (er) {
      if (er.code === 'auth') { setToken(null); St.token = null; return route(); }
      $('#view').innerHTML = '<div class="boot"><p>' + esc(er.message) + '</p><button class="btn btn-red" onclick="location.reload()">Coba lagi</button></div>';
    });
  }
  boot();
})();
