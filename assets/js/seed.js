/* LakuSeed: data contoh 8 minggu (ditandai sumber "contoh", bisa dihapus sekali klik).
   Deterministik; angka dibuat sepadan dengan deck (omzet ±Rp12 jt per 30 hari, margin ±34%). */
(function (root) {
  'use strict';
  var A = root.LakuAnalytics;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function uid(p) { var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = ''; for (var i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return p + '_' + s; }
  /* Bahan baku (satuan dasar, stok, harga beli per kemasan). Harga per satuan = hargaBeli / isiBeli. */
  var BAHAN = {
    ayam: ['Daging ayam', 'gram', 9000, 44000, 1000, 1500], tepung: ['Tepung terigu', 'gram', 27000, 13000, 1000, 3000], mayo: ['Mayo', 'gram', 3000, 40000, 1000, 500],
    sayur: ['Sayur campur', 'gram', 6000, 25000, 1000, 1000], bumbu: ['Bumbu dasar', 'gram', 2500, 15000, 500, 500], ikan: ['Ikan giling', 'gram', 9000, 52000, 1000, 1500],
    udang: ['Udang', 'gram', 1500, 95000, 1000, 1500], kulit: ['Kulit lumpia', 'lembar', 40, 16250, 25, 10]
  };
  var PRODUK = [
    { k: 'risol', nama: 'Risol Mayo', satuan: 'pcs', harga: 10000, stok: 35, lalu: 80, s0: .33, s1: .38, resep: [['tepung', 150], ['ayam', 50], ['mayo', 20]], flat: [['Kemasan', 500], ['Gas dan listrik', 450]] },
    { k: 'dimsum', nama: 'Dimsum Ayam', satuan: 'pack', harga: 45000, stok: 8, lalu: 16, s0: .26, s1: .24, resep: [['ayam', 500], ['tepung', 500], ['bumbu', 100]], flat: [['Kemasan', 2500], ['Gas dan listrik', 1500]] },
    { k: 'nugget', nama: 'Nugget Sayur', satuan: 'pack', harga: 28000, stok: 9, lalu: 14, s0: .17, s1: .18, resep: [['sayur', 320], ['tepung', 300], ['bumbu', 50]], flat: [['Kemasan', 2500], ['Gas dan listrik', 2000]] },
    { k: 'siomay', nama: 'Siomay Ikan', satuan: 'pack', harga: 30000, stok: 30, lalu: 20, s0: .16, s1: .12, resep: [['ikan', 250], ['tepung', 250], ['bumbu', 70]], flat: [['Kemasan', 2000], ['Gas dan listrik', 350]] },
    { k: 'lumpia', nama: 'Lumpia Udang', satuan: 'pack', harga: 25000, stok: 7, lalu: 10, s0: .08, s1: .08, resep: [['udang', 100], ['kulit', 5]], flat: [['Bumbu', 2000], ['Kemasan', 2000]] }
  ];
  var WEEK_OM = [2.4, 2.5, 2.7, 2.6, 2.6, 2.9, 2.8, 3.3], WD = [.7, .7, .8, .9, 1.3, 1.6, 1.4];
  var HEAT = [[.1, .1, .15, .15, .3, .4, .35], [.35, .35, .4, .45, .7, .9, .8], [.3, .3, .35, .4, .8, 1, .85], [.15, .15, .2, .25, .55, .6, .5]];
  var CH = [['toko', .46], ['wa', .28], ['reseller', .18], ['gofood', .08]];
  var HIST = { 'Daging ayam': [39.2, 39.2, 40, 41.6, 43], 'Tepung terigu': [12, 12, 12.5, 12.5, 12.8] };   // harga per satuan dasar

  function make(today) {
    today = today || A.ymd(new Date());
    var R = rng(20261104), pick = function (arr, w) { var r = R() * arr.reduce(function (a, x) { return a + x[w]; }, 0), c = 0; for (var i = 0; i < arr.length; i++) { c += arr[i][w]; if (r <= c) return arr[i]; } return arr[arr.length - 1]; };
    var bahanBaku = {}, bbList = [];
    Object.keys(BAHAN).forEach(function (k) { var d = BAHAN[k], o = { id: uid('bb'), nama: d[0], satuan: d[1], stok: d[2], hargaBeli: d[3], isiBeli: d[4], minStok: d[5], sumber: 'contoh' }; bahanBaku[k] = o; bbList.push(o); });
    var byIdB = {}; bbList.forEach(function (b) { byIdB[b.id] = b; });
    var produk = PRODUK.map(function (p) {
      var o = { id: uid('p'), k: p.k, nama: p.nama, satuan: p.satuan, harga: p.harga, stok: p.stok, produksiLalu: p.lalu, sumber: 'contoh', s0: p.s0, s1: p.s1, hasil: 1,
        resep: p.resep.map(function (r) { return { bahanId: bahanBaku[r[0]].id, qty: r[1] }; }), bahan: p.flat.map(function (b) { return { id: uid('m'), nama: b[0], harga: b[1] }; }) };
      o.hpp = root.LakuCore ? root.LakuCore.hppFromResep(o, byIdB) : 0;
      return o;
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
    bbList.forEach(function (b) { var h = HIST[b.nama]; if (h) steps.forEach(function (d, i) { hist.push({ produkId: '', nama: b.nama, harga: h[i], tanggal: A.addDays(today, d) }); }); });
    return { bahanBaku: bbList, produk: produk.filter(function (p) { return delete p.s0 && delete p.s1; }).map(function (p) { delete p.k; return p; }), promosi: promosi.map(function (p) { return { id: p.id, nama: p.nama, produkId: p.produkId, mulai: p.mulai, selesai: p.selesai, sumber: 'contoh' }; }), penjualan: sales, hargaBahan: hist };
  }
  root.LakuSeed = { make: make, uid: uid };
})(typeof self !== 'undefined' ? self : this);
