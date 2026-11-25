/* laku.ai — mockup v2: akun, onboarding, dashboard & analitik kaya, skema database (Google Sheets).
   Layar dirender dari ?s=<nama>. Semua angka adalah DATA CONTOH yang konsisten dengan deck (omzet Rp12,4 jt, margin 34%, skor 72). */
(function () {
  'use strict';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var S = new URLSearchParams(location.search).get('s') || 'dashboard';

  var ICON = {
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    chart: '<path d="M4 20V11M10 20V4M16 20v-6M22 20H2"/>',
    box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5"/><path d="M12 12v9"/>',
    hpp: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>', sheet: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>'
  };
  var ic = function (n, sw) { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; };
  var mw = function (m, w) { return '<div class="m">' + m + '</div><div class="w">' + w + '</div>'; };
  var wm = function (sz) { return '<span class="wordmark"' + (sz ? ' style="font-size:' + sz + 'px"' : '') + '><span>laku</span><i>.ai</i></span>'; };
  var rp = function (n) { return 'Rp' + Math.round(n).toLocaleString('id-ID'); };
  var fx = function (n, d) { return n.toFixed(d == null ? 1 : d).replace('.', ','); };

  /* ---------- shell aplikasi ---------- */
  var NAV = [
    { id: 'dashboard', label: 'Beranda', icon: 'home', href: 'screen.html?s=dashboard', tab: 1 },
    { id: 'analitik', label: 'Analitik', icon: 'chart', href: 'screen.html?s=analitik', tab: 1 },
    { id: 'stok', label: 'Rekomendasi stok', short: 'Stok', icon: 'box', href: '../app/#/stok', tab: 1 },
    { id: 'hpp', label: 'Kalkulator HPP', short: 'HPP', icon: 'hpp', href: '../app/#/hpp', tab: 1 },
    { id: 'catat', label: 'Catat penjualan', icon: 'plus', href: '../app/#/catat' },
    { id: 'roadmap', label: 'Roadmap usaha', icon: 'flag', href: '../app/#/roadmap' },
    { id: 'akun', label: 'Akun', icon: 'user', href: '../app/#/akun', tab: 1, tabOnly: 1 }
  ];
  function shell(active, body, user) {
    user = user || { ini: 'BS', name: 'Dapur Bu Sari', meta: 'Frozen food · Malang', plan: 'Aktif · uji coba 14 hari', pro: 1 };
    var side = NAV.filter(function (n) { return !n.tabOnly; }).map(function (n) { return '<a href="' + n.href + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + ic(n.icon) + n.label + '</a>'; }).join('');
    var tabs = NAV.filter(function (n) { return n.tab; }).map(function (n) { return '<a class="tab" href="' + n.href + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + ic(n.icon, n.id === active ? 2.2 : 1.8) + '<span>' + (n.short || n.label) + '</span></a>'; }).join('');
    var pro = user.pro ? '<div class="pro-card"><b>KLINIK PRO</b><span>' + user.plan + '</span></div>' : '<div class="pro-card" style="background:var(--pink);color:var(--ink)"><b style="color:var(--red)">PAKET GRATIS</b><span>Buka diagnosis dengan Pro</span></div>';
    return '<div class="app"><aside class="side">' + '<a class="wordmark" href="index.html">' + '<span>laku</span><i>.ai</i></a><nav class="side-nav">' + side + '</nav>' + pro + '</aside>' +
      '<main class="main"><div class="m-top"><a class="wordmark" href="index.html"><span>laku</span><i>.ai</i></a><a class="avatar" href="#">' + user.ini + '</a></div>' + body + '</main><nav class="tabbar">' + tabs + '</nav></div>';
  }
  function head(eM, tM, eW, tW, user, extra, greet) {
    user = user || { ini: 'BS', name: 'Dapur Bu Sari', meta: 'Frozen food · Malang' };
    return '<div class="pagehead"><div>' +
      (greet ? '<div class="eyebrow m">' + eM + '</div><h1 class="h1 m">' + tM + '</h1>' : '<h1 class="h1 m">' + tM + '</h1><div class="eyebrow m">' + eM + '</div>') +
      '<div class="eyebrow w">' + eW + '</div><h1 class="h1 w">' + tW + '</h1></div>' +
      '<div class="who w">' + (extra || '') + '<div><b>' + user.name + '</b><small>' + user.meta + '</small></div><a class="avatar" href="#">' + user.ini + '</a></div></div>';
  }

  /* ---------- grafik ---------- */
  function donut(score, size) {
    var r = 48, c = 2 * Math.PI * r;
    return '<div class="donut"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#ECEFF1" stroke-width="13"/><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#D32F2F" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + (c * score / 100).toFixed(1) + ' ' + c.toFixed(1) + '"/></svg><div class="t"><b>' + score + '</b><small>dari 100</small></div></div>';
  }
  function spark(pts, color) {
    var w = 84, h = 26, mn = Math.min.apply(0, pts), mx = Math.max.apply(0, pts), rg = (mx - mn) || 1;
    var p = pts.map(function (v, i) { return (i * w / (pts.length - 1)).toFixed(1) + ',' + (h - 3 - (v - mn) / rg * (h - 6)).toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + p + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function lineCompare() {
    var W = 760, H = 260, pl = 34, pr = 16, pt = 22, pb = 30, mn = 1.8, mx = 3.8, n = 9;
    var cur = [2.4, 2.5, 2.7, 2.6, 2.6, 2.9, 2.8, 3.3], prev = [2.2, 2.3, 2.4, 2.5, 2.4, 2.6, 2.6, 2.7];
    var x = function (i) { return pl + i * (W - pl - pr) / (n - 1); }, y = function (v) { return pt + (mx - v) / (mx - mn) * (H - pt - pb); };
    var pts = function (a) { return a.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' '); };
    var grid = [2, 2.5, 3, 3.5].map(function (g) { return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="#ECEFF1"/><text x="' + (pl - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="11" fill="#90A4AE">' + fx(g) + '</text>'; }).join('');
    var band = '<polygon points="' + x(7) + ',' + y(3.3) + ' ' + x(8) + ',' + y(3.7) + ' ' + x(8) + ',' + y(3.1) + '" fill="#D32F2F" opacity=".12"/>';
    var fc = '<line x1="' + x(7) + '" y1="' + y(3.3) + '" x2="' + x(8) + '" y2="' + y(3.4) + '" stroke="#D32F2F" stroke-width="2.5" stroke-dasharray="5 5"/><circle cx="' + x(8) + '" cy="' + y(3.4) + '" r="5" fill="#fff" stroke="#D32F2F" stroke-width="2.5"/><text x="' + x(8) + '" y="' + (y(3.7) - 8) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#D32F2F">3,4</text>';
    var tgt = '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(3.5) + '" y2="' + y(3.5) + '" stroke="#263238" stroke-dasharray="4 5" opacity=".7"/><text x="' + (W - pr) + '" y="' + (y(3.5) - 6) + '" text-anchor="end" font-size="11" fill="#263238">Target Rp3,5 jt per minggu</text>';
    var dots = cur.map(function (v, i) { return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.6" fill="#D32F2F"/>'; }).join('');
    var xl = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#90A4AE">M' + (i + 1) + '</text>'; }).join('') + '<text x="' + x(8) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#D32F2F" font-weight="600">M9 est.</text>';
    return '<svg class="svgfull" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Omzet mingguan 8 minggu dibanding periode sebelumnya, dengan perkiraan minggu ke-9 sebesar 3,4 juta rupiah">' + grid + tgt + '<polyline points="' + pts(prev) + '" fill="none" stroke="#B0BEC5" stroke-width="2.5" stroke-linejoin="round"/>' + band + '<polyline points="' + pts(cur) + '" fill="none" stroke="#D32F2F" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' + dots + fc + xl + '</svg>';
  }
  function dailyBars() {
    var w = [.7, .7, .8, .9, 1.3, 1.6, 1.4], days = 30, vals = [], sum = 0, i;
    for (i = 0; i < days; i++) { var v = w[i % 7] * (1 + ((i * 37) % 11 - 5) / 40); vals.push(v); sum += v; }
    var k = 12.4 / sum; vals = vals.map(function (v) { return v * k; });
    var mx = Math.max.apply(0, vals), W = 760, H = 190, bw = (W - 20) / days;
    var bars = vals.map(function (v, i) { var h = v / mx * (H - 44), wk = (i % 7) >= 4; return '<rect x="' + (10 + i * bw + 2) + '" y="' + (H - 22 - h) + '" width="' + (bw - 4) + '" height="' + h + '" rx="3" fill="' + (wk ? '#D32F2F' : '#B0BEC5') + '"/>'; }).join('');
    var lab = [0, 6, 13, 20, 27].map(function (i) { return '<text x="' + (10 + i * bw + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="#90A4AE">' + (i + 1) + ' Okt</text>'; }).join('');
    return '<svg class="svgfull" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Omzet harian 30 hari, akhir pekan lebih tinggi">' + bars + lab + '</svg><div class="legend"><span><i style="background:#D32F2F"></i>Jumat-Minggu</span><span><i style="background:#B0BEC5"></i>Senin-Kamis</span></div>';
  }
  function heatmap() {
    var D = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    var R = [['Pagi', '06-10', [.1, .1, .15, .15, .3, .4, .35]], ['Siang', '10-14', [.35, .35, .4, .45, .7, .9, .8]], ['Sore', '14-18', [.3, .3, .35, .4, .8, 1, .85]], ['Malam', '18-22', [.15, .15, .2, .25, .55, .6, .5]]];
    var h = '<div class="heat"><span></span>' + D.map(function (d) { return '<span class="h">' + d + '</span>'; }).join('');
    R.forEach(function (r) { h += '<span class="r">' + r[0] + '</span>' + r[2].map(function (v) { return '<span class="c" style="background:rgba(211,47,47,' + (0.08 + v * .92).toFixed(2) + ');color:' + (v > .45 ? '#fff' : '#B0BEC5') + '">' + (v >= .9 ? 'Puncak' : '') + '</span>'; }).join(''); });
    return h + '</div><div class="heat-scale">Sepi <span></span> Ramai</div>';
  }
  function channelDonut() {
    var seg = [['Toko sendiri', 46, '#D32F2F'], ['WhatsApp', 28, '#263238'], ['Reseller', 18, '#90A4AE'], ['GoFood / Shopee', 8, '#CFD8DC']];
    var r = 48, c = 2 * Math.PI * r, off = 0, arcs = seg.map(function (s) { var len = c * s[1] / 100, a = '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + s[2] + '" stroke-width="18" stroke-dasharray="' + len.toFixed(1) + ' ' + (c - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '"/>'; off += len; return a; }).join('');
    return '<div class="donut-row"><svg viewBox="0 0 120 120" style="width:118px;height:118px;transform:rotate(-90deg)" role="img" aria-label="Kanal penjualan">' + arcs + '</svg><div class="dleg">' + seg.map(function (s) { return '<div><i style="background:' + s[2] + '"></i>' + s[0] + '<b>' + s[1] + '%</b></div>'; }).join('') + '</div></div>';
  }
  function marginBars() {
    var P = [['Risol Mayo', 41], ['Nugget Sayur', 36], ['Lumpia Udang', 33], ['Siomay Ikan', 31], ['Dimsum Ayam', 21]];
    return P.map(function (p) { return '<div class="mbar"><span>' + p[0] + '</span><div class="tr"><i class="' + (p[1] < 25 ? 'low' : '') + '" style="width:' + (p[1] / 50 * 100) + '%"></i><u style="left:' + (35 / 50 * 100) + '%"></u></div><b>' + p[1] + '%</b></div>'; }).join('') + '<div class="mbar-note">Garis merah = target margin 35%. Rata-rata tertimbang 34%.</div>';
  }
  function scatter() {
    var W = 440, H = 300, pl = 40, pr = 14, pt = 14, pb = 38, xmax = 45, ymin = 15, ymax = 45;
    var x = function (v) { return pl + v / xmax * (W - pl - pr); }, y = function (v) { return pt + (ymax - v) / (ymax - ymin) * (H - pt - pb); };
    var pts = [['Risol Mayo', 38, 41, 1], ['Nugget Sayur', 18, 36], ['Lumpia', 8, 33], ['Siomay Ikan', 12, 31], ['Dimsum Ayam', 24, 21, 2]];
    var q = [['Potensi', pl + 8, pt + 16], ['Bintang', W - pr - 8, pt + 16, 1], ['Pantau', pl + 8, H - pb - 8], ['Naikkan margin', W - pr - 8, H - pb - 8, 1]]
      .map(function (t) { return '<text x="' + t[1] + '" y="' + t[2] + '" text-anchor="' + (t[3] ? 'end' : 'start') + '" font-size="11" font-weight="700" fill="#B0BEC5" letter-spacing=".6">' + t[0].toUpperCase() + '</text>'; }).join('');
    var d = pts.map(function (p) { var col = p[3] === 2 ? '#D32F2F' : (p[3] === 1 ? '#263238' : '#78909C'); var anchor = p[1] > 30 ? 'end' : 'start', dx = p[1] > 30 ? -11 : 11; return '<circle cx="' + x(p[1]) + '" cy="' + y(p[2]) + '" r="7" fill="' + col + '"/><text x="' + (x(p[1]) + dx) + '" y="' + (y(p[2]) + 4) + '" text-anchor="' + anchor + '" font-size="12" font-weight="600" fill="#263238">' + p[0] + '</text>'; }).join('');
    return '<svg class="svgfull" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Matriks produk: kontribusi omzet terhadap margin">' +
      '<rect x="' + x(20) + '" y="' + pt + '" width="' + (W - pr - x(20)) + '" height="' + (y(35) - pt) + '" fill="#FDECEA" opacity=".55" rx="6"/>' +
      '<line x1="' + x(20) + '" x2="' + x(20) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="#CFD8DC" stroke-dasharray="4 4"/><line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(35) + '" y2="' + y(35) + '" stroke="#CFD8DC" stroke-dasharray="4 4"/>' +
      q + d + '<text x="' + ((pl + W - pr) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#78909C">Kontribusi omzet (%) →</text><text transform="translate(12 ' + (H / 2) + ') rotate(-90)" text-anchor="middle" font-size="11" fill="#78909C">Margin (%) →</text></svg>';
  }
  function coverRows() {
    var P = [['Risol Mayo', 3, 'r', 'Rawan habis'], ['Nugget Sayur', 5, '', 'Aman'], ['Dimsum Ayam', 5, '', 'Aman'], ['Lumpia Udang', 6, '', 'Aman'], ['Siomay Ikan', 14, 'g', 'Menumpuk']];
    return P.map(function (p) { return '<div class="cov"><span>' + p[0] + '</span><div class="tr"><i class="' + p[2] + '" style="width:' + Math.min(100, p[1] / 14 * 100) + '%"></i></div><span class="badge ' + (p[2] === 'r' ? 'b-pink' : (p[2] === 'g' ? 'b-gray' : 'b-ok')) + '" style="font-size:11.5px;padding:3px 10px">' + p[1] + ' hari · ' + p[3] + '</span></div>'; }).join('') + '<div class="mbar-note">Cakupan stok = sisa stok ÷ rata-rata penjualan harian. Ideal 4-7 hari.</div>';
  }
  function priceRows() {
    var P = [['Daging ayam 500 g', [19.6, 19.6, 20, 20.8, 21.5, 22], '+12%', 1], ['Kemasan', [2.4, 2.4, 2.5, 2.5, 2.5, 2.5], '+4%'], ['Kulit dan tepung', [6.3, 6.3, 6.4, 6.4, 6.5, 6.5], '+3%'], ['Bumbu', [3, 3, 3, 3, 3, 3], '0%'], ['Gas dan listrik', [1.5, 1.5, 1.5, 1.5, 1.5, 1.5], '0%']];
    return P.map(function (p) { return '<div class="pr-row"><span>' + p[0] + '</span>' + spark(p[1], p[3] ? '#D32F2F' : '#78909C') + '<b class="' + (p[3] ? 'up2' : '') + '">' + p[2] + '</b></div>'; }).join('') + '<div class="mbar-note">Perubahan harga bahan 6 bulan terakhir dari kalkulator HPP.</div>';
  }
  function promoTable() {
    return '<table class="mini"><thead><tr><th>Promosi</th><th>Omzet vs biasa</th><th></th></tr></thead><tbody>' +
      '<tr><td><b>Diskon Risol Mayo Jumat</b><br><span class="sub">3 minggu</span></td><td><b style="color:#2E7D32">▲ 18%</b></td><td><span class="badge b-ok">Berhasil</span></td></tr>' +
      '<tr><td><b>Gratis ongkir via WhatsApp</b><br><span class="sub">2 minggu</span></td><td><b style="color:#2E7D32">▲ 9%</b></td><td><span class="badge b-gray">Cukup</span></td></tr>' +
      '<tr><td><b>Bundling Dimsum + Siomay</b><br><span class="sub">2 minggu</span></td><td><b>▲ 3%</b></td><td><span class="badge b-pink">Kurang efektif</span></td></tr></tbody></table>';
  }
  function insights() {
    var I = [
      ['', 'Margin Dimsum Ayam turun ke 21%', 'Harga daging ayam naik <b>12%</b> sejak bulan lalu, harga jual belum berubah. Data: HPP Rp35.500 vs harga Rp45.000.', 'Hitung ulang HPP →'],
      ['', 'Risol Mayo berisiko habis lagi akhir pekan', 'Sabtu lalu stok habis <b>pukul 14.00</b> dan cakupan stok tinggal 3 hari. Saran produksi 120 pcs.', 'Lihat saran stok →'],
      ['info', 'Siomay Ikan menumpuk', 'Terjual rata-rata 18 pack per minggu, sisa 35 pack (<b>14 hari</b>). Kurangi produksi jadi 10 pack.', 'Lihat saran stok →'],
      ['ok', 'Promosi Jumat-Minggu terbukti efektif', 'Diskon Risol Mayo menaikkan omzet <b>18%</b>; 62% penjualannya terjadi Jumat-Minggu.', 'Lihat analitik promosi →']
    ];
    return I.map(function (i) { return '<div class="insight"><span class="dot ' + i[0] + '"></span><div><h4>' + i[1] + '</h4><p>' + i[2] + '</p><a class="link" href="#">' + i[3] + '</a></div></div>'; }).join('');
  }
  var card = function (inner, cls, style) { return '<div class="card ' + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '>' + inner + '</div>'; };
  var title = function (t, right) { return '<div class="sec-title"><h3>' + t + '</h3>' + (right || '') + '</div>'; };

  /* ---------- layar: dashboard (Beranda kaya) ---------- */
  function dashboard() {
    var K = [['Omzet Oktober', 'Rp12,4 jt', '▲ 8%', 'vs Sep'], ['Laba kotor', 'Rp4,2 jt', '▲ 4%', 'vs Sep'], ['Margin kotor', '34%', '▼ 3 poin', 'vs Sep', 1], ['Transaksi', '412', '▲ 5%', 'vs Sep'], ['Rata-rata per transaksi', 'Rp30.100', '▲ 3%', 'vs Sep'], ['Produk terjual', '1.186 pcs', '▲ 6%', 'vs Sep']];
    var kpi = K.map(function (k) { return card('<div class="label">' + k[0] + '</div><div class="big">' + k[1] + '</div><div class="d ' + (k[4] ? 'dn' : '') + '">' + k[2] + ' <span>' + k[3] + '</span></div>', 'kpi c2'); }).join('');
    var comp = [['Pertumbuhan omzet', 'Baik', 0], ['Margin kotor', 'Perlu dijaga', 1], ['Perputaran stok', 'Cukup', 0], ['Konsistensi pencatatan', 'Baik', 0]].map(function (c) { return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid var(--line);font-size:13.5px"><span>' + c[0] + '</span><b' + (c[2] ? ' style="color:var(--red)"' : '') + '>' + c[1] + '</b></div>'; }).join('');
    var body = head('Selamat pagi, Bu Sari', 'Dapur Bu Sari', 'Selamat pagi, Bu Sari · Oktober 2026', 'Ringkasan kesehatan usaha', null,
      '<select class="pill-select" aria-label="Periode"><option>Oktober 2026 ▾</option></select>', 1) +
      '<div class="dgrid">' + kpi +
      card('<div class="label">Skor kesehatan usaha</div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px"><div><h2 style="font-size:19px;margin:0 0 4px;white-space:nowrap">Cukup sehat</h2><div class="sub">Naik 4 poin dari bulan lalu</div><a class="chip-link" href="#">Lihat diagnosis</a></div>' + donut(72, 104) + '</div><div style="margin-top:10px">' + comp + '</div>', 'c4') +
      card(title('Insight AI minggu ini', '<span class="badge b-pink">4 temuan</span>') + insights(), 'c8') +
      card(title('Omzet mingguan vs periode lalu', '<span class="tag-contoh">data contoh</span>') + lineCompare() + '<div class="legend"><span><i style="background:#D32F2F"></i>8 minggu terakhir</span><span><i style="background:#B0BEC5"></i>Periode sebelumnya</span><span><i class="d"></i>Target</span><span><i style="background:#D32F2F;opacity:.3"></i>Perkiraan M9: Rp3,1-3,7 jt</span></div>', 'c8') +
      card(title('Target bulan ini') + '<div class="goal"><div class="row"><span>Omzet Rp12,4 jt dari Rp15 jt</span><b>83%</b></div><div class="track red"><i style="width:83%"></i></div><div class="sub" style="margin-top:8px">Perlu Rp2,6 jt lagi dalam 6 hari. Rata-rata harian saat ini Rp0,41 jt.</div></div>' +
        '<div class="goal" style="margin-top:18px"><div class="row"><span>Margin kotor 34% dari target 35%</span><b>97%</b></div><div class="track"><i style="width:97%"></i></div></div>' +
        '<div class="goal" style="margin-top:18px"><div class="row"><span>Kesiapan buka cabang</span><b>48%</b></div><div class="track"><i style="width:48%"></i></div><a class="link" href="#" style="margin-top:10px;font-size:13px">Lihat roadmap →</a></div>', 'c4') +
      card(title('Margin per produk') + marginBars(), 'c6') +
      card(title('Produk terlaris bulan ini') + [['Risol Mayo', 38, '▲ 15%'], ['Dimsum Ayam', 24, '▼ 6%'], ['Nugget Sayur', 18, '▲ 4%'], ['Siomay Ikan', 12, '▼ 18%'], ['Lumpia Udang', 8, '▲ 2%']].map(function (p, i) { return '<div class="mbar" style="grid-template-columns:124px 1fr 84px"><span style="white-space:nowrap">' + (i + 1) + '. ' + p[0] + '</span><div class="tr"><i class="' + (i === 0 ? 'low' : '') + '" style="width:' + (p[1] / 38 * 92) + '%"></i></div><b style="font-weight:500;color:var(--muted)">' + p[1] + '% · ' + p[2] + '</b></div>'; }).join(''), 'c6') +
      '</div>' +
      '<p class="foot-note">Semua angka adalah data contoh. Pada versi nyata dihitung dari catatan penjualan akun Anda.</p>';
    return shell('dashboard', body);
  }

  /* ---------- layar: analitik ---------- */
  function analitik() {
    var secs = {
      penjualan: [
        card(title('Omzet harian, 30 hari', '<span class="tag-contoh">data contoh</span>') + dailyBars() + '<div class="sub" style="margin-top:8px"><b>Insight:</b> akhir pekan menyumbang <b>57%</b> omzet. Jumat-Minggu adalah waktu terbaik untuk promosi.</div>', 'c8'),
        card(title('Kanal penjualan') + channelDonut() + '<div class="sub" style="margin-top:10px">Toko sendiri dan WhatsApp = 74% omzet.</div>', 'c4')
      ],
      produk: [
        card(title('Matriks produk', '<span class="sub">Laris vs margin</span>') + scatter(), 'c6'),
        card(title('Margin per produk') + marginBars(), 'c6'),
        card(title('Efektivitas promosi') + promoTable(), 'c12')
      ],
      waktu: [
        card(title('Waktu ramai', '<span class="sub">Rata-rata 8 minggu</span>') + heatmap() + '<div class="sub" style="margin-top:12px"><b>Insight:</b> puncak <b>Sabtu sore</b>. Siapkan stok Risol Mayo sebelum pukul 14.00; Sabtu lalu habis tepat di jam itu.</div>', 'c12')
      ],
      stok: [
        card(title('Cakupan stok per produk') + coverRows(), 'c6'),
        card(title('Harga bahan baku', '<span class="badge b-pink">1 naik</span>') + priceRows(), 'c6')
      ]
    };
    var names = { penjualan: 'Penjualan', produk: 'Produk', waktu: 'Waktu ramai', stok: 'Stok & bahan' };
    var seg = '<div class="seg m-seg m" role="tablist">' + Object.keys(names).map(function (k, i) { return '<button role="tab" aria-selected="' + (i === 0) + '" data-seg="' + k + '">' + (k === 'waktu' ? 'Waktu' : names[k].replace('Stok & bahan', 'Stok')) + '</button>'; }).join('') + '</div>';
    var chips = '<div class="chips w"><button class="chip" aria-pressed="false">Minggu ini</button><button class="chip" aria-pressed="true">Bulan ini</button><button class="chip" aria-pressed="false">3 bulan</button></div>';
    var body = head('Penjualan, produk, waktu ramai, dan stok', 'Analitik', 'Penjualan, produk, waktu ramai, dan stok', 'Analitik', null, '') +
      '<div class="toolbar">' + chips + '<button class="btn btn-line btn-sm w">Unduh laporan (PDF)</button></div>' + seg +
      '<div class="dgrid">' + Object.keys(secs).map(function (k) { return '<div class="sect" data-sec="' + k + '"' + (k === 'penjualan' ? '' : ' hidden') + '>' + secs[k].join('') + '</div>'; }).join('') + '</div>' +
      '<p class="foot-note">Data contoh. Analitik baru terbuka penuh setelah minimal 2 minggu data penjualan.</p>';
    return shell('analitik', body);
  }

  /* ---------- auth ---------- */
  function authSide() {
    return '<aside class="auth-side"><a class="wordmark" style="font-size:40px" href="index.html"><span>laku</span><i>.ai</i></a><div><h2>Klinik bisnis untuk usaha Anda.</h2><ul><li>Kalkulator HPP dan harga jual gratis</li><li>Coba Klinik Pro 14 hari tanpa kartu</li><li>Setiap saran disertai alasan dan datanya</li><li>Keputusan akhir tetap di tangan Anda</li></ul></div><div class="quote"><b>74%</b>pemilik usaha dalam survei pilot kami pernah salah mengatur stok. Data penjualan Anda bisa mencegahnya.</div></aside>';
  }
  var GOOGLE = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z"/></svg>';
  var fld = function (l, ph, type, val, extra) { return '<label class="field"><span>' + l + '</span>' + (type === 'select' ? '<select>' + ph.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>' : '<input type="' + (type || 'text') + '" placeholder="' + ph + '"' + (val ? ' value="' + val + '"' : '') + '>') + (extra || '') + '</label>'; };

  function daftar() {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + wm(36) +
      '<h1>Daftar gratis</h1><p class="lead">Mulai dengan kalkulator HPP. Diagnosis usaha terbuka setelah data masuk.</p>' +
      '<button class="btn btn-google btn-block">' + GOOGLE + 'Daftar dengan Google</button><div class="divider">atau pakai email</div>' +
      fld('Nama pemilik', 'mis. Bu Sari') + fld('Nama usaha', 'mis. Dapur Bu Sari') +
      fld('Jenis usaha', ['Makanan berat', 'Frozen food', 'Camilan', 'Kafe / minuman', 'Jasa', 'Lainnya'], 'select') +
      '<div class="two">' + fld('Nomor WhatsApp', '08xxxxxxxxxx', 'tel') + fld('Kota', 'mis. Malang') + '</div>' +
      fld('Email', 'nama@email.com', 'email') +
      '<label class="field"><span>Kata sandi</span><div class="pw"><input type="password" value="rahasia123"><em>Lihat</em></div><div class="hint ok">✓ Minimal 8 karakter</div></label>' +
      '<div class="agree"><i>' + ic('check', 3) + '</i><span>Saya setuju data usaha saya dipakai <b>hanya untuk analisis akun saya</b> dan tidak dibagikan ke pihak lain.</span></div>' +
      '<a class="btn btn-red btn-block" href="screen.html?s=onboarding1">Daftar gratis</a>' +
      '<div class="auth-foot">Sudah punya akun? <a href="screen.html?s=masuk">Masuk</a></div><p class="legalnote">Tanpa kartu kredit. Bisa dihapus kapan saja.</p></main></div>';
  }
  function masuk() {
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + wm(36) +
      '<h1>Selamat datang kembali</h1><p class="lead">Masuk untuk melihat kesehatan usaha Anda.</p>' +
      '<button class="btn btn-google btn-block">' + GOOGLE + 'Masuk dengan Google</button><div class="divider">atau</div>' +
      fld('Email atau nomor WhatsApp', 'nama@email.com', 'text') +
      '<label class="field"><span>Kata sandi</span><div class="pw"><input type="password" value="rahasia123"><em>Lihat</em></div></label>' +
      '<div style="text-align:right;margin:-4px 0 16px"><a class="link" href="#" style="font-size:13px">Lupa kata sandi?</a></div>' +
      '<a class="btn btn-red btn-block" href="screen.html?s=dashboard">Masuk</a>' +
      '<div class="auth-foot">Belum punya akun? <a href="screen.html?s=daftar">Daftar gratis</a></div></main></div>';
  }
  function onbWrap(step, label, inner, next, back) {
    var bars = [1, 2, 3].map(function (i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('');
    return '<div class="auth">' + authSide() + '<main class="auth-main">' + wm(36) + '<div class="stepper-top">' + bars + '</div><div class="step-label">Langkah ' + step + ' dari 3 · ' + label + '</div>' + inner +
      '<div class="sticky-cta">' + (back ? '<a class="btn btn-line" href="' + back + '">Kembali</a>' : '') + '<a class="btn btn-red" href="' + next[0] + '">' + next[1] + '</a></div></main></div>';
  }
  var chip = function (t, on) { return '<span class="chip' + (on ? ' sel' : '') + '">' + t + '</span>'; };
  function onb1() {
    return onbWrap(1, 'Profil usaha', '<h1>Ceritakan usaha Anda</h1><p class="lead">Supaya saran sesuai dengan tahap usaha Anda.</p>' +
      '<div class="field"><span>Jumlah outlet</span><div class="chips">' + chip('1 outlet', 1) + chip('2-3 outlet') + chip('4+ outlet') + '</div></div>' +
      '<div class="field"><span>Omzet per bulan (perkiraan)</span><div class="chips">' + chip('< Rp5 jt') + chip('Rp5-15 jt', 1) + chip('Rp15-50 jt') + chip('> Rp50 jt') + chip('Belum tahu') + '</div></div>' +
      '<div class="field"><span>Lama usaha</span><div class="chips">' + chip('< 1 tahun') + chip('1-3 tahun', 1) + chip('3-5 tahun') + chip('> 5 tahun') + '</div></div>' +
      '<div class="field"><span>Jual lewat (boleh lebih dari satu)</span><div class="chips">' + chip('Toko sendiri', 1) + chip('WhatsApp', 1) + chip('Reseller') + chip('GoFood / Grab / Shopee') + chip('Marketplace') + '</div></div>',
      ['screen.html?s=onboarding2', 'Lanjut']);
  }
  function onb2() {
    var rows = [['Risol Mayo', '3.500', '2.100'], ['Dimsum Ayam', '45.000', '35.500'], ['Nugget Sayur', '', '']].map(function (r) { return '<div class="prod-row"><input placeholder="Nama produk" value="' + r[0] + '"><input placeholder="Harga jual" value="' + (r[1] ? 'Rp' + r[1] : '') + '"><input placeholder="HPP" value="' + (r[2] ? 'Rp' + r[2] : '') + '"></div>'; }).join('');
    return onbWrap(2, 'Produk utama', '<h1>Produk andalan Anda</h1><p class="lead">Mulai dari <b>3-5 produk utama</b> saja. HPP bisa diisi nanti lewat kalkulator.</p>' +
      '<div class="prod-head"><span>PRODUK</span><span>HARGA JUAL</span><span>HPP</span></div>' + rows + '<button class="link" style="margin:6px 0 4px">+ Tambah produk</button><div class="hint">Anda bisa mengubah semuanya nanti di menu Produk.</div>',
      ['screen.html?s=onboarding3', 'Lanjut'], 'screen.html?s=onboarding1');
  }
  function onb3() {
    var o = function (ico, t, s, sel) { return '<div class="opt-card' + (sel ? ' sel' : '') + '"><span class="ic2">' + ic(ico) + '</span><b>' + t + '</b><small>' + s + '</small></div>'; };
    return onbWrap(3, 'Data penjualan', '<h1>Masukkan data penjualan</h1><p class="lead">Pilih cara paling ringan. Cukup 8 minggu data untuk diagnosis pertama.</p><div class="opt-grid">' +
      o('pen', 'Isi cepat', 'Ketik jumlah terjual per produk, 1 menit per hari.', 1) + o('camera', 'Foto nota', 'Foto buku atau nota, AI membaca isinya.') + o('upload', 'Impor Excel / CSV', 'Unggah rekap penjualan yang sudah ada.') + o('sheet', 'Mulai kosong', 'Pakai kalkulator HPP dulu, data menyusul.') + '</div>' +
      '<div class="hint" style="margin-top:12px">Data Anda hanya dipakai untuk analisis akun ini.</div>', ['screen.html?s=kosong', 'Selesai, masuk ke beranda'], 'screen.html?s=onboarding2');
  }

  /* ---------- akun baru: kosong + paket gratis ---------- */
  function kosong() {
    var U = { ini: 'PA', name: 'Kedai Pak Andi', meta: 'Camilan · Bandung', plan: '', pro: 0 };
    var todo = function (n, t, s, done) { return '<div class="todo' + (done ? ' done' : '') + '"><span class="n">' + (done ? ic('check', 3).replace('width="24" height="24"', 'width="16" height="16"') : n) + '</span><div class="t"><b>' + t + '</b><small>' + s + '</small></div>' + (done ? '' : '<a class="btn btn-red btn-sm" href="#">Mulai</a>') + '</div>'; };
    var locked = function (t, inner, cls) { return '<div class="card ghost ' + (cls || '') + '"><div class="blur">' + inner + '</div><div class="lock"><b>' + t + '</b><span class="sub">Terbuka di Klinik Pro setelah ada data</span><a class="btn btn-red btn-sm" href="#">Coba Pro 14 hari</a></div></div>'; };
    var body = head('Selamat datang, Pak Andi', 'Kedai Pak Andi', 'Selamat datang, Pak Andi', 'Mulai dari sini', U, '', 1) +
      '<div class="dgrid">' +
      card('<div class="row"><div><div class="label">Persiapan akun</div><h3 style="font-size:18px;margin:4px 0 0">Selesaikan 3 langkah pertama</h3></div><span class="badge b-pink">1 dari 3</span></div><div class="track red" style="margin:12px 0 4px"><i style="width:34%"></i></div>' +
        todo(1, 'Akun dan profil usaha dibuat', '', 1) + todo(2, 'Hitung HPP produk pertama', 'Gratis. Selesai dalam 2 menit di Kalkulator HPP.') + todo(3, 'Catat penjualan 3 hari pertama', 'Diagnosis butuh minimal 2 minggu data. Mulai dari 3-5 produk utama.'), 'c8') +
      card('<div class="label">Skor kesehatan usaha</div><div style="display:grid;place-items:center;padding:14px 0 6px"><div class="donut" style="width:120px;height:120px"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" fill="none" stroke="#ECEFF1" stroke-width="13"/></svg><div class="t"><b style="color:var(--bar)">--</b><small style="font-size:11px">belum ada data</small></div></div></div><div class="sub" style="text-align:center">Muncul setelah 2 minggu pencatatan.</div>', 'c4') +
      locked('Diagnosis dan insight AI', insights(), 'c8') +
      card(title('Gratis untuk Anda') + '<div class="menu"><a href="#"><span><b>Kalkulator HPP</b><small>Hitung HPP dan pilihan harga jual</small></span><span class="badge b-ok">Aktif</span></a><a href="#"><span><b>Catat penjualan</b><small>Isi cepat, foto nota, impor</small></span><span class="badge b-ok">Aktif</span></a><a href="#"><span><b>Ringkasan dasar</b><small>Omzet dan transaksi</small></span><span class="badge b-ok">Aktif</span></a></div>', 'c4') +
      locked('Tren, stok, dan analitik', '<div style="height:150px">' + lineCompare() + '</div>', 'c12') +
      '</div>';
    return shell('dashboard', body, U);
  }

  /* ---------- skema database (Google Sheets) ---------- */
  var EX = {
    Users: [['u_k3j9a1', 'Sari W.', 'sari@mail.com', '0812345678', 'v1:9f2c…', 'a81f…', 'pro_trial', '2026-11-03T08:00Z', '2026-11-25T06:10Z', 'aktif']],
    Usaha: [['b_x81pq2', 'u_k3j9a1', 'Dapur Bu Sari', 'Frozen food', 'Malang', '1 outlet', 'Rp5-15 jt', '1-3 tahun', 'toko,wa,reseller', '15000000', '35', '{"sop":true}', 'selesai', '2026-11-03T08:00Z']],
    Produk: [['p_risol001', 'b_x81pq2', 'Risol Mayo', 'pcs', '10000', '5900', '35', '80', 'TRUE', 'manual'], ['p_dimsum01', 'b_x81pq2', 'Dimsum Ayam', 'pack', '45000', '35500', '8', '16', 'TRUE', 'manual']],
    Bahan: [['m_a1b2c3', 'b_x81pq2', 'p_dimsum01', 'Daging ayam 500 g', '22000', '2026-11-03T08:05Z']],
    HargaBahan: [['h_q1w2e3', 'b_x81pq2', 'p_dimsum01', 'Daging ayam 500 g', '22000', '2026-11-03']],
    Penjualan: [['t_0a1b2c', 'b_x81pq2', '2026-11-20', '13:40', 'p_risol001', '24', '10000', 'toko', 'manual'], ['t_0a1b2d', 'b_x81pq2', '2026-11-21', '09:05', 'p_dimsum01', '3', '45000', 'wa', 'manual']],
    Promosi: [['r_9z8y7x', 'b_x81pq2', 'Diskon Risol Mayo', 'p_risol001', '2026-11-05', '2026-11-18', 'manual']],
    Keputusan: [['k_5t6y7u', 'b_x81pq2', 'stok', 'p_risol001', '106', 'ikuti', '106', '2026-11-25T06:30Z']],
    Sesi: [['e3b0c442…', 'u_k3j9a1', '2026-11-25T06:10Z', '2026-12-25T06:10Z', 'Android']]
  };
  var SHEETS = (function () { var o = {}; Object.keys(LakuCore.TABLES).forEach(function (t) { o[t] = [LakuCore.TABLES[t]].concat(EX[t] || []); }); return o; })();
  function skema() {
    var tab = Object.keys(SHEETS);
    var cols = 'ABCDEFGHIJ';
    var tables = tab.map(function (t, k) {
      var d = SHEETS[t];
      return '<div class="sheet-scroll" data-sheet="' + t + '"' + (k ? ' hidden' : '') + '><table class="grid"><thead><tr><th style="width:34px"></th>' + d[0].map(function (_, i) { return '<th>' + cols[i] + '</th>'; }).join('') + '</tr></thead><tbody><tr><td style="background:#F8F9FA;color:#5F6368">1</td>' + d[0].map(function (h) { return '<td style="font-weight:700;background:#E6F4EA">' + h + '</td>'; }).join('') + '</tr>' +
        d.slice(1).map(function (r, i) { return '<tr><td style="background:#F8F9FA;color:#5F6368">' + (i + 2) + '</td>' + r.map(function (c, j) { return '<td class="' + (j === 0 ? 'k' : (/hash|salt/.test(d[0][j]) ? 'h' : '')) + '">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }).join('');
    var body = '<div class="pagehead"><div><div class="eyebrow">Rancangan backend tahap beta</div><h1 class="h1">Database di Google Sheets</h1></div></div>' +
      '<div class="flow" style="margin-bottom:16px"><div class="node"><b>Aplikasi laku.ai</b><small>Web + PWA di GitHub Pages. Tidak menyimpan rahasia apa pun.</small></div><div class="arrow">HTTPS<br>JSON →</div>' +
      '<div class="node"><b>Google Apps Script (Web App)</b><small>API: daftar, masuk, simpan penjualan, ambil analitik. Hash kata sandi dan cek kepemilikan data di sini.</small></div><div class="arrow">SpreadsheetApp<br>→</div>' +
      '<div class="node" style="background:#E6F4EA"><b style="color:#0F7B41">Google Sheets</b><small>9 tab di bawah. Hanya pemilik file yang bisa membukanya.</small></div></div>' +
      '<div class="sheetwrap" style="margin-bottom:16px"><div class="sheet-tabs" role="tablist">' + tab.map(function (t, i) { return '<button role="tab" aria-selected="' + (i === 0) + '" data-tab="' + t + '">' + t + '</button>'; }).join('') + '</div>' + tables + '</div>' +
      '<div class="note-grid"><div class="note"><h4>Cara kerja</h4><ul><li>Setiap baris Usaha, Produk, Penjualan, dan seterusnya membawa <b>usaha_id</b>. Apps Script hanya mengembalikan baris milik pengguna yang login.</li><li>Analitik (margin, matriks produk, waktu ramai, cakupan stok) dihitung di Apps Script atau di browser dari tab Penjualan dan Produk.</li><li>Sesi memakai token acak; yang disimpan hanya hash-nya.</li></ul></div>' +
      '<div class="note warn"><h4>Batasan yang perlu disetujui</h4><ul><li>Cocok untuk <b>beta 15-20 pengguna</b> (sesuai rencana di laporan survei). Untuk ratusan pengguna aktif, pindah ke Postgres/Supabase.</li><li>Apps Script punya kuota harian dan waktu respons 1-3 detik.</li><li>Kata sandi di-hash SHA-256 + salt (bawaan Apps Script). Lebih lemah dari bcrypt; <b>Masuk dengan Google</b> menghindari penyimpanan sandi sama sekali.</li><li>Isi spreadsheet berisi data usaha orang lain: batasi akses file hanya untuk tim inti.</li></ul></div></div>';
    return '<div style="padding:20px 16px 48px;max-width:1100px;margin:0 auto">' + body + '</div>';
  }

  /* ---------- render + interaksi ---------- */
  var SCREENS = { dashboard: dashboard, analitik: analitik, daftar: daftar, masuk: masuk, onboarding1: onb1, onboarding2: onb2, onboarding3: onb3, kosong: kosong, skema: skema };
  var root = $('#root');
  root.innerHTML = (SCREENS[S] || dashboard)();
  document.title = 'Mockup · ' + S + ' · laku.ai';

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-seg]');
    if (a) { $$('[data-seg]').forEach(function (b) { b.setAttribute('aria-selected', b === a); }); $$('.sect').forEach(function (s) { s.hidden = s.dataset.sec !== a.dataset.seg; }); return; }
    var t = e.target.closest('[data-tab]');
    if (t) { $$('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b === t); }); $$('[data-sheet]').forEach(function (s) { s.hidden = s.dataset.sheet !== t.dataset.tab; }); return; }
    var c = e.target.closest('.chip');
    if (c && c.parentNode.classList.contains('chips')) {
      if (c.hasAttribute('aria-pressed')) { $$('.chip', c.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); } else { c.classList.toggle('sel'); }
    }
    var o = e.target.closest('.opt-card');
    if (o) { o.parentNode.querySelectorAll('.opt-card').forEach(function (x) { x.classList.toggle('sel', x === o); }); }
    var l = e.target.closest('a[href="#"]'); if (l) e.preventDefault();
  });
  if (window.parent !== window) document.documentElement.classList.add('framed');
})();
