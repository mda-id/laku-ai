/* LakuAnalytics: semua angka dashboard dihitung dari catatan penjualan, produk, dan bahan milik akun.
   Murni fungsi (tanpa DOM), bisa diuji di Node. */
(function (root) {
  'use strict';
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  function ymd(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function parse(s) { return new Date(s + 'T12:00:00'); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); }
  function diff(a, b) { return Math.round((parse(a) - parse(b)) / 864e5); }
  function dow(s) { return (parse(s).getDay() + 6) % 7; }                 // 0 = Senin
  function mondayOf(s) { return addDays(s, -dow(s)); }
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var sum = function (a, f) { var t = 0; for (var i = 0; i < a.length; i++) t += f(a[i]); return t; };
  var pct = function (a, b) { return b > 0 ? (a - b) / b : null; };
  var COV_LOW = 3.5, COV_HIGH = 10;   // cakupan stok (hari): di bawah = rawan habis, di atas = menumpuk
  var SLOTS = [['Pagi', '06-10', 0, 10], ['Siang', '10-14', 10, 14], ['Sore', '14-18', 14, 18], ['Malam', '18-22', 18, 24]];
  var slotOf = function (jam) { var h = parseInt(String(jam).slice(0, 2), 10) || 12; for (var i = 0; i < 4; i++) if (h < SLOTS[i][3]) return i; return 3; };
  var DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], DAYS_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  var rp = function (n) { return 'Rp' + Math.round(n).toLocaleString('id-ID'); };
  var jt = function (n) { return 'Rp' + (Math.round(n / 1e5) / 10).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' jt'; };

  function label(v) { return v >= 80 ? 'Baik' : (v >= 60 ? 'Cukup' : 'Perlu dijaga'); }

  function compute(S, opt) {
    opt = opt || {};
    var today = opt.today || root.LAKU_TODAY || ymd(new Date()), days = opt.days || 30;
    var produk = S.produk || [], byId = {}; produk.forEach(function (p) { byId[p.id] = p; });
    var sales = (S.penjualan || []).filter(function (r) { return byId[r.produkId]; }).map(function (r) {
      var p = byId[r.produkId], om = r.qty * r.harga; return { t: r.tanggal, jam: r.jam, pid: r.produkId, qty: r.qty, om: om, known: p.hpp > 0, laba: p.hpp > 0 ? r.qty * (r.harga - p.hpp) : 0, kanal: r.kanal, dow: dow(r.tanggal), id: r.id };
    });
    var targetM = (S.usaha && S.usaha.targetMargin) || 35, targetO = (S.usaha && S.usaha.targetOmzet) || 15e6;
    var inR = function (a, b) { return sales.filter(function (r) { return r.t >= a && r.t <= b; }); };
    var first = sales.length ? sales.reduce(function (m, r) { return r.t < m ? r.t : m; }, sales[0].t) : null;
    var daysOfData = first ? diff(today, first) + 1 : 0;

    var cur = inR(addDays(today, -(days - 1)), today), prev = inR(addDays(today, -(2 * days - 1)), addDays(today, -days));
    var K = function (L) { var om = sum(L, function (r) { return r.om; }), omK = sum(L, function (r) { return r.known ? r.om : 0; }), lb = sum(L, function (r) { return r.laba; }); return { omzet: om, knownOm: omK, laba: lb, margin: omK > 0 ? lb / omK : 0, trx: L.length, aov: L.length ? om / L.length : 0, qty: sum(L, function (r) { return r.qty; }) }; };
    var kc = K(cur), kp = K(prev);
    var kpi = { cur: kc, prev: kp, d: { omzet: pct(kc.omzet, kp.omzet), laba: pct(kc.laba, kp.laba), margin: prev.length ? (kc.margin - kp.margin) * 100 : null, trx: pct(kc.trx, kp.trx), aov: pct(kc.aov, kp.aov), qty: pct(kc.qty, kp.qty) } };

    // mingguan (8 minggu, 7 hari bergulir berakhir hari ini)
    var weekly = [], wkQty = {}; produk.forEach(function (p) { wkQty[p.id] = []; });
    for (var w = 0; w < 8; w++) {
      var to = addDays(today, -7 * (7 - w)), from = addDays(to, -6), L = inR(from, to);
      weekly.push(sum(L, function (r) { return r.om; }));
      produk.forEach(function (p) { wkQty[p.id].push(sum(L, function (r) { return r.pid === p.id ? r.qty : 0; })); });
    }
    var n = 8, sx = 0, sy = 0, sxy = 0, sxx = 0;
    weekly.forEach(function (v, i) { sx += i; sy += v; sxy += i * v; sxx += i * i; });
    var slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1), icpt = (sy - slope * sx) / n;
    var fc = Math.max(0, icpt + slope * 8), resid = Math.sqrt(weekly.reduce(function (a, v, i) { var e = v - (icpt + slope * i); return a + e * e; }, 0) / n);
    var mean = sy / n, sd = Math.max(resid, mean * 0.04);
    var forecast = { value: fc, lo: Math.max(0, fc - 1.2 * sd), hi: fc + 1.2 * sd, ok: sales.length > 0 && daysOfData >= 14 };
    var prevWeekly = []; for (var w2 = 0; w2 < 8; w2++) { var to2 = addDays(today, -7 * (7 - w2) - 56), L2 = inR(addDays(to2, -6), to2); prevWeekly.push(sum(L2, function (r) { return r.om; })); }

    // harian
    var daily = []; for (var d = days - 1; d >= 0; d--) { var ds = addDays(today, -d); daily.push({ t: ds, dow: dow(ds), v: sum(cur.filter(function (r) { return r.t === ds; }), function (r) { return r.om; }) }); }
    var wkendShare = (function () { var L = inR(addDays(today, -55), today), tot = sum(L, function (r) { return r.om; }); return tot ? sum(L.filter(function (r) { return r.dow >= 4; }), function (r) { return r.om; }) / tot : 0; })();

    // heatmap waktu ramai (selalu 8 minggu)
    var heatRaw = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
    inR(addDays(today, -55), today).forEach(function (r) { heatRaw[slotOf(r.jam)][r.dow] += r.om; });
    var hmax = Math.max.apply(0, heatRaw.reduce(function (a, r) { return a.concat(r); }, [0])) || 1;
    var heat = heatRaw.map(function (r) { return r.map(function (v) { return v / hmax; }); }), peak = { s: 0, d: 0 };
    heat.forEach(function (r, s) { r.forEach(function (v, d2) { if (v >= heat[peak.s][peak.d]) peak = { s: s, d: d2 }; }); });

    // kanal
    var chOm = { toko: 0, wa: 0, reseller: 0, lain: 0 }; cur.forEach(function (r) { chOm[(r.kanal in chOm) ? r.kanal : 'lain'] += r.om; });
    var chTot = sum(cur, function (r) { return r.om; }) || 1;
    var channels = [['Toko sendiri', chOm.toko / chTot], ['WhatsApp', chOm.wa / chTot], ['Reseller', chOm.reseller / chTot], ['GoFood / marketplace', chOm.lain / chTot]];

    // produk
    var prods = produk.map(function (p) {
      var L = cur.filter(function (r) { return r.pid === p.id; }), Lp = prev.filter(function (r) { return r.pid === p.id; });
      var om = sum(L, function (r) { return r.om; }), omK = sum(L, function (r) { return r.known ? r.om : 0; }), lb = sum(L, function (r) { return r.laba; }), omp = sum(Lp, function (r) { return r.om; });
      var wq = wkQty[p.id], q4 = sum(wq.slice(4), function (v) { return v; }) / 4, q4p = sum(wq.slice(0, 4), function (v) { return v; }) / 4;
      var tr = q4p > 0 ? (q4 - q4p) / q4p : null, daily = q4 / 7;
      var mg = omK > 0 ? lb / omK * 100 : (p.hpp > 0 && p.harga > 0 ? (p.harga - p.hpp) / p.harga * 100 : null);
      var cover = p.stok > 0 && daily > 0 ? p.stok / daily : (daily > 0 ? 0 : null);
      var fcw = q4 * (1 + clamp(tr == null ? 0 : tr, -0.25, 0.25) / 2), need = Math.ceil(fcw * 1.1 - p.stok), saran = Math.max(0, need), lalu = p.produksiLalu || 0;
      var act = q4 <= 0 ? 'Tetap' : (saran > lalu * 1.05 + 0.5 ? 'Naikkan' : (saran < lalu * 0.95 - 0.5 ? 'Kurangi' : 'Tetap'));
      var fmt = function (x) { return (Math.round(x * 10) / 10).toLocaleString('id-ID'); };
      var why = q4 <= 0 ? 'Belum ada penjualan dalam 4 minggu terakhir, jadi belum ada dasar untuk saran. Catat penjualan lebih dulu.' :
        (act === 'Naikkan' ? 'Rata-rata terjual ' + fmt(q4) + ' ' + p.satuan + ' per minggu' + (tr != null && tr > 0.03 ? ', naik ' + Math.round(tr * 100) + '% dari 4 minggu sebelumnya' : '') + '. Sisa stok ' + p.stok + ' ' + p.satuan + (cover != null ? ' cukup untuk ' + Math.max(0, Math.round(cover)) + ' hari' : '') + '. Produksi naik dari ' + lalu + ' ke ' + saran + ' ' + p.satuan + '.' :
          (act === 'Kurangi' ? 'Rata-rata terjual ' + fmt(q4) + ' ' + p.satuan + ' per minggu, jadi sisa ' + p.stok + ' ' + p.satuan + ' cukup untuk ' + Math.round(cover || 0) + ' hari. Cukup produksi ' + saran + ' ' + p.satuan + '.' :
            'Penjualan stabil sekitar ' + fmt(q4) + ' ' + p.satuan + ' per minggu. Pertahankan produksi ' + saran + ' ' + p.satuan + '.'));
      return { id: p.id, nama: p.nama, satuan: p.satuan, omzet: om, prevOmzet: omp, change: pct(om, omp), margin: mg, qty4: q4, trend: tr, cover: cover, noHpp: !(p.hpp > 0), stok: p.stok, lalu: lalu, saran: saran, act: act, why: why, share: 0, tag: 'Stabil', tone: 'gray' };
    });
    var totalOm = sum(prods, function (x) { return x.omzet; }) || 1;
    prods.forEach(function (x) { x.share = x.omzet / totalOm * 100; });
    var ranked = prods.slice().sort(function (a, b) { return b.omzet - a.omzet; });
    var low = function (x) { return x.omzet > 0 && x.margin != null && x.margin < targetM - 10; };
    ranked.forEach(function (x, i) {
      if (i === 0 && x.omzet > 0) { x.tag = 'Unggulan'; x.tone = 'dark'; }
      else if (low(x)) { x.tag = 'Cek margin'; x.tone = 'pink'; }
      else if (x.change != null && x.change <= -0.15) { x.tag = 'Perlu didorong'; x.tone = 'pink'; }
    });
    if (ranked[0] && ranked[0].omzet > 0 && low(ranked[0])) { ranked[0].tag = 'Cek margin'; ranked[0].tone = 'pink'; }

    // promosi
    var promos = (S.promosi || []).map(function (pr) {
      var end = pr.selesai < today ? pr.selesai : today, len = diff(end, pr.mulai) + 1;
      var f = function (a, b) { var L = inR(a, b).filter(function (r) { return !pr.produkId || r.pid === pr.produkId; }); return sum(L, function (r) { return r.om; }) / Math.max(1, diff(b, a) + 1); };
      if (len < 3) return { id: pr.id, nama: pr.nama, produkId: pr.produkId, mulai: pr.mulai, selesai: pr.selesai, len: len, effect: null, verdict: 'Terlalu singkat', tone: 'gray' };
      var during = f(pr.mulai, end), before = f(addDays(pr.mulai, -len), addDays(pr.mulai, -1)), ef = before > 0 ? (during - before) / before : null;
      return { id: pr.id, nama: pr.nama, produkId: pr.produkId, mulai: pr.mulai, selesai: pr.selesai, len: len, effect: ef, verdict: ef == null ? 'Belum ada pembanding' : (ef >= 0.12 ? 'Berhasil' : (ef >= 0.05 ? 'Cukup' : 'Kurang efektif')), tone: ef == null ? 'gray' : (ef >= 0.12 ? 'ok' : (ef >= 0.05 ? 'gray' : 'pink')) };
    });

    // harga bahan
    var groups = {}; (S.hargaBahan || []).forEach(function (h) { var k = h.produkId + '|' + h.nama; (groups[k] = groups[k] || []).push(h); });
    var bahanTrack = Object.keys(groups).map(function (k) {
      var L = groups[k].sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; }), pts = L.slice(-6), f0 = pts[0].harga, l0 = pts[pts.length - 1].harga;
      var pr = byId[L[0].produkId];
      return { nama: L[0].nama, produk: pr ? pr.nama : '', pts: pts.map(function (x) { return x.harga; }), change: f0 > 0 ? (l0 - f0) / f0 : 0, last: l0 };
    }).sort(function (a, b) { return Math.abs(b.change) - Math.abs(a.change); });

    // skor kesehatan pada tanggal tertentu
    function health(at) {
      var s4 = inR(addDays(at, -27), at), p4 = inR(addDays(at, -55), addDays(at, -28)), o4 = sum(s4, function (r) { return r.om; }), po4 = sum(p4, function (r) { return r.om; });
      var g = po4 > 0 ? (o4 - po4) / po4 : null, sg = g == null ? 60 : clamp(60 + g * 200, 0, 100);
      var mo = sum(s4, function (r) { return r.known ? r.om : 0; }), ml = sum(s4, function (r) { return r.laba; }), mgn = mo > 0 ? ml / mo * 100 : 0;
      var lowN = prods.filter(function (x) { var L = s4.filter(function (r) { return r.pid === x.id; }); var o = sum(L, function (r) { return r.known ? r.om : 0; }), l = sum(L, function (r) { return r.laba; }); return o > 0 && l / o * 100 < targetM - 10; });
      var sm = mo > 0 ? clamp(100 * mgn / targetM - 20 * lowN.length, 0, 100) : 50;
      var cs = prods.filter(function (x) { return x.cover != null && x.stok > 0; }).map(function (x) { var c = x.cover; return c >= COV_LOW && c <= COV_HIGH ? 100 : ((c >= 2 && c < COV_LOW) || (c > COV_HIGH && c <= 14) ? 70 : 40); });
      var ss = cs.length ? sum(cs, function (v) { return v; }) / cs.length : 60;
      var act = {}; s4.forEach(function (r) { act[r.t] = 1; }); var sk = clamp(Object.keys(act).length / 28 * 100, 0, 100);
      return { comps: [sg, sm, ss, sk].map(Math.round), growth: g, margin: mgn, lowN: lowN, daysActive: Object.keys(act).length, o4: o4 };
    }
    var h0 = health(today), hPrev = health(addDays(today, -30));
    var score = Math.round(sum(h0.comps, function (v) { return v; }) / 4), scorePrev = Math.round(sum(hPrev.comps, function (v) { return v; }) / 4);
    var stokKnown = prods.some(function (x) { return x.stok > 0; });
    var covTxt = prods.filter(function (x) { return x.cover != null && x.stok > 0 && (x.cover < COV_LOW || x.cover > COV_HIGH); }).map(function (x) { return x.nama + ' ' + Math.round(x.cover) + ' hari (' + (x.cover < COV_LOW ? 'rawan habis' : 'menumpuk') + ')'; });
    var comps = [
      { k: 'Pertumbuhan omzet', v: h0.comps[0], l: label(h0.comps[0]), d: h0.growth == null ? 'Belum ada pembanding 4 minggu sebelumnya. Omzet 4 minggu terakhir ' + rp(h0.o4) + '.' : 'Omzet 4 minggu terakhir ' + rp(h0.o4) + ', ' + (h0.growth >= 0 ? 'naik ' : 'turun ') + Math.abs(Math.round(h0.growth * 100)) + '% dibanding 4 minggu sebelumnya.' },
      { k: 'Margin kotor', v: h0.comps[1], l: label(h0.comps[1]), d: (h0.margin > 0 || prods.some(function (x) { return !x.noHpp; }) ? 'Margin kotor ' + Math.round(h0.margin) + '% (target ' + targetM + '%).' : 'Isi HPP produk di Kalkulator HPP untuk menghitung margin.') + (h0.lowN.length ? ' Di bawah target: ' + h0.lowN.map(function (x) { return x.nama; }).join(', ') + '.' : '') },
      { k: 'Perputaran stok', v: h0.comps[2], l: label(h0.comps[2]), d: !stokKnown ? 'Isi sisa stok di menu Stok untuk menilai perputaran.' : (covTxt.length ? 'Perlu perhatian: ' + covTxt.join('; ') + '.' : 'Semua produk punya cakupan stok 4-10 hari.') },
      { k: 'Konsistensi pencatatan', v: h0.comps[3], l: label(h0.comps[3]), d: 'Penjualan tercatat di ' + h0.daysActive + ' dari 28 hari terakhir.' }
    ];
    comps.forEach(function (c) { c.warn = c.v < 60; });
    var overall = score >= 80 ? 'Sehat' : (score >= 60 ? 'Cukup sehat' : (score >= 40 ? 'Perlu perhatian' : 'Perlu tindakan'));
    var delta = daysOfData >= 56 ? score - scorePrev : null;

    // target bulan berjalan
    var ym = today.slice(0, 7), monthOm = sum(sales.filter(function (r) { return r.t.slice(0, 7) === ym; }), function (r) { return r.om; });
    var dim = new Date(+today.slice(0, 4), +today.slice(5, 7), 0).getDate(), left = dim - (+today.slice(8, 10));
    var target = { omzet: monthOm, target: targetO, pct: targetO > 0 ? monthOm / targetO : 0, left: Math.max(0, targetO - monthOm), daysLeft: left, perDay: monthOm / Math.max(1, +today.slice(8, 10)), marginNow: kc.margin * 100, marginTarget: targetM };

    // insight
    var ins = [];
    prods.filter(low).sort(function (a, b) { return a.margin - b.margin; }).slice(0, 2).forEach(function (x) {
      var pr = byId[x.id];
      ins.push({ tone: 'red', rank: 1, title: 'Margin ' + x.nama + ' hanya ' + Math.round(x.margin) + '%', body: 'Di bawah target ' + targetM + '%. Data: HPP ' + rp(pr.hpp) + ' vs harga jual ' + rp(pr.harga) + '.', cta: 'Hitung ulang HPP →', href: '#/hpp' });
    });
    prods.filter(function (x) { return x.cover != null && x.stok > 0 && x.cover < COV_LOW && x.qty4 > 0; }).slice(0, 2).forEach(function (x) {
      ins.push({ tone: 'red', rank: 2, title: x.nama + ' berisiko habis', body: 'Cakupan stok tinggal <b>' + Math.max(0, Math.round(x.cover)) + ' hari</b>; waktu terlaris <b>' + DAYS_FULL[peak.d] + ' ' + SLOTS[peak.s][0].toLowerCase() + '</b>. Saran produksi ' + x.saran + ' ' + x.satuan + '.', cta: 'Lihat saran stok →', href: '#/stok' });
    });
    prods.filter(function (x) { return x.cover != null && x.stok > 0 && x.cover > COV_HIGH; }).slice(0, 1).forEach(function (x) {
      ins.push({ tone: 'info', rank: 3, title: x.nama + ' menumpuk', body: 'Terjual rata-rata ' + (Math.round(x.qty4 * 10) / 10).toLocaleString('id-ID') + ' ' + x.satuan + ' per minggu, sisa ' + x.stok + ' (<b>' + Math.round(x.cover) + ' hari</b>). Kurangi produksi.', cta: 'Lihat saran stok →', href: '#/stok' });
    });
    prods.filter(function (x) { return x.change != null && x.change <= -0.15 && x.prevOmzet > 0; }).slice(0, 1).forEach(function (x) {
      ins.push({ tone: 'red', rank: 3, title: x.nama + ' turun ' + Math.abs(Math.round(x.change * 100)) + '%', body: 'Omzet ' + days + ' hari terakhir turun dibanding periode sebelumnya. Pertimbangkan promosi.', cta: 'Lihat analitik produk →', href: '#/analitik' });
    });
    if (kpi.d.omzet != null && Math.abs(kpi.d.omzet) >= 0.05 && prev.length) {
      ins.push({ tone: kpi.d.omzet > 0 ? 'ok' : 'red', rank: kpi.d.omzet > 0 ? 5 : 2, title: 'Omzet ' + (kpi.d.omzet > 0 ? 'naik ' : 'turun ') + Math.abs(Math.round(kpi.d.omzet * 100)) + '%', body: 'Omzet ' + days + ' hari terakhir ' + rp(kc.omzet) + ' dibanding ' + rp(kp.omzet) + ' pada periode sebelumnya.', cta: 'Lihat analitik →', href: '#/analitik' });
    }
    promos.filter(function (x) { return x.effect != null && x.effect >= 0.12; }).slice(0, 1).forEach(function (x) {
      ins.push({ tone: 'ok', rank: 5, title: 'Promosi "' + x.nama + '" efektif', body: 'Omzet harian naik <b>' + Math.round(x.effect * 100) + '%</b> dibanding periode sebelum promosi.', cta: 'Lihat analitik promosi →', href: '#/analitik' });
    });
    var noH = prods.filter(function (x) { return x.noHpp && x.omzet > 0; });
    if (noH.length) ins.push({ tone: 'info', rank: 4, title: noH.length + ' produk belum punya HPP', body: noH.slice(0, 3).map(function (x) { return x.nama; }).join(', ') + ' belum dihitung margin-nya. Margin dan skor memakai produk lain.', cta: 'Isi HPP →', href: '#/hpp' });
    if (wkendShare >= 0.5 && cur.length) ins.push({ tone: 'info', rank: 6, title: 'Akhir pekan menyumbang ' + Math.round(wkendShare * 100) + '% omzet', body: 'Jumat-Minggu adalah waktu terbaik untuk promosi dan menyiapkan stok.', cta: 'Lihat waktu ramai →', href: '#/analitik' });
    if (daysOfData > 0 && daysOfData < 14) ins.push({ tone: 'info', rank: 9, title: 'Data baru ' + daysOfData + ' hari', body: 'Diagnosis dan saran makin akurat setelah minimal 2 minggu pencatatan.', cta: 'Catat penjualan →', href: '#/catat' });
    ins.sort(function (a, b) { return a.rank - b.rank; });

    // roadmap: 6 tahap berbasis kriteria dari data (bukan kalender)
    var pf = (S.usaha && S.usaha.prefs) || {}, sop = !!pf.sop, cab = !!pf.cabang, bep = !!pf.bep;
    var g4 = h0.growth, topShare = ranked[0] ? ranked[0].share : 0, allHpp = produk.length > 0 && produk.every(function (p) { return p.hpp > 0 && (p.bahan || []).length > 0; });
    var allHppAny = produk.length > 0 && produk.every(function (p) { return p.hpp > 0; });
    var lowNow = prods.filter(low), knownAny = kc.knownOm > 0;
    var bahanBaru = (S.hargaBahan || []).some(function (h) { return h.tanggal >= addDays(today, -35); });
    var rawan = prods.filter(function (x) { return x.cover != null && x.stok > 0 && x.cover < COV_LOW && x.qty4 > 0; }), numpuk = prods.filter(function (x) { return x.cover != null && x.stok > 0 && x.cover > COV_HIGH; });
    var terjual = prods.filter(function (x) { return x.qty4 > 0; });
    var C = function (ok, text, href, learn, manual) { return { ok: !!ok, text: text, href: href || '', learn: learn || '', manual: manual || '' }; };
    var stageDefs = [
      { id: 's1', nama: 'Fondasi data', ringkas: 'Produk, HPP, dan catatan penjualan sudah rapi.', est: '1-2 minggu', k: [
        C(produk.length >= 3, 'Minimal 3 produk utama terdaftar (sekarang ' + produk.length + ')', '#/hpp', 'catat-sederhana'),
        C(allHppAny, 'Semua produk punya HPP', '#/hpp', 'hpp-dasar'),
        C(daysOfData >= 14 && h0.daysActive >= 10, 'Penjualan tercatat minimal 14 hari (sekarang ' + h0.daysActive + ' hari terisi dalam 28 hari)', '#/catat', 'catat-sederhana')] },
      { id: 's2', nama: 'Margin sehat', ringkas: 'Harga jual menutup biaya dan mencapai target margin.', est: '2-4 minggu', k: [
        C(knownAny && h0.margin >= targetM, 'Margin kotor di atas target ' + targetM + '% (sekarang ' + (knownAny ? Math.round(h0.margin) + '%' : 'belum ada data') + ')', '#/hpp', 'target-margin'),
        C(knownAny && lowNow.length === 0, 'Tidak ada produk dengan margin jauh di bawah target' + (lowNow.length ? ' (' + lowNow.map(function (x) { return x.nama; }).join(', ') + ')' : ''), '#/hpp', 'harga-jual'),
        C(bahanBaru, 'Harga bahan dicek dalam 35 hari terakhir', '#/hpp', 'hpp-dasar')] },
      { id: 's3', nama: 'Stok terkendali', ringkas: 'Tidak sering kehabisan atau menumpuk.', est: '2-4 minggu', k: [
        C(terjual.length > 0 && terjual.every(function (x) { return x.stok > 0; }), 'Sisa stok terisi untuk produk yang terjual', '#/stok', 'stok-dasar'),
        C(terjual.length > 0 && rawan.length === 0, 'Tidak ada produk rawan habis' + (rawan.length ? ' (' + rawan.map(function (x) { return x.nama; }).join(', ') + ')' : ''), '#/stok', 'stok-dasar'),
        C(terjual.length > 0 && numpuk.length === 0, 'Tidak ada produk menumpuk' + (numpuk.length ? ' (' + numpuk.map(function (x) { return x.nama; }).join(', ') + ')' : ''), '#/stok', 'stok-dasar'),
        C((S.keputusan || []).length >= 2, 'Menetapkan keputusan stok minimal 2 kali (sekarang ' + (S.keputusan || []).length + ')', '#/stok', 'stok-dasar')] },
      { id: 's4', nama: 'Omzet bertumbuh', ringkas: 'Omzet naik dan promosi terbukti efektif.', est: '1-3 bulan', k: [
        C(g4 != null && g4 > 0, 'Omzet 4 minggu terakhir naik dibanding sebelumnya', '#/analitik', 'baca-skor'),
        C(kc.omzet >= targetO, 'Omzet 30 hari di atas ' + jt(targetO) + ' (sekarang ' + jt(kc.omzet) + ')', '#/analitik', 'promosi-terukur'),
        C(promos.some(function (x) { return x.effect != null && x.effect >= 0.05; }), 'Ada promosi tercatat yang menaikkan omzet harian minimal 5%', '#/catat', 'promosi-terukur')] },
      { id: 's5', nama: 'Siap buka cabang', ringkas: 'Usaha stabil dan untung cukup untuk dibagi dua.', est: '2-3 bulan', k: [
        C(daysOfData >= 56 && h0.daysActive >= 20, 'Pencatatan konsisten 8 minggu', '#/catat', 'catat-sederhana'),
        C(knownAny && h0.margin >= targetM && hPrev.margin >= targetM, 'Margin kotor di atas target dalam dua periode berturut-turut', '#/analitik', 'target-margin'),
        C(score >= 75, 'Skor kesehatan usaha minimal 75 (sekarang ' + score + ')', '#/diagnosis', 'baca-skor'),
        C(bep, 'Modal dan titik impas cabang sudah dihitung', '#/belajar/cabang-siap', 'cabang-siap', 'bep')] },
      { id: 's6', nama: 'Siap franchise', ringkas: 'Resep, standar, dan SOP bisa dijalankan orang lain.', est: '3-6 bulan', k: [
        C(topShare >= 30, 'Produk unggulan jelas' + (ranked[0] && ranked[0].omzet > 0 ? ' (' + ranked[0].nama + ', ' + Math.round(topShare) + '% omzet)' : ''), '#/analitik', 'franchise-dasar'),
        C(allHpp, 'Resep dan HPP terstandar (semua produk punya daftar bahan)', '#/hpp', 'franchise-dasar'),
        C(sop, 'SOP produksi tertulis', '', 'franchise-dasar', 'sop'),
        C(cab, 'Satu cabang berjalan stabil', '', 'cabang-siap', 'cabang')] }
    ];
    var curStage = -1;
    stageDefs.forEach(function (st, i) { st.done = st.k.every(function (c) { return c.ok; }); st.pct = Math.round(sum(st.k, function (c) { return c.ok ? 1 : 0; }) / st.k.length * 100); if (curStage < 0 && !st.done) curStage = i; });
    if (curStage < 0) curStage = stageDefs.length - 1;
    stageDefs.forEach(function (st, i) { st.status = st.done ? 'done' : (i === curStage ? 'now' : 'locked'); });
    var stagePct = Math.round(sum(stageDefs, function (st) { return st.pct; }) / stageDefs.length);
    var readiness = { cabang: { pct: stageDefs[4].pct }, franchise: { pct: stageDefs[5].pct } };

    return {
      today: today, days: days, hasData: sales.length > 0, daysOfData: daysOfData, kpi: kpi, weekly: weekly, prevWeekly: prevWeekly, forecast: forecast, daily: daily, wkendShare: wkendShare,
      heat: heat, peak: peak, channels: channels, prods: prods, ranked: ranked, promos: promos, bahanTrack: bahanTrack, score: score, overall: overall, delta: delta, comps: comps,
      target: target, insights: ins, readiness: readiness, targetM: targetM, stages: stageDefs, curStage: curStage, stagePct: stagePct, health: { margin: h0.margin, marginPrev: hPrev.margin, daysActive: h0.daysActive, growth: h0.growth },
      stockSummary: { up: prods.filter(function (x) { return x.act === 'Naikkan'; }), down: prods.filter(function (x) { return x.act === 'Kurangi'; }), risk: prods.filter(function (x) { return x.cover != null && x.stok > 0 && x.cover < COV_LOW && x.qty4 > 0; }) }
    };
  }
  root.LakuAnalytics = { compute: compute, ymd: ymd, addDays: addDays, diff: diff, dow: dow, mondayOf: mondayOf, SLOTS: SLOTS, COV_LOW: COV_LOW, COV_HIGH: COV_HIGH, DAYS: DAYS, DAYS_FULL: DAYS_FULL, rp: rp, jt: jt };
})(typeof self !== 'undefined' ? self : this);
