/* laku.ai — prototipe aplikasi (web + PWA). Tanpa build step. Data contoh = data mockup di deck. */
(function () {
  'use strict';

  /* ---------- util ---------- */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var rp = function (n) { return 'Rp' + Math.round(n).toLocaleString('id-ID'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var mw = function (m, w) { return '<div class="m">' + m + '</div><div class="w">' + w + '</div>'; };

  var ICON = {
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5"/><path d="M12 12v9"/>',
    hpp: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>'
  };
  var ic = function (n, sw) { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; };

  /* ---------- data (sama dengan mockup di deck) ---------- */
  var BIZ = { owner: 'Bu Sari', name: 'Dapur Bu Sari', type: 'Frozen food', city: 'Malang' };
  var WEEKS = [2.4, 2.5, 2.7, 2.6, 2.6, 2.9, 2.8, 3.3];
  var PRODUCTS = [
    { id: 'risol', n: 'Risol Mayo', share: 38, ch: 15, tag: 'Unggulan', tone: 'dark' },
    { id: 'dimsum', n: 'Dimsum Ayam', share: 24, ch: -6, tag: 'Cek margin', tone: 'pink' },
    { id: 'nugget', n: 'Nugget Sayur', share: 18, ch: 4, tag: 'Stabil', tone: 'gray' },
    { id: 'siomay', n: 'Siomay Ikan', share: 12, ch: -18, tag: 'Perlu didorong', tone: 'pink' },
    { id: 'lumpia', n: 'Lumpia Udang', share: 8, ch: 2, tag: 'Stabil', tone: 'gray' }
  ];
  var STOCK = [
    { id: 'risol', n: 'Risol Mayo', u: 'pcs', sisa: 40, lalu: 90, saran: 120, act: 'Naikkan', why: 'Penjualan naik 3 minggu berturut-turut dan Sabtu lalu stok habis pukul 14.00. Produksi naik dari 90 ke 120 pcs.', webWhy: 'Penjualan naik 3 minggu berturut-turut dan Sabtu lalu stok habis pukul 14.00.' },
    { id: 'dimsum', n: 'Dimsum Ayam', u: 'pack', sisa: 22, lalu: 30, saran: 30, act: 'Tetap', why: 'Penjualan stabil 28-31 pack per minggu. Pertahankan produksi 30 pack.', webWhy: 'Penjualan stabil 28-31 pack per minggu.' },
    { id: 'nugget', n: 'Nugget Sayur', u: 'pack', sisa: 18, lalu: 20, saran: 22, act: 'Naikkan', why: 'Penjualan naik 4% dan stok tersisa kurang dari satu minggu. Produksi naik dari 20 ke 22 pack.', webWhy: 'Naik 4% dan stok tersisa kurang dari satu minggu.' },
    { id: 'siomay', n: 'Siomay Ikan', u: 'pack', sisa: 35, lalu: 20, saran: 10, act: 'Kurangi', why: 'Rata-rata terjual 18 pack per minggu, jadi sisa 35 pack cukup untuk 2 minggu. Cukup produksi 10 pack.', webWhy: 'Rata-rata terjual 18 pack per minggu, sisa stok cukup untuk 2 minggu.' },
    { id: 'lumpia', n: 'Lumpia Udang', u: 'pack', sisa: 12, lalu: 15, saran: 15, act: 'Tetap', why: 'Penjualan stabil, stok aman. Pertahankan produksi 15 pack.', webWhy: 'Penjualan stabil, stok aman.' }
  ];
  var MOBILE_ORDER = ['risol', 'siomay', 'nugget', 'dimsum', 'lumpia'];
  var HEALTH = [
    { k: 'Pertumbuhan omzet', v: 85, l: 'Baik', d: 'Omzet minggu ke-8 (Rp3,3 jt) naik 27% dibanding minggu ke-5. Data: 8 minggu penjualan.' },
    { k: 'Margin kotor', v: 52, l: 'Perlu dijaga', warn: 1, d: 'Margin turun 3 poin ke 34% karena harga daging ayam naik 12% sementara harga jual Dimsum Ayam belum berubah.' },
    { k: 'Perputaran stok', v: 70, l: 'Cukup', d: 'Risol Mayo habis Sabtu pukul 14.00 (1 kali), sementara Siomay Ikan menumpuk (cukup untuk 2 minggu).' },
    { k: 'Konsistensi pencatatan', v: 82, l: 'Baik', d: 'Penjualan dicatat 8 minggu berturut-turut; 412 transaksi bulan ini.' }
  ];
  var SCORE = Math.round(HEALTH.reduce(function (a, h) { return a + h.v; }, 0) / HEALTH.length); // 72

  var DEFAULT = {
    hpp: { items: [
      { n: 'Daging ayam 500 g', p: 22000, badge: 'naik 12%' },
      { n: 'Kulit dan tepung', p: 6500 }, { n: 'Bumbu', p: 3000 },
      { n: 'Kemasan', p: 2500 }, { n: 'Gas dan listrik', p: 1500 }
    ], price: 45000, pick: 1 },
    decisions: {},
    sales: [
      { d: 'Hari ini', n: 'Risol Mayo', q: 24, p: 3500 },
      { d: 'Kemarin', n: 'Dimsum Ayam', q: 6, p: 45000 }
    ],
    prefs: { wa: true, alert: true }
  };
  var S;
  function load() { try { var r = JSON.parse(localStorage.getItem('laku.state.v1')); if (r && r.hpp) return r; } catch (e) {} return JSON.parse(JSON.stringify(DEFAULT)); }
  function save() { try { localStorage.setItem('laku.state.v1', JSON.stringify(S)); } catch (e) {} }
  S = load();

  var hppTotal = function () { return S.hpp.items.reduce(function (a, i) { return a + (+i.p || 0); }, 0); };
  var margin = function (price) { return price > 0 ? Math.round(100 * (price - hppTotal()) / price) : 0; };
  var priceOpts = function () { var c = S.hpp.price; return [c, c + 3000, c + 5000]; };

  /* ---------- komponen ---------- */
  function donut(score, size) {
    var r = 48, c = 2 * Math.PI * r;
    return '<div class="donut"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#ECEFF1" stroke-width="13"/><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#D32F2F" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + (c * score / 100).toFixed(1) + ' ' + c.toFixed(1) + '"/></svg><div class="t"><b>' + score + '</b><small>dari 100</small></div></div>';
  }
  function spark(pts, color) {
    var w = 200, h = 44, mn = Math.min.apply(0, pts), mx = Math.max.apply(0, pts), rg = (mx - mn) || 1;
    var p = pts.map(function (v, i) { return (i * w / (pts.length - 1)).toFixed(1) + ',' + (h - 4 - (v - mn) / rg * (h - 10)).toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + p + '" stroke="' + color + '"/></svg>';
  }
  function lineChart() {
    var W = 760, H = 230, pl = 14, pr = 14, pt = 30, pb = 30, mn = 2.0, mx = 3.6;
    var x = function (i) { return pl + i * (W - pl - pr) / (WEEKS.length - 1); };
    var y = function (v) { return pt + (mx - v) / (mx - mn) * (H - pt - pb); };
    var pts = WEEKS.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var dots = WEEKS.map(function (v, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="4" fill="#D32F2F"/><text x="' + x(i).toFixed(1) + '" y="' + (y(v) - 11).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#263238">' + String(v).replace('.', ',') + '</text><text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="#90A4AE">M' + (i + 1) + '</text>'; }).join('');
    return '<svg class="linechart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Omzet per minggu, 8 minggu terakhir, naik dari 2,4 menjadi 3,3 juta rupiah"><polyline points="' + pts + '" fill="none" stroke="#D32F2F" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' + dots + '</svg>';
  }
  function head(eyebrowM, titleM, eyebrowW, titleW, extraW, greeting) {
    return '<div class="pagehead"><div>' +
      (greeting ? '<div class="eyebrow m">' + eyebrowM + '</div><h1 class="h1 m">' + titleM + '</h1>' : '<h1 class="h1 m">' + titleM + '</h1><div class="eyebrow m">' + eyebrowM + '</div>') +
      '<div class="eyebrow w">' + eyebrowW + '</div><h1 class="h1 w">' + titleW + '</h1></div>' +
      '<div class="who w">' + (extraW || '') + '<div><b>' + BIZ.name + '</b><small>' + BIZ.type + ' · ' + BIZ.city + '</small></div><a class="avatar" href="#/akun" aria-label="Akun">BS</a></div></div>';
  }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  var changeTxt = function (n) { return (n >= 0 ? '▲ ' : '▼ ') + Math.abs(n) + '%'; };

  /* ---------- views ---------- */
  var V = {};

  V.beranda = function () {
    var mg = margin(S.hpp.price);
    var alertHTML = mg < 25
      ? '<div class="alert"><div class="row"><span class="tag">Peringatan dini</span><small>Hari ini</small></div><h3>Margin Dimsum Ayam turun ke ' + mg + '%</h3><p>Harga daging ayam naik 12% sejak bulan lalu, harga jual belum berubah.</p><a class="link" href="#/hpp">Hitung ulang HPP →</a></div>'
      : '<div class="alert ok"><div class="row"><span class="tag">Margin aman</span><small>Hari ini</small></div><h3>Margin Dimsum Ayam pulih ke ' + mg + '%</h3><p>Harga jual baru ' + rp(S.hpp.price) + ' sudah menutup kenaikan harga bahan.</p><a class="link" href="#/hpp">Lihat kalkulator HPP →</a></div>';
    var top = '<div class="top-prod"><div><div class="label">Produk unggulan bulan ini</div><h3>Risol Mayo</h3><div class="sub">38% dari omzet · ▲ 15%</div></div><span class="badge b-dark">Unggulan</span></div>';
    var mobile =
      '<div class="stack">' +
      '<div class="card score"><div><div class="label">Skor kesehatan usaha</div><h2>Cukup sehat</h2><p>Naik 4 poin dari bulan lalu. Margin perlu dijaga.</p><a class="chip-link" href="#/diagnosis">Lihat diagnosis</a></div>' + donut(SCORE) + '</div>' +
      '<div class="grid2"><div class="card"><div class="label">Omzet Okt</div><div class="big" style="margin-top:6px">Rp12,4 jt</div><div class="up" style="font-size:13px">▲ 8% <span class="sub" style="font-weight:400">vs Sep</span></div>' + spark([2.4, 2.5, 2.7, 2.6, 2.6, 2.9, 2.8, 3.3], '#D32F2F') + '</div>' +
      '<div class="card"><div class="label">Margin kotor</div><div class="big" style="margin-top:6px">' + 34 + '%</div><div class="down" style="font-size:13px">▼ 3 poin <span class="sub" style="font-weight:400">vs Sep</span></div>' + spark([3.6, 3.5, 3.5, 3.4, 3.3, 3.1], '#263238') + '</div></div>' +
      alertHTML +
      '<div class="card">' + top + '</div>' +
      '<div class="quick"><a href="#/catat">' + ic('plus') + 'Catat penjualan</a><a href="#/roadmap">' + ic('flag') + 'Roadmap usaha</a></div></div>';
    var web =
      '<div class="dash">' +
      '<div class="card score-card"><div class="row"><span class="label">Skor kesehatan usaha</span><a class="chip-link" style="margin:0;padding:4px 12px;font-size:12px" href="#/diagnosis">Diagnosis</a></div><div class="score v">' + donut(SCORE) + '<h2>Cukup sehat</h2><div class="sub">Naik 4 poin dari bulan lalu</div></div>' +
      '<div class="comp-mini" style="margin-top:18px">' + HEALTH.map(function (h) { return '<div><span>' + h.k + '</span><b class="' + (h.warn ? 'warn' : '') + '">' + h.l + '</b></div>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="dash-right"><div class="stats4">' +
      '<div class="card"><div class="label">Omzet Oktober</div><div class="big" style="margin:10px 0 2px">Rp12,4 jt</div><div class="up" style="font-size:13px">▲ 8% vs September</div></div>' +
      '<div class="card"><div class="label">Margin kotor</div><div class="big" style="margin:10px 0 2px">34%</div><div class="down" style="font-size:13px">▼ 3 poin vs September</div></div>' +
      '<div class="card"><div class="label">Transaksi</div><div class="big" style="margin:10px 0 2px">412</div><div class="up" style="font-size:13px">▲ 5% vs September</div></div></div>' +
      '<div class="card"><div class="row"><span class="label">Omzet per minggu (juta rupiah)</span><span class="badge b-gray">8 minggu terakhir</span></div>' + lineChart() + '</div></div></div>' +
      '<div class="dash-bottom">' + alertHTML +
      '<div class="card"><div class="row"><div><div class="label">Produk unggulan bulan ini</div><h3 style="font-size:20px;margin:8px 0 2px">Risol Mayo</h3><div class="sub">38% dari omzet · ▲ 15% · 62% terjual Jumat-Minggu</div></div><span class="badge b-dark">Unggulan</span></div><a class="link" href="#/tren" style="margin-top:14px">Lihat tren produk →</a></div></div>';
    return head('Selamat pagi, ' + BIZ.owner, BIZ.name, 'Selamat pagi, ' + BIZ.owner + ' · Oktober 2026', 'Ringkasan kesehatan usaha', '<select class="pill-select" id="month" aria-label="Pilih bulan"><option>Oktober 2026 ▾</option><option>September 2026</option></select>', true) + mw(mobile, web);
  };

  V.diagnosis = function () {
    var comps = HEALTH.map(function (h) {
      return '<div class="comp"><div class="row"><b>' + h.k + '</b><span class="badge ' + (h.warn ? 'b-pink' : (h.v >= 80 ? 'b-ok' : 'b-gray')) + '">' + h.l + ' · ' + h.v + '</span></div><div class="track' + (h.warn ? ' red' : '') + '" style="margin-top:10px"><i style="width:' + h.v + '%"></i></div><p><b style="color:var(--red)">Kenapa?</b> ' + h.d + '</p></div>';
    }).join('');
    var body =
      '<a class="back" href="#/">' + ic('back', 2) + 'Beranda</a>' +
      '<div class="pagehead"><div><div class="eyebrow">Diagnosis · Oktober 2026</div><h1 class="h1">Skor kesehatan usaha</h1></div><div class="who w"><div><b>' + BIZ.name + '</b><small>' + BIZ.type + ' · ' + BIZ.city + '</small></div><a class="avatar" href="#/akun" aria-label="Akun">BS</a></div></div>' +
      '<div class="two-col"><div class="stack"><div class="card score"><div><div class="label">Skor total</div><h2>Cukup sehat</h2><p>Rata-rata dari empat komponen. Naik 4 poin dari bulan lalu.</p></div>' + donut(SCORE) + '</div>' +
      '<div class="tip"><div class="label">Langkah berikutnya</div><p>Hitung ulang HPP Dimsum Ayam dan naikkan harga jual. Ini komponen dengan skor terendah (margin kotor, 52).</p><a class="link" href="#/hpp" style="color:#fff;margin-top:10px">Buka kalkulator HPP →</a></div></div>' +
      '<div class="card"><div class="label" style="margin-bottom:6px">Rincian dan data yang dipakai</div>' + comps + '</div></div>' +
      '<p class="foot-note">Setiap skor disertai alasan dan datanya. Keputusan akhir tetap di tangan Anda.</p>';
    return body;
  };

  V.tren = function () {
    var wk = [2.6, 2.9, 2.8, 3.3], mxv = 3.3;
    var bars = '<div class="bars">' + wk.map(function (v, i) { return '<div class="b' + (i === 3 ? ' hl' : '') + '"><b>' + String(v).replace('.', ',') + ' jt</b><i style="height:' + (v / mxv * 100 * 0.78).toFixed(0) + '%"></i></div>'; }).join('') + '</div>';
    var list = '<div class="contrib">' + PRODUCTS.map(function (p, i) {
      return '<div><div class="row"><span class="name">' + (i + 1) + '. ' + p.n + '</span><span class="badge b-' + p.tone + '">' + p.tag + '</span></div>' +
        '<div class="row" style="margin-top:9px"><div class="track' + (i === 0 ? ' red' : '') + '"><i style="width:' + Math.round(p.share / 38 * 92) + '%"></i></div><span class="meta">' + p.share + '% · ' + (p.ch >= 0 ? '▲ ' : '▼ ') + Math.abs(p.ch) + '%</span></div></div>';
    }).join('') + '</div>';
    var body = head('4 minggu terakhir · dari 8 minggu data', 'Tren penjualan', 'Dari 8 minggu data penjualan', 'Tren penjualan') +
      '<div class="trend-grid"><div class="stack"><div class="card"><div class="row"><span class="label">Omzet per minggu</span><span class="sub"><b class="up">▲ 27%</b> M4 vs M1</span></div>' + bars + '</div>' +
      '<div class="tip w"><div class="label">Saran minggu ini</div><p>Fokuskan promosi <b>Risol Mayo</b> di akhir pekan: 62% penjualannya terjadi Jumat sampai Minggu.</p></div></div>' +
      '<div class="stack"><div class="card"><div class="label">Kontribusi produk dan perubahan</div>' + list + '</div>' +
      '<div class="tip m"><div class="label">Saran minggu ini</div><p>Fokuskan promosi <b>Risol Mayo</b> di akhir pekan: 62% penjualannya terjadi Jumat sampai Minggu.</p></div></div></div>';
    return body;
  };

  function stockCardM(p) {
    var d = S.decisions[p.id], badge = p.act === 'Naikkan' ? 'b-dark' : (p.act === 'Kurangi' ? 'b-pink' : 'b-gray');
    var label = p.act === 'Naikkan' ? 'Naikkan produksi' : (p.act === 'Kurangi' ? 'Kurangi produksi' : 'Pertahankan');
    var actions;
    if (d && d.mode === 'edit') {
      actions = '<div class="stepper"><button class="s" data-step="-5" data-id="' + p.id + '" aria-label="Kurangi 5">−</button><input type="number" inputmode="numeric" min="0" value="' + d.q + '" data-q="' + p.id + '" aria-label="Jumlah produksi"><button class="s" data-step="5" data-id="' + p.id + '" aria-label="Tambah 5">+</button></div><div class="act"><button class="btn btn-line" data-undo="' + p.id + '">Batal</button><button class="btn btn-red" data-save="' + p.id + '">Simpan</button></div>';
    } else if (d) {
      actions = '<div class="act"><button class="btn btn-ok" disabled>✓ ' + (d.mode === 'follow' ? 'Mengikuti saran' : 'Diubah: ' + d.q + ' ' + p.u) + '</button><button class="btn btn-line" data-undo="' + p.id + '">Ubah lagi</button></div>';
    } else {
      actions = '<div class="act"><button class="btn btn-red" data-follow="' + p.id + '">Ikuti saran</button><button class="btn btn-line" data-edit="' + p.id + '">Ubah sendiri</button></div>';
    }
    return '<div class="card stock-card"><div class="head"><h3>' + p.n + '</h3><span class="badge ' + badge + '">' + label + '</span></div>' +
      '<div class="kv"><div><small>Sisa stok</small><b>' + p.sisa + ' ' + p.u + '</b></div><div class="hi"><small>Saran produksi</small><b>' + p.saran + ' ' + p.u + '</b></div></div>' +
      '<div class="why"><b>Kenapa?</b> ' + p.why + '</div>' + actions + '</div>';
  }
  V.stok = function () {
    var up = STOCK.filter(function (p) { return p.act === 'Naikkan'; }), dn = STOCK.filter(function (p) { return p.act === 'Kurangi'; });
    var rows = STOCK.map(function (p) {
      var d = S.decisions[p.id], b = p.act === 'Naikkan' ? 'b-dark' : (p.act === 'Kurangi' ? 'b-pink' : 'b-gray');
      var rec = d && d.mode === 'edit' ? '<input class="q" type="number" min="0" value="' + d.q + '" data-q="' + p.id + '" aria-label="Jumlah produksi ' + p.n + '"> ' + p.u : '<span class="rec">' + (d ? d.q : p.saran) + ' ' + p.u + '</span>';
      var acts = d && d.mode === 'edit' ? '<button class="btn btn-red" data-save="' + p.id + '">Simpan</button><button class="btn btn-line" data-undo="' + p.id + '">Batal</button>'
        : (d ? '<button class="btn btn-ok" disabled>✓ ' + (d.mode === 'follow' ? 'Diikuti' : 'Diubah') + '</button><button class="btn btn-line" data-undo="' + p.id + '">Ulang</button>'
          : '<button class="btn btn-red" data-follow="' + p.id + '">Ikuti</button><button class="btn btn-line" data-edit="' + p.id + '">Ubah</button>');
      return '<tr><td class="nm">' + p.n + '</td><td>' + p.sisa + ' ' + p.u + '</td><td>' + p.lalu + ' ' + p.u + '</td><td>' + rec + '</td><td><span class="badge ' + b + '">' + p.act + '</span></td><td class="why-t">' + p.webWhy + '</td><td><div class="acts">' + acts + '</div></td></tr>';
    }).join('');
    var web = '<div class="stock-stats"><div class="card"><div class="label">Produk perlu dinaikkan</div><b class="v">' + up.length + ' produk</b><span class="d">' + up.map(function (p) { return p.n; }).join(', ') + '</span></div>' +
      '<div class="card"><div class="label">Produk perlu dikurangi</div><b class="v">' + dn.length + ' produk</b><span class="d">' + dn.map(function (p) { return p.n; }).join(', ') + '</span></div>' +
      '<div class="card"><div class="label">Risiko kehabisan minggu lalu</div><b class="v">1 kali</b><span class="d" style="color:var(--red)">Risol Mayo, Sabtu 14.00</span></div></div>' +
      '<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Produk</th><th>Sisa stok</th><th>Produksi minggu lalu</th><th>Saran produksi</th><th>Aksi</th><th>Kenapa?</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    var mobile = '<div class="stack">' + MOBILE_ORDER.map(function (id) { return stockCardM(STOCK.filter(function (p) { return p.id === id; })[0]); }).join('') + '</div>';
    return head('Untuk minggu 10-16 November', 'Rekomendasi stok', 'Untuk minggu 10-16 November', 'Rekomendasi stok') + mw(mobile, web) +
      '<p class="foot-note">Saran dihitung dari 8 minggu data penjualan Anda. Keputusan akhir tetap di tangan Anda.</p>';
  };

  V.hpp = function () {
    var h = hppTotal(), cur = S.hpp.price, opts = priceOpts(), pick = Math.min(S.hpp.pick, 2), np = opts[pick];
    var items = S.hpp.items.map(function (it, i) {
      return '<div class="ing"><div class="n">' + (it.custom ? '<input class="nm" value="' + esc(it.n) + '" data-nm="' + i + '" aria-label="Nama bahan">' : '<span>' + esc(it.n) + '</span>') + (it.badge ? '<span class="badge b-pink" style="padding:3px 10px;font-size:11.5px">' + it.badge + '</span>' : '') + '</div>' +
        '<div class="pr"><b>Rp</b><input class="p" inputmode="numeric" value="' + (+it.p).toLocaleString('id-ID') + '" data-p="' + i + '" aria-label="Harga ' + esc(it.n) + '">' + (it.custom ? '<button class="x" data-rm="' + i + '" aria-label="Hapus bahan">×</button>' : '') + '</div></div>';
    }).join('');
    var inc = np - cur, incPct = Math.round(100 * inc / cur);
    var whyTxt = pick === 0 ? 'Harga tidak berubah. Margin tetap ' + margin(cur) + '% dan akan terus turun bila harga bahan naik.' : 'Kenaikan hanya ' + rp(inc) + ' (' + incPct + '%), ' + (margin(cur) < 25 ? 'cukup menutup kenaikan harga bahan dan ' : '') + 'menaikkan margin ke ' + margin(np) + '%.';
    var calc =
      '<div class="card"><div class="label">Bahan dan biaya per pack</div><div style="margin-top:6px">' + items + '</div><button class="add-ing" id="addIng">+ Tambah bahan</button>' +
      '<div class="total"><b>HPP per pack</b><b>' + rp(h) + '</b></div></div>';
    var pricing =
      '<div class="card"><div class="row"><div><div class="label">Harga jual sekarang</div><div class="big" style="font-size:24px;margin-top:4px">' + rp(cur) + '</div></div><div style="text-align:right"><div class="label">Margin</div><div class="big" style="font-size:24px;margin-top:4px;color:' + (margin(cur) < 25 ? 'var(--red)' : 'var(--ink)') + '">' + margin(cur) + '%</div></div></div>' +
      '<div class="label" style="margin-top:18px">Pilihan harga baru</div><div class="opts" role="radiogroup" aria-label="Pilihan harga baru">' + opts.map(function (o, i) { return '<button class="opt" role="radio" aria-checked="' + (i === pick) + '" data-pick="' + i + '"><b>' + rp(o) + '</b><small>margin ' + margin(o) + '%</small></button>'; }).join('') + '</div>' +
      '<div class="why"><b>Kenapa ' + rp(np) + '?</b> ' + whyTxt + '</div>' +
      '<button class="btn btn-red btn-block" id="saveHpp" style="margin-top:14px"' + (pick === 0 ? ' disabled style="opacity:.5;margin-top:14px"' : '') + '>Simpan harga baru</button></div>';
    return head('Dimsum Ayam · isi 10 per pack', 'Kalkulator HPP', 'Dimsum Ayam · isi 10 per pack', 'Kalkulator HPP') +
      '<div class="two-col"><div class="stack">' + calc + '</div><div class="stack">' + pricing + '</div></div>' +
      '<p class="foot-note">Ketuk harga bahan untuk mengubahnya. Margin dihitung dari harga jual dikurangi HPP.</p>';
  };

  var catTab = 'cepat';
  V.catat = function () {
    var tabs = '<div class="seg" role="tablist"><button role="tab" aria-selected="' + (catTab === 'cepat') + '" data-ct="cepat">Isi cepat</button><button role="tab" aria-selected="' + (catTab === 'foto') + '" data-ct="foto">Foto nota</button><button role="tab" aria-selected="' + (catTab === 'impor') + '" data-ct="impor">Impor</button></div>';
    var pane = '';
    if (catTab === 'cepat') {
      pane = '<div class="card"><form id="saleForm" novalidate><label class="field"><span>Produk</span><select name="n">' + PRODUCTS.map(function (p) { return '<option>' + p.n + '</option>'; }).join('') + '</select></label><div class="two"><label class="field"><span>Jumlah terjual</span><input name="q" type="number" inputmode="numeric" min="1" placeholder="mis. 24" required></label><label class="field"><span>Harga per pcs (Rp)</span><input name="p" type="number" inputmode="numeric" min="0" placeholder="mis. 3500" required></label></div><button class="btn btn-red btn-block" type="submit">Simpan catatan</button></form></div>' +
        '<div class="card"><div class="label" style="margin-bottom:6px">Catatan terbaru</div><div class="list">' + S.sales.slice(0, 6).map(function (s) { return '<div><span><b>' + esc(s.n) + '</b><br><small>' + s.d + ' · ' + s.q + ' terjual</small></span><b>' + rp(s.q * s.p) + '</b></div>'; }).join('') + '</div></div>';
    } else if (catTab === 'foto') {
      pane = '<div class="card"><label class="drop" for="nota">' + ic('camera') + '<b>Foto nota atau catatan tulis</b><span>Ambil foto, lalu laku.ai membaca produk dan jumlahnya.</span><span class="btn btn-red btn-sm" style="margin-top:4px">Ambil / pilih foto</span></label><input id="nota" type="file" accept="image/*" capture="environment" class="sr"><div id="notaOut"></div></div>' +
        '<p class="foot-note" style="text-align:left">Hasil bacaan selalu bisa Anda cek dan ubah sebelum disimpan. Pembacaan otomatis di prototipe ini berupa contoh.</p>';
    } else {
      pane = '<div class="card"><div class="src"><div class="ic">XLS</div><div class="t"><b>Excel / CSV</b><small>Kolom: produk, jumlah, harga</small></div><label class="btn btn-line btn-sm" for="csv">Pilih file</label><input id="csv" type="file" accept=".csv,text/csv" class="sr"></div>' +
        '<div class="src"><div class="ic">POS</div><div class="t"><b>Aplikasi kasir</b><small>Impor penjualan otomatis dari POS</small></div><span class="badge b-gray">Segera</span></div>' +
        '<div class="src"><div class="ic">GF</div><div class="t"><b>GoFood, GrabFood, ShopeeFood</b><small>Tarik laporan penjualan marketplace</small></div><span class="badge b-gray">Segera</span></div></div>' +
        '<p class="foot-note" style="text-align:left">Mulai dari 3-5 produk utama. Input ringan lebih penting daripada pembukuan penuh.</p>';
    }
    return head('Foto nota, isi cepat, atau impor', 'Catat penjualan', 'Foto nota, isi cepat, atau impor dari aplikasi kasir dan marketplace', 'Catat penjualan') +
      '<div style="max-width:640px"><div class="stack">' + tabs + pane + '</div></div>';
  };

  V.roadmap = function () {
    var ph = [
      { t: 'Bulan 1-3', h: 'Jaga margin', now: 1, l: ['Hitung ulang HPP setiap bulan', 'Naikkan harga Dimsum Ayam sesuai saran', 'Target margin kotor kembali ke 36%'] },
      { t: 'Bulan 4-6', h: 'Perkuat produk unggulan', l: ['Promosi Risol Mayo di Jumat-Minggu', 'Produksi mengikuti rekomendasi stok', 'Target omzet Rp15 jt per bulan'] },
      { t: 'Bulan 7-9', h: 'Cek kesiapan cabang', l: ['Pencatatan konsisten 6 bulan', 'Margin stabil di atas 35%', 'Hitung modal dan titik impas cabang'] },
      { t: 'Bulan 10-12', h: 'Pola franchise', l: ['Standarkan resep dan HPP', 'Susun SOP produksi dan kemasan', 'Uji dengan satu mitra percontohan'] }
    ];
    function meter(k, v, items) { return '<div class="card"><div class="row"><b style="font-size:16px">' + k + '</b><span class="badge b-gray lock">Modul lanjut</span></div><div class="meter"><div class="row"><span class="sub">Tingkat kesiapan</span><b>' + v + '%</b></div><div class="track"><i style="width:' + v + '%"></i></div></div>' + items.map(function (c) { return '<div class="check' + (c[0] ? ' done' : '') + '"><i>' + (c[0] ? ic('check', 3) : '') + '</i><span>' + c[1] + '</span></div>'; }).join('') + '</div>'; }
    return head('Rencana 3-12 bulan', 'Roadmap usaha', 'Rencana 3-12 bulan dan kesiapan cabang atau franchise', 'Roadmap usaha') +
      '<div class="two-col"><div class="card"><div class="label" style="margin-bottom:14px">Rencana 12 bulan</div><div class="tl">' + ph.map(function (p) { return '<div class="ph' + (p.now ? ' now' : '') + '"><small>' + p.t + (p.now ? ' · sekarang' : '') + '</small><h3>' + p.h + '</h3><ul>' + p.l.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div></div>' +
      '<div class="stack">' + meter('Kesiapan buka cabang', 48, [[1, 'Pencatatan penjualan konsisten 8 minggu'], [1, 'Omzet naik 3 bulan berturut-turut'], [0, 'Margin kotor di atas 35% (sekarang 34%)'], [0, 'Omzet di atas Rp15 jt per bulan (sekarang Rp12,4 jt)']]) +
      meter('Kesiapan franchise', 25, [[1, 'Produk unggulan jelas (Risol Mayo, 38% omzet)'], [0, 'Resep dan HPP terstandar untuk semua produk'], [0, 'SOP produksi tertulis'], [0, 'Satu cabang berjalan stabil']]) +
      '<p class="foot-note" style="text-align:left">Cabang dan franchise adalah modul tahap lanjut, ditampilkan penuh setelah usaha stabil. Angka di atas contoh perhitungan.</p></div></div>';
  };

  var deferredInstall = null;
  V.akun = function () {
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var install = standalone ? '' : '<div class="card install"><div class="label" style="color:var(--red)">Pasang aplikasi</div><h3 style="font-size:17px;margin:6px 0 6px">Jadikan ikon di layar utama</h3>' +
      (ios ? '<ol><li>Ketuk tombol <b>Bagikan</b> di Safari</li><li>Pilih <b>Tambah ke Layar Utama</b></li><li>Ketuk <b>Tambah</b></li></ol>'
        : '<p class="sub" style="color:var(--ink-2)">Buka laku.ai langsung dari layar utama, tanpa toko aplikasi.</p><button class="btn btn-red btn-block" id="installBtn" style="margin-top:12px">Pasang di Android</button><p class="sub" style="margin-top:8px;font-size:12px">iPhone: ketuk Bagikan, lalu Tambah ke Layar Utama.</p>') + '</div>';
    var sw = function (k, v) { return '<button class="switch" role="switch" aria-checked="' + v + '" data-pref="' + k + '"></button>'; };
    return '<div class="pagehead"><div><div class="eyebrow">Pengaturan dan paket</div><h1 class="h1">Akun</h1></div></div>' +
      '<div class="acc-grid"><div class="stack">' +
      '<div class="card profile"><div class="avatar">BS</div><div><b style="font-size:17px">' + BIZ.name + '</b><div class="sub">' + BIZ.owner + ' · ' + BIZ.type + ' · ' + BIZ.city + '</div></div></div>' +
      '<div class="planbox"><div class="label">Paket aktif</div><h3>Klinik Pro</h3><div style="color:#B0BEC5;font-size:13.5px">Uji coba 14 hari · lalu Rp49.000/bulan</div><ul><li>Cek kesehatan pendapatan</li><li>Tren penjualan dan produk unggulan</li><li>Rekomendasi stok per produk</li><li>Roadmap 3-12 bulan</li></ul></div>' + install + '</div>' +
      '<div class="stack"><div class="card"><div class="label">Pengingat</div><div class="menu">' +
      '<div><span><b>Ringkasan mingguan WhatsApp</b><small>Skor dan saran stok tiap Senin pagi</small></span>' + sw('wa', S.prefs.wa) + '</div>' +
      '<div><span><b>Peringatan dini</b><small>Margin turun atau stok berisiko habis</small></span>' + sw('alert', S.prefs.alert) + '</div></div></div>' +
      '<div class="card"><div class="label">Privasi dan kepercayaan</div><div class="menu">' +
      '<div><span><b>Saran selalu disertai alasan dan data</b><small>Tidak ada saran yang dijalankan otomatis</small></span><span class="badge b-ok">Aktif</span></div>' +
      '<button data-toast="Data usaha hanya dipakai untuk analisis akun Anda dan tidak dibagikan ke pihak lain."><span><b>Perlindungan data usaha</b><small>Bagaimana data Anda dipakai</small></span>' + ic('chev', 2) + '</button>' +
      '<button data-export><span><b>Unduh data saya</b><small>Catatan penjualan dan HPP (JSON)</small></span>' + ic('chev', 2) + '</button></div></div>' +
      '<div class="card"><div class="label">Bantuan</div><div class="menu"><button data-toast="Panduan video segera hadir."><span><b>Panduan dan webinar</b></span>' + ic('chev', 2) + '</button><button data-toast="Chat WhatsApp laku.ai segera hadir."><span><b>Chat WhatsApp</b></span>' + ic('chev', 2) + '</button><a href="#/roadmap"><span><b>Roadmap usaha</b><small>Cabang dan franchise (modul lanjut)</small></span>' + ic('chev', 2) + '</a></div></div></div></div>';
  };

  /* ---------- routing ---------- */
  var NAV = [
    { id: 'beranda', path: '/', label: 'Beranda', icon: 'home', tab: 1 },
    { id: 'tren', path: '/tren', label: 'Tren penjualan', short: 'Tren', icon: 'trend', tab: 1 },
    { id: 'stok', path: '/stok', label: 'Rekomendasi stok', short: 'Stok', icon: 'box', tab: 1 },
    { id: 'hpp', path: '/hpp', label: 'Kalkulator HPP', short: 'HPP', icon: 'hpp', tab: 1 },
    { id: 'catat', path: '/catat', label: 'Catat penjualan', icon: 'plus' },
    { id: 'roadmap', path: '/roadmap', label: 'Roadmap usaha', icon: 'flag' },
    { id: 'akun', path: '/akun', label: 'Akun', icon: 'user', tab: 1, only: 'tab' }
  ];
  function route() { var h = location.hash.replace(/^#/, '') || '/'; return h.split('?')[0]; }
  function activeId(r) { if (r === '/diagnosis') return 'beranda'; var n = NAV.filter(function (x) { return x.path === r; })[0]; return n ? n.id : 'beranda'; }
  function renderNav(act) {
    $('#sideNav').innerHTML = NAV.filter(function (n) { return n.only !== 'tab'; }).map(function (n) { return '<a href="#' + n.path + '"' + (n.id === act ? ' aria-current="page"' : '') + '>' + ic(n.icon) + n.label + '</a>'; }).join('');
    $('#tabbar').innerHTML = NAV.filter(function (n) { return n.tab; }).map(function (n) { return '<a class="tab" href="#' + n.path + '"' + (n.id === act ? ' aria-current="page"' : '') + '>' + ic(n.icon, n.id === act ? 2.2 : 1.8) + '<span>' + (n.short || n.label) + '</span></a>'; }).join('');
  }
  var TITLES = { beranda: 'Beranda', tren: 'Tren penjualan', stok: 'Rekomendasi stok', hpp: 'Kalkulator HPP', catat: 'Catat penjualan', roadmap: 'Roadmap usaha', akun: 'Akun' };
  function render(keepScroll) {
    var r = route(), act = activeId(r), key = r === '/diagnosis' ? 'diagnosis' : act;
    var v = $('#view'), y = window.scrollY;
    v.innerHTML = V[key]();
    v.classList.remove('view-in'); void v.offsetWidth; if (!keepScroll) v.classList.add('view-in');
    renderNav(act);
    document.title = (key === 'diagnosis' ? 'Diagnosis' : TITLES[act]) + ' · laku.ai';
    window.scrollTo(0, keepScroll ? y : 0);
  }
  window.addEventListener('hashchange', function () { render(); });

  /* ---------- interaksi (delegasi) ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-follow],[data-edit],[data-undo],[data-save],[data-step],[data-pick],[data-ct],[data-pref],[data-toast],[data-export],[data-rm],#addIng,#saveHpp,#installBtn');
    if (!t) return;
    var d = t.dataset, stockOf = function (id) { return STOCK.filter(function (p) { return p.id === id; })[0]; };
    if (d.follow) { var p = stockOf(d.follow); S.decisions[p.id] = { mode: 'follow', q: p.saran }; save(); render(true); toast('Saran ' + p.n + ' diikuti: ' + p.saran + ' ' + p.u); }
    else if (d.edit) { var p2 = stockOf(d.edit); S.decisions[p2.id] = { mode: 'edit', q: p2.saran }; render(true); }
    else if (d.undo) { delete S.decisions[d.undo]; save(); render(true); }
    else if (d.step) { var dd = S.decisions[d.id]; dd.q = Math.max(0, (+dd.q || 0) + (+d.step)); render(true); }
    else if (d.save) { var q = S.decisions[d.save]; q.mode = 'custom'; save(); render(true); toast('Jumlah produksi disimpan'); }
    else if (d.pick !== undefined) { S.hpp.pick = +d.pick; render(true); }
    else if (t.id === 'addIng') { S.hpp.items.push({ n: 'Bahan baru', p: 0, custom: true }); save(); render(true); var ni = $('[data-nm="' + (S.hpp.items.length - 1) + '"]'); if (ni) { ni.focus(); ni.select(); } }
    else if (d.rm !== undefined) { S.hpp.items.splice(+d.rm, 1); save(); render(true); }
    else if (t.id === 'saveHpp') { var np = priceOpts()[S.hpp.pick]; S.hpp.price = np; S.hpp.pick = 1; save(); render(true); toast('Harga baru ' + rp(np) + ' disimpan · margin ' + margin(np) + '%'); }
    else if (d.ct) { catTab = d.ct; render(true); }
    else if (d.pref) { S.prefs[d.pref] = !S.prefs[d.pref]; save(); render(true); }
    else if (d.toast) { toast(d.toast); }
    else if (d.export !== undefined) { try { var b = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'data-laku-ai.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); } catch (er) { toast('Tidak bisa mengunduh di perangkat ini'); } }
    else if (t.id === 'installBtn') { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } else toast('Buka menu browser, lalu pilih "Instal aplikasi" atau "Tambahkan ke layar utama".'); }
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.q) { S.decisions[t.dataset.q].q = Math.max(0, +t.value || 0); }
    if (t.dataset.p !== undefined) { var v = parseInt(String(t.value).replace(/\D/g, ''), 10) || 0; S.hpp.items[+t.dataset.p].p = v; save(); var pos = document.activeElement === t; render(true); var n = $('[data-p="' + t.dataset.p + '"]'); if (n && pos) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
    if (t.dataset.nm !== undefined) { S.hpp.items[+t.dataset.nm].n = t.value; save(); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'month' && t.selectedIndex === 1) { toast('Arsip bulan sebelumnya tersedia di rilis beta.'); t.selectedIndex = 0; }
    if (t.id === 'nota' && t.files && t.files[0]) {
      var url = URL.createObjectURL(t.files[0]);
      $('#notaOut').innerHTML = '<img class="preview" alt="Foto nota" src="' + url + '"><div class="label" style="margin:16px 0 4px">Contoh hasil bacaan</div><div class="list"><div><span><b>Risol Mayo</b><br><small>30 pcs × Rp3.500</small></span><b>Rp105.000</b></div><div><span><b>Dimsum Ayam</b><br><small>4 pack × Rp45.000</small></span><b>Rp180.000</b></div></div><button class="btn btn-red btn-block" id="notaOk" style="margin-top:12px">Simpan 2 catatan</button>';
      $('#notaOk').onclick = function () { S.sales.unshift({ d: 'Hari ini', n: 'Risol Mayo', q: 30, p: 3500 }, { d: 'Hari ini', n: 'Dimsum Ayam', q: 4, p: 45000 }); save(); toast('2 catatan dari nota disimpan'); catTab = 'cepat'; render(true); };
    }
    if (t.id === 'csv' && t.files && t.files[0]) {
      var fr = new FileReader();
      fr.onload = function () {
        var rows = String(fr.result).split(/\r?\n/).map(function (l) { return l.split(/[;,\t]/); }).filter(function (c) { return c.length >= 3 && !isNaN(+c[1]) && !isNaN(+c[2]) && c[1] !== ''; });
        if (!rows.length) { toast('Tidak ada baris valid. Pakai kolom: produk, jumlah, harga.'); return; }
        rows.forEach(function (c) { S.sales.unshift({ d: 'Impor', n: c[0].trim(), q: +c[1], p: +c[2] }); });
        save(); toast(rows.length + ' baris diimpor'); catTab = 'cepat'; render(true);
      };
      fr.readAsText(t.files[0]);
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'saleForm') return;
    e.preventDefault();
    var f = e.target, q = +f.q.value, p = +f.p.value;
    if (!(q > 0) || !(p >= 0) || f.p.value === '') { toast('Isi jumlah dan harga dengan benar.'); return; }
    S.sales.unshift({ d: 'Hari ini', n: f.n.value, q: q, p: p }); save(); render(true); toast('Catatan disimpan: ' + rp(q * p));
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches && e.target.matches('input.p')) e.target.blur(); });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });

  /* ---------- service worker (offline / PWA) ---------- */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('../sw.js', { scope: './' }).catch(function () {}); });
  }

  render();
})();
