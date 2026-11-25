const assert = require('assert'); global.self = global;
require('../../assets/js/core.js'); require('../../assets/js/analytics.js'); require('../../assets/js/seed.js');
const A = LakuAnalytics, today = '2026-11-25';
const seed = LakuSeed.make(today);
const S = { usaha: { targetMargin: 35, targetOmzet: 15e6, prefs: {} }, produk: seed.produk, penjualan: seed.penjualan, promosi: seed.promosi, hargaBahan: seed.hargaBahan, keputusan: [], bahanBaku: seed.bahanBaku };
const M = A.compute(S, { today });
const jt = n => (n / 1e6).toFixed(2);
console.log('baris penjualan', seed.penjualan.length, '| omzet30', jt(M.kpi.cur.omzet), 'jt | prev30', jt(M.kpi.prev.omzet), '| growth', Math.round(M.kpi.d.omzet * 100) + '%');
console.log('laba', jt(M.kpi.cur.laba), '| margin', M.kpi.cur.margin.toFixed(3), '| trx', M.kpi.cur.trx, '| aov', Math.round(M.kpi.cur.aov));
console.log('weekly', M.weekly.map(jt).join(' '), '| forecast', jt(M.forecast.value), jt(M.forecast.lo), jt(M.forecast.hi));
console.log('skor', M.score, M.overall, 'delta', M.delta, M.comps.map(c => c.k + ':' + c.v).join(' | '));
M.prods.forEach(p => console.log(' ', p.nama.padEnd(13), 'share', p.share.toFixed(0) + '%', 'margin', p.margin.toFixed(0) + '%', 'cover', p.cover == null ? '-' : p.cover.toFixed(1), 'saran', p.saran, p.act, '|', p.tag));
console.log('promo', M.promos.map(p => p.nama + ' ' + (p.effect == null ? '-' : Math.round(p.effect * 100) + '%') + ' ' + p.verdict).join(' ; '));
console.log('bahan', M.bahanTrack.slice(0, 3).map(b => b.nama + ' ' + Math.round(b.change * 100) + '%').join(' ; '));
console.log('kanal', M.channels.map(c => c[0] + ' ' + Math.round(c[1] * 100)).join(' | '), '| peak', A.DAYS_FULL[M.peak.d], A.SLOTS[M.peak.s][0], '| weekend', Math.round(M.wkendShare * 100) + '%');
console.log('insight:', M.insights.map(i => i.tone + ': ' + i.title).join(' | '));
console.log('target', Math.round(M.target.pct * 100) + '%', 'kesiapan cabang', M.readiness.cabang.pct, 'franchise', M.readiness.franchise.pct);
assert(M.kpi.cur.omzet > 9e6 && M.kpi.cur.omzet < 16e6, 'omzet30 masuk akal');
assert(M.kpi.cur.margin > 0.28 && M.kpi.cur.margin < 0.4, 'margin masuk akal');
assert(M.score >= 40 && M.score <= 95);
// data kosong tidak crash
const E = A.compute({ usaha: {}, produk: [], penjualan: [], promosi: [], hargaBahan: [] }, { today });
assert.strictEqual(E.hasData, false); assert.strictEqual(E.insights.length, 0);
const E2 = A.compute({ usaha: {}, produk: [{ id: 'p_1', nama: 'X', satuan: 'pcs', harga: 1000, hpp: 600, stok: 0, produksiLalu: 0, bahan: [] }], penjualan: [], promosi: [], hargaBahan: [] }, { today });
assert.strictEqual(E2.prods[0].act, 'Tetap');

// ----- bahan baku vs rekomendasi -----
console.log('HPP dari resep:', M.prods.map(p => p.nama + ' ' + S.produk.find(x => x.id === p.id).hpp).join(' | '));
const hp = n => S.produk.find(x => x.nama === n).hpp;
assert.strictEqual(hp('Dimsum Ayam'), 35500); assert.strictEqual(hp('Risol Mayo'), 5900); assert.strictEqual(hp('Nugget Sayur'), 17900); assert.strictEqual(hp('Siomay Ikan'), 20700); assert.strictEqual(hp('Lumpia Udang'), 16750);
const B = M.bahan; console.log('bahan: kurang =', B.kurang.map(k => k.nama + ' ' + LakuAnalytics.fmtQty(k.kurang, k.satuan) + ' (beli ' + k.beliPaket + 'x' + LakuAnalytics.fmtQty(k.paket, k.satuan) + ' Rp' + k.biaya + ')').join('; '), '| menipis =', B.menipis.map(b => b.nama).join(','), '| nilai persediaan Rp' + Math.round(B.nilai));
assert(B.kurang.some(k => k.nama === 'Daging ayam'), 'ayam kurang untuk rekomendasi'); assert(!B.kurang.some(k => k.nama === 'Tepung terigu'), 'tepung cukup');
const risol = M.prods.find(p => p.nama === 'Risol Mayo'), dim = M.prods.find(p => p.nama === 'Dimsum Ayam');
console.log('Risol saran', risol.saran, 'bisa', risol.bisa, 'kapasitas', risol.kapasitas, '| Dimsum saran', dim.saran, 'bisa', dim.bisa, 'kapasitas', dim.kapasitas, 'terbatas', dim.limitBahan);
assert(risol.resep && dim.resep); assert(dim.bisa <= dim.saran && risol.bisa <= risol.saran); assert(!(risol.cukup && dim.cukup), 'salah satu tidak cukup karena ayam dipakai bersama');
assert(M.insights.some(i => /Bahan baku tidak cukup/.test(i.title)), 'insight alert bahan'); assert(M.insights[0].tone === 'red');
// alokasi bahan dipakai bersama tidak melebihi stok
const ayam = S.bahanBaku.find(b => b.nama === 'Daging ayam'); const perUnit = (n) => S.produk.find(x => x.nama === n).resep.find(r => r.bahanId === ayam.id).qty;
assert(risol.bisa * perUnit('Risol Mayo') + dim.bisa * perUnit('Dimsum Ayam') <= ayam.stok + 1e-6, 'alokasi <= stok ayam');
// stok bahan 0 -> kapasitas 0 dan alert habis; stok melimpah -> semua cukup
const S0 = JSON.parse(JSON.stringify(S)); S0.bahanBaku.forEach(b => b.stok = 0); const M0 = A.compute(S0, { today });
assert(M0.prods.filter(p => p.resep).every(p => p.bisa === 0 && p.kapasitas === 0)); assert(M0.bahan.habis.length > 0); assert(M0.bahan.kurang.length > 0);
const S1 = JSON.parse(JSON.stringify(S)); S1.bahanBaku.forEach(b => b.stok = 1e7); const M1 = A.compute(S1, { today });
assert(M1.prods.filter(p => p.resep).every(p => p.cukup)); assert.strictEqual(M1.bahan.kurang.length, 0);
// produk tanpa resep tidak terpengaruh
const S2 = JSON.parse(JSON.stringify(S)); S2.produk.forEach(p => { p.resep = []; }); const M2 = A.compute(S2, { today }); assert(M2.prods.every(p => !p.resep && p.cukup)); assert.strictEqual(M2.bahan.kurang.length, 0);
// tahap 3 menyertakan syarat bahan baku
assert(M.stages[2].k.some(c => /bahan baku/.test(c.text)), 'syarat stok bahan di tahap 3');
console.log('\nanalitik OK');

/* posisi harga vs riset pasar */
(function () {
  const assert = require('assert'), A = global.LakuAnalytics || require('../../assets/js/analytics.js') && (global.window || global).LakuAnalytics;
  const P = (A || {}).posisiHarga; if (!P) { console.log('posisiHarga: dilewati (tidak terekspor)'); return; }
  const h = { rendah: 14000, tengah: 18000, tinggi: 24000 };
  let r = P(30000, h, 9000, 35, 'medium'); assert.strictEqual(r.label, 'overprice'); assert.strictEqual(r.rec, 18000); assert.strictEqual(r.mode, 'sesuai'); assert(r.marginRec >= 50);
  r = P(12000, h, 9000, 35, 'medium'); assert.strictEqual(r.label, 'underprice'); assert.strictEqual(r.goal, 14000); assert.strictEqual(r.rec, 18000);
  r = P(18500, h, 9000, 35, 'medium'); assert.strictEqual(r.label, 'kompetitif');
  r = P(20000, h, 20000, 35, 'medium'); assert.strictEqual(r.mode, 'margin-tak-tercapai'); assert.strictEqual(r.rec, 24000); assert(r.hppMax > 0 && r.hppMax < 20000); assert(/HPP perlu turun/.test(r.catatan[1]));
  r = P(0, h, 12000, 35, 'premium'); assert.strictEqual(r.label, 'belum'); assert.strictEqual(r.mode, 'di-atas-tengah'); assert.strictEqual(r.rec, 18500);
  console.log('posisi harga OK');
})();
