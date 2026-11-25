/* LakuSeed: data contoh 8 minggu (ditandai sumber "contoh", bisa dihapus sekali klik).
   Deterministik; angka dibuat sepadan dengan deck (omzet ±Rp12 jt per 30 hari, margin ±34%). */
(function (root) {
  'use strict';
  var A = root.LakuAnalytics;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function uid(p) { var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = ''; for (var i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return p + '_' + s; }
  var PRODUK = [
    { k: 'risol', nama: 'Risol Mayo', satuan: 'pcs', harga: 10000, stok: 35, lalu: 80, s0: .33, s1: .38, bahan: [['Tepung dan kulit', 2200], ['Isi ayam dan sayur', 2300], ['Mayo dan telur', 900], ['Kemasan', 500]] },
    { k: 'dimsum', nama: 'Dimsum Ayam', satuan: 'pack', harga: 45000, stok: 8, lalu: 16, s0: .26, s1: .24, bahan: [['Daging ayam 500 g', 22000], ['Kulit dan tepung', 6500], ['Bumbu', 3000], ['Kemasan', 2500], ['Gas dan listrik', 1500]] },
    { k: 'nugget', nama: 'Nugget Sayur', satuan: 'pack', harga: 28000, stok: 9, lalu: 14, s0: .17, s1: .18, bahan: [['Sayur dan tepung', 11000], ['Bumbu', 2400], ['Kemasan', 2500], ['Gas dan listrik', 2000]] },
    { k: 'siomay', nama: 'Siomay Ikan', satuan: 'pack', harga: 30000, stok: 30, lalu: 20, s0: .16, s1: .12, bahan: [['Ikan', 13000], ['Tepung', 3500], ['Bumbu', 2200], ['Kemasan', 2000]] },
    { k: 'lumpia', nama: 'Lumpia Udang', satuan: 'pack', harga: 25000, stok: 7, lalu: 10, s0: .08, s1: .08, bahan: [['Udang', 9500], ['Kulit lumpia', 3250], ['Bumbu', 2000], ['Kemasan', 2000]] }
  ];
  var WEEK_OM = [2.4, 2.5, 2.7, 2.6, 2.6, 2.9, 2.8, 3.3], WD = [.7, .7, .8, .9, 1.3, 1.6, 1.4];
  var HEAT = [[.1, .1, .15, .15, .3, .4, .35], [.35, .35, .4, .45, .7, .9, .8], [.3, .3, .35, .4, .8, 1, .85], [.15, .15, .2, .25, .55, .6, .5]];
  var CH = [['toko', .46], ['wa', .28], ['reseller', .18], ['gofood', .08]];
  var HIST = { 'Daging ayam 500 g': [19600, 19600, 20000, 20800, 21500], 'Kemasan': [2400, 2400, 2500, 2500, 2500], 'Kulit dan tepung': [6300, 6300, 6400, 6400, 6500], 'Bumbu': [3000, 3000, 3000, 3000, 3000] };

  function make(today) {
    today = today || A.ymd(new Date());
    var R = rng(20261104), pick = function (arr, w) { var r = R() * arr.reduce(function (a, x) { return a + x[w]; }, 0), c = 0; for (var i = 0; i < arr.length; i++) { c += arr[i][w]; if (r <= c) return arr[i]; } return arr[arr.length - 1]; };
    var produk = PRODUK.map(function (p) {
      return { id: uid('p'), k: p.k, nama: p.nama, satuan: p.satuan, harga: p.harga, hpp: p.bahan.reduce(function (a, b) { return a + b[1]; }, 0), stok: p.stok, produksiLalu: p.lalu, sumber: 'contoh', s0: p.s0, s1: p.s1,
        bahan: p.bahan.map(function (b) { return { id: uid('m'), nama: b[0], harga: b[1] }; }) };
    });
    var promoDef = [['Diskon Risol Mayo', 'risol', -20, -7, 1.1], ['Gratis ongkir via WhatsApp', '', -13, -6, 1.04], ['Bundling Dimsum + Siomay', 'dimsum', -27, -14, 1]];
    var promosi = promoDef.map(function (d) { var pr = produk.filter(function (p) { return p.k === d[1]; })[0]; return { id: uid('r'), nama: d[0], produkId: pr ? pr.id : '', mulai: A.addDays(today, d[2]), selesai: A.addDays(today, d[3]), sumber: 'contoh', mult: d[4], k: d[1] }; });
    var sales = [];
    for (var back = 62; back >= 0; back--) {
      var date = A.addDays(today, -back), wi = Math.max(0, 7 - Math.floor(back / 7)), dw = A.dow(date), t = wi / 7;
      var dayOm = WEEK_OM[Math.min(7, wi)] * 1e6 * WD[dw] / 7.4 * (0.9 + 0.2 * R());
      produk.forEach(function (p) {
        var share = p.s0 + (p.s1 - p.s0) * t, qty = dayOm * share / p.harga * (0.85 + 0.3 * R()), m = 1;
        promosi.forEach(function (pr) { if (date >= pr.mulai && date <= pr.selesai && (!pr.k || pr.k === p.k)) m *= pr.mult; });
        qty = Math.round(qty * m); if (qty <= 0) return;
        var k = qty >= 12 ? 5 : (qty >= 7 ? 4 : (qty >= 4 ? 3 : (qty >= 2 ? 2 : 1))), base = Math.floor(qty / k), extra = qty - base * k;
        for (var i = 0; i < k; i++) {
          var q = base + (i < extra ? 1 : 0); if (q <= 0) continue;
          var slot = pick(HEAT.map(function (r, s) { return { s: s, w: r[dw] }; }), 'w').s, hr = [6, 10, 14, 18][slot] + Math.floor(R() * 4), mn = Math.floor(R() * 60);
          sales.push({ id: uid('t'), tanggal: date, jam: (hr < 10 ? '0' : '') + hr + ':' + (mn < 10 ? '0' : '') + mn, produkId: p.id, qty: q, harga: p.harga, kanal: pick(CH, 1)[0], sumber: 'contoh' });
        }
      });
    }
    var hist = [], steps = [-150, -120, -90, -60, -30];
    produk.forEach(function (p) { p.bahan.forEach(function (b) { var h = HIST[b.nama]; if (h) steps.forEach(function (d, i) { hist.push({ produkId: p.id, nama: b.nama, harga: h[i], tanggal: A.addDays(today, d) }); }); }); });
    return { produk: produk.filter(function (p) { return delete p.s0 && delete p.s1; }).map(function (p) { delete p.k; return p; }), promosi: promosi.map(function (p) { return { id: p.id, nama: p.nama, produkId: p.produkId, mulai: p.mulai, selesai: p.selesai, sumber: 'contoh' }; }), penjualan: sales, hargaBahan: hist };
  }
  root.LakuSeed = { make: make, uid: uid };
})(typeof self !== 'undefined' ? self : this);
