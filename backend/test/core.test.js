const validLogo = require('./logo-fixture');
/* Tes logika backend (jalankan: node backend/test/core.test.js) */
const assert = require('assert'), crypto = require('crypto'), path = require('path');
global.self = global;
require(path.join(__dirname, '../../assets/js/core.js'));
require(path.join(__dirname, '../../assets/js/store-local.js'));

function mkStorage() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; } }; }
function mkApi(storage) {
  const store = LakuLocalStore(storage || mkStorage()), cache = {};
  let t = Date.parse('2026-11-25T10:00:00Z');
  const env = { verifyGoogle: tk => { const m = /^good\|(.+)\|(.+)\|(.*)$/.exec(tk); if (!m) throw new Error('bad'); return { email: m[1], sub: m[2], name: m[3] }; }, now: () => t, randomHex: n => crypto.randomBytes(n).toString('hex').slice(0, n * 1), sha256: s => crypto.createHash('sha256').update(s).digest('hex'),
    cache: { get: k => cache[k], put: (k, v) => { cache[k] = v; } } };
  const core = LakuCore.create(store, env);
  return { call: q => core.handle(q), store, advance: ms => { t += ms; } };
}
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

// sha256 murni cocok dengan crypto Node
ok('sha256 murni == crypto', () => {
  ['', 'abc', 'laku.ai', 'Dapur Bu Sari — é', 'x'.repeat(200)].forEach(s => assert.strictEqual(LakuCore.sha256(s), crypto.createHash('sha256').update(s, 'utf8').digest('hex')));
});

const api = mkApi();
const reg = (o) => api.call(Object.assign({ action: 'register', nama: 'Bu Sari', usaha: 'Dapur Bu Sari', email: 'sari@mail.com', password: 'SandiRahasia1!', jenis: 'Frozen food', kota: 'Malang', wa: '0812345678' }, o));

ok('daftar membuat akun + sesi + usaha', () => {
  const r = reg(); assert(r.ok, JSON.stringify(r)); assert(r.data.token.length >= 32);
  assert.strictEqual(r.data.data.usaha.nama, 'Dapur Bu Sari'); assert.strictEqual(r.data.data.user.paket, 'pro_trial'); assert.strictEqual(r.data.data.usaha.onboarding, 'profil');
});
ok('email ganda ditolak, validasi', () => {
  assert.strictEqual(reg().error, 'exists'); assert.strictEqual(reg({ email: 'bukan-email' }).error, 'valid'); assert.strictEqual(reg({ email: 'a@b.co', password: 'pendek' }).error, 'valid');
});
ok('sandi tidak tersimpan polos', () => {
  const u = api.store.all('Users')[0]; assert(!JSON.stringify(u).includes('SandiRahasia1!')); assert(u.password_hash.startsWith('v1:')); assert(u.salt.length >= 8);
});
let tokA;
ok('login benar/salah + rate limit', () => {
  const bad = api.call({ action: 'login', email: 'sari@mail.com', password: 'salah' }); assert.strictEqual(bad.error, 'login');
  const g = api.call({ action: 'login', email: 'SARI@mail.com', password: 'SandiRahasia1!' }); assert(g.ok); tokA = g.data.token;
  for (let i = 0; i < 9; i++) api.call({ action: 'login', email: 'brute@mail.com', password: 'x' });
  assert.strictEqual(api.call({ action: 'login', email: 'brute@mail.com', password: 'x' }).error, 'limit');
});
ok('tanpa token / token palsu ditolak', () => {
  assert.strictEqual(api.call({ action: 'load' }).error, 'auth'); assert.strictEqual(api.call({ action: 'load', token: 'x'.repeat(64) }).error, 'auth');
});
const pid = 'p_abc12345', pid2 = 'p_zzz99999';
ok('produk upsert + bahan + log harga', () => {
  const r = api.call({ action: 'save', token: tokA, ops: [{ op: 'produk.upsert', produk: { id: pid, nama: 'Dimsum Ayam', satuan: 'pack', harga: 45000, hpp: 35500, stok: 22, produksiLalu: 30, bahan: [{ nama: 'Daging ayam', harga: 22000 }, { nama: 'Kemasan', harga: 2500 }] } }] });
  assert(r.ok, JSON.stringify(r));
  const l = api.call({ action: 'load', token: tokA }).data; assert.strictEqual(l.produk.length, 1); assert.strictEqual(l.produk[0].bahan.length, 2); assert.strictEqual(l.hargaBahan.length, 2);
  // ubah harga bahan -> log baru hanya utk yang berubah
  api.call({ action: 'save', token: tokA, ops: [{ op: 'produk.upsert', produk: { id: pid, nama: 'Dimsum Ayam', harga: 45000, hpp: 36000, bahan: [{ nama: 'Daging ayam', harga: 22500 }, { nama: 'Kemasan', harga: 2500 }] } }] });
  const l2 = api.call({ action: 'load', token: tokA }).data; assert.strictEqual(l2.produk.length, 1); assert.strictEqual(l2.hargaBahan.length, 3); assert.strictEqual(l2.produk[0].hpp, 25000);
});
ok('penjualan add/validasi/hapus', () => {
  const rows = [{ tanggal: '2026-11-20', jam: '13:40', produkId: pid, qty: 3, harga: 45000, kanal: 'wa' }, { tanggal: '2026-11-21', jam: '09:10', produkId: pid, qty: 2, harga: 45000, kanal: 'toko' }];
  assert(api.call({ action: 'save', token: tokA, ops: [{ op: 'penjualan.add', rows }] }).ok);
  assert.strictEqual(api.call({ action: 'load', token: tokA }).data.penjualan.length, 2);
  assert.strictEqual(api.call({ action: 'save', token: tokA, ops: [{ op: 'penjualan.add', rows: [{ tanggal: 'kemarin', produkId: pid, qty: 1, harga: 1 }] }] }).error, 'valid');
  assert.strictEqual(api.call({ action: 'save', token: tokA, ops: [{ op: 'penjualan.add', rows: [{ tanggal: '2026-11-20', produkId: 'p_tidakada1', qty: 1, harga: 1 }] }] }).error, 'valid');
  assert.strictEqual(api.call({ action: 'save', token: tokA, ops: [{ op: 'penjualan.add', rows: [{ tanggal: '2026-11-20', produkId: pid, qty: 0, harga: 1 }] }] }).error, 'valid');
  const id = api.call({ action: 'load', token: tokA }).data.penjualan[0].id;
  api.call({ action: 'save', token: tokA, ops: [{ op: 'penjualan.delete', ids: [id] }] });
  assert.strictEqual(api.call({ action: 'load', token: tokA }).data.penjualan.length, 1);
});
let tokB;
ok('ISOLASI antar akun: B tidak melihat/mengubah data A', () => {
  tokB = reg({ email: 'andi@mail.com', usaha: 'Kedai Andi', nama: 'Andi' }).data.token;
  const lb = api.call({ action: 'load', token: tokB }).data; assert.strictEqual(lb.produk.length, 0); assert.strictEqual(lb.penjualan.length, 0); assert.strictEqual(lb.usaha.nama, 'Kedai Andi');
  // B mencoba menimpa produk milik A
  assert.strictEqual(api.call({ action: 'save', token: tokB, ops: [{ op: 'produk.upsert', produk: { id: pid, nama: 'DIRETAS', harga: 1 } }] }).error, 'forbidden');
  // B mencoba menjual produk A
  assert.strictEqual(api.call({ action: 'save', token: tokB, ops: [{ op: 'penjualan.add', rows: [{ tanggal: '2026-11-20', produkId: pid, qty: 1, harga: 1 }] }] }).error, 'valid');
  // B mencoba menghapus produk/transaksi/promo A
  api.call({ action: 'save', token: tokB, ops: [{ op: 'produk.delete', id: pid }, { op: 'penjualan.delete', ids: api.call({ action: 'load', token: tokA }).data.penjualan.map(x => x.id) }] });
  const la = api.call({ action: 'load', token: tokA }).data; assert.strictEqual(la.produk.length, 1); assert.strictEqual(la.penjualan.length, 1); assert.strictEqual(la.produk[0].nama, 'Dimsum Ayam');
});
ok('teks rumus ditolak dan teks yang diawali tanda plus aman di spreadsheet', () => {
  const saved = (nama) => api.call({ action: 'save', token: tokB, ops: [{ op: 'produk.upsert', produk: { id: pid2, nama, harga: 1000 } }] });
  assert.strictEqual(saved('=RUMUS').error, 'valid');
  assert(saved('+ Paket anda').ok);
  const raw = api.store.all('Produk').find(r => r.produk_id === pid2);
  assert.strictEqual(raw.nama, "'+ Paket anda");
  assert.strictEqual(api.call({ action: 'load', token: tokB }).data.produk[0].nama, '+ Paket anda');
});
ok('usaha.update (onboarding, kanal, prefs) + whitelist kanal', () => {
  api.call({ action: 'save', token: tokA, ops: [{ op: 'usaha.update', fields: { outlet: '1 outlet', omzetRange: 'Rp5-15 jt', kanal: ['toko', 'wa', 'hacker'], targetOmzet: 15000000, prefs: { wa: true }, onboarding: 'selesai' } }] });
  const u = api.call({ action: 'load', token: tokA }).data.usaha; assert.deepStrictEqual(u.kanal, ['toko', 'wa']); assert.strictEqual(u.onboarding, 'selesai'); assert.strictEqual(u.prefs.wa, true);
  assert.strictEqual(api.call({ action: 'save', token: tokA, ops: [{ op: 'tidak.ada' }] }).error, 'valid');
});
ok('promosi + contoh.hapus', () => {
  api.call({ action: 'save', token: tokA, ops: [{ op: 'produk.upsert', produk: { id: 'p_cnth0001', nama: 'Contoh', harga: 1000, sumber: 'contoh' } }, { op: 'promosi.add', rows: [{ nama: 'Diskon', produkId: pid, mulai: '2026-11-01', selesai: '2026-11-10', sumber: 'contoh' }, { nama: 'Asli', produkId: pid, mulai: '2026-11-11', selesai: '2026-11-12' }] }, { op: 'penjualan.add', rows: [{ tanggal: '2026-11-02', produkId: 'p_cnth0001', qty: 2, harga: 1000, sumber: 'contoh' }] }] });
  assert.strictEqual(api.call({ action: 'load', token: tokA }).data.promosi.length, 2);
  api.call({ action: 'save', token: tokA, ops: [{ op: 'contoh.hapus' }] });
  const l = api.call({ action: 'load', token: tokA }).data; assert.strictEqual(l.promosi.length, 1); assert.strictEqual(l.produk.length, 1); assert.strictEqual(l.penjualan.length, 1);
});
ok('sesi kedaluwarsa & logout', () => {
  const g = api.call({ action: 'login', email: 'sari@mail.com', password: 'SandiRahasia1!' }).data.token;
  assert(api.call({ action: 'logout', token: g }).ok); assert.strictEqual(api.call({ action: 'load', token: g }).error, 'auth');
  api.advance(31 * 86400000); assert.strictEqual(api.call({ action: 'load', token: tokA }).error, 'auth');
});
ok('hapus akun: butuh sandi, menghapus semua data & hanya milik sendiri', () => {
  const t = api.call({ action: 'login', email: 'sari@mail.com', password: 'SandiRahasia1!' }).data.token;
  assert.strictEqual(api.call({ action: 'hapusAkun', token: t, password: 'salah' }).error, 'login');
  assert(api.call({ action: 'hapusAkun', token: t, password: 'SandiRahasia1!' }).ok);
  assert.strictEqual(api.store.all('Users').filter(u => u.email === 'sari@mail.com').length, 0);
  assert.strictEqual(api.store.all('Produk').filter(p => p.nama === 'Dimsum Ayam').length, 0);
  assert.strictEqual(api.store.all('Users').filter(u => u.email === 'andi@mail.com').length, 1);
  assert(api.store.all('Produk').some(p => p.produk_id === pid2));   // data B utuh
});

ok('Google: akun baru dibuat, token palsu ditolak, tanpa duplikat saat masuk lagi', () => {
  const g = mkApi();
  assert.strictEqual(g.call({ action: 'google', idToken: 'palsu' }).error, 'login');
  const r1 = g.call({ action: 'google', idToken: 'good|Dewi@Mail.com|sub123|Dewi Rahma' }); assert(r1.ok, JSON.stringify(r1));
  assert.strictEqual(r1.data.isNew, true); assert.strictEqual(r1.data.data.user.email, 'dewi@mail.com'); assert.strictEqual(r1.data.data.user.google, true);
  assert.strictEqual(r1.data.data.usaha.nama, 'Usaha Dewi Rahma'); assert.strictEqual(r1.data.data.usaha.prefs.g, true); assert.strictEqual(r1.data.data.usaha.onboarding, 'profil');
  const r2 = g.call({ action: 'google', idToken: 'good|dewi@mail.com|sub123|Dewi Rahma' }); assert.strictEqual(r2.data.isNew, false);
  assert.strictEqual(g.store.all('Users').length, 1); assert.strictEqual(g.store.all('Usaha').length, 1);
  assert(g.call({ action: 'load', token: r2.data.token }).ok);
});
ok('Google: akun Google tidak bisa login dengan sandi; pesan jelas', () => {
  const g = mkApi(); g.call({ action: 'google', idToken: 'good|a@b.co|s1|A' });
  const r = g.call({ action: 'login', email: 'a@b.co', password: 'apapun123' }); assert.strictEqual(r.error, 'google'); assert(/Google/.test(r.message));
  assert(!JSON.stringify(g.store.all('Users')).includes('v1:'), 'tidak ada hash sandi untuk akun Google');
});
ok('Google: akun sandi tidak ditautkan hanya karena emailnya sama', () => {
  const g = mkApi(); const a = g.call({ action: 'register', nama: 'Sari', usaha: 'U', email: 'sari@x.id', password: 'SandiRahasia1!' }); assert(a.ok);
  g.call({ action: 'save', token: a.data.token, ops: [{ op: 'produk.upsert', produk: { id: 'p_link0001', nama: 'Produk Lama', harga: 100 } }] });
  const r = g.call({ action: 'google', idToken: 'good|sari@x.id|subZ|Sari' }); assert.strictEqual(r.error, 'login');
  assert.strictEqual(g.store.all('Users').length, 1);
  assert(g.call({ action: 'login', email: 'sari@x.id', password: 'SandiRahasia1!' }).ok, 'sandi lama tetap berlaku');
});
ok('Google: daftar sandi dengan email yang sudah dipakai akun Google ditolak', () => {
  const g = mkApi(); g.call({ action: 'google', idToken: 'good|a@b.co|s1|A' });
  assert.strictEqual(g.call({ action: 'register', nama: 'X', usaha: 'Y', email: 'a@b.co', password: 'SandiRahasia1!' }).error, 'exists');
});
ok('Google: hapus akun butuh email konfirmasi (bukan sandi)', () => {
  const g = mkApi(); const r = g.call({ action: 'google', idToken: 'good|a@b.co|s1|A' }), tk = r.data.token;
  assert.strictEqual(g.call({ action: 'hapusAkun', token: tk, password: 'salah@b.co' }).error, 'login');
  assert(g.call({ action: 'hapusAkun', token: tk, password: 'A@B.co' }).ok); assert.strictEqual(g.store.all('Users').length, 0);
});
ok('logo usaha: simpan, ganti, hapus; format dan ukuran divalidasi', () => {
  const g = mkApi(); const r = g.call({ action: 'register', nama: 'Sari', usaha: 'U', email: 'logo@x.id', password: 'SandiRahasia1!' }), tk = r.data.token;
  const jpg = validLogo;
  assert.strictEqual(r.data.data.usaha.logo, '');
  assert.strictEqual(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: 'data:image/jpeg;base64,iVBORw0KGgo=' } }] }).error, 'valid');
  const extra = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from(jpg.split(',')[1], 'base64'), Buffer.from([0])]).toString('base64');
  assert.strictEqual(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: extra } }] }).error, 'valid');
  assert(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: jpg } }] }).ok);
  assert.strictEqual(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' } }] }).error, 'valid');   // SVG ditolak (XSS)
  assert.strictEqual(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: 'javascript:alert(1)' } }] }).error, 'valid');
  assert.strictEqual(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: 'data:image/png;base64,' + 'A'.repeat(30000) } }] }).error, 'valid');
  assert.strictEqual(g.call({ action: 'load', token: tk }).data.usaha.logo, jpg, 'logo valid terakhir tetap');
  assert(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: '' } }] }).ok); assert.strictEqual(g.call({ action: 'load', token: tk }).data.usaha.logo, '');
  assert.strictEqual(g.call({ action: 'ping' }).data.logo, true);
});
ok('ping melaporkan dukungan Google (google: true/false)', () => {
  assert.strictEqual(mkApi().call({ action: 'ping' }).data.google, true);
  const store = LakuLocalStore(mkStorage()); const core = LakuCore.create(store, { now: Date.now, randomHex: n => 'a'.repeat(n), sha256: s => s });
  assert.strictEqual(core.handle({ action: 'ping' }).data.google, false);
});
ok('Google nonaktif bila verifyGoogle tidak diset', () => {
  const store = LakuLocalStore(mkStorage()); const core = LakuCore.create(store, { now: Date.now, randomHex: n => crypto.randomBytes(n).toString('hex').slice(0, n), sha256: s => crypto.createHash('sha256').update(s).digest('hex') });
  assert.strictEqual(core.handle({ action: 'google', idToken: 'x' }).error, 'valid');
});

ok('satuan: konversi kg/gram, liter/ml, satuan kustom', () => {
  const U = LakuCore.units;
  assert.strictEqual(U.convert(1.5, 'kg', 'gram'), 1500); assert.strictEqual(U.convert(250, 'ml', 'liter'), 0.25); assert.strictEqual(U.convert(3, 'ikat', 'ikat'), 3);
  assert.strictEqual(U.convert(1, 'kg', 'liter'), null); assert.strictEqual(U.convert(1, 'ikat', 'gram'), null);
  assert.deepStrictEqual(U.compat('gram'), ['gram', 'kg']); assert.deepStrictEqual(U.compat('ml'), ['ml', 'liter']); assert.deepStrictEqual(U.compat('ikat'), ['ikat']);
});
const inv = (shared) => {
  const g = shared || mkApi(); const r = g.call({ action: 'register', nama: 'Sari', usaha: 'U', email: 'inv' + Math.random().toString(36).slice(2, 7) + '@x.id', password: 'SandiRahasia1!' }); const tk = r.data.token;
  const S = ops => g.call({ action: 'save', token: tk, ops }), L = () => g.call({ action: 'load', token: tk }).data;
  const bb = (id, nama, satuan, stok, hargaBeli, isiBeli, extra) => ({ op: 'bahanbaku.upsert', bahan: Object.assign({ id, nama, satuan, stok, hargaBeli, isiBeli }, extra || {}) });
  return { g, tk, S, L, bb };
};
ok('bahan baku: simpan, harga per satuan, log harga, batas satuan', () => {
  const { S, L, bb } = inv();
  assert(S([bb('bb_ayam001', 'Daging ayam', 'gram', 6000, 44000, 1000, { minStok: 1000 })]).ok);
  const d = L(); assert.strictEqual(d.bahanBaku.length, 1); const a = d.bahanBaku[0];
  assert.strictEqual(a.stok, 6000); assert.strictEqual(LakuCore.unitPrice(a), 44); assert.strictEqual(a.minStok, 1000); assert.strictEqual(d.hargaBahan.filter(h => h.nama === 'Daging ayam' && h.produkId === '').length, 1);
  assert.strictEqual(S([bb('bb_BAD', 'x', 'gram', 1, 1, 1)]).error, 'valid');
  assert.strictEqual(S([bb('bb_ayam002', '', 'gram', 1, 1, 1)]).error, 'valid');
});
ok('resep: HPP dihitung otomatis dari takaran x harga + biaya tambahan; hasil resep membagi', () => {
  const { S, L, bb } = inv();
  S([bb('bb_ayam001', 'Daging ayam', 'gram', 6000, 44000, 1000), bb('bb_tepung01', 'Tepung', 'gram', 8000, 13000, 1000), bb('bb_bumbu001', 'Bumbu', 'gram', 1000, 15000, 500)]);
  assert(S([{ op: 'produk.upsert', produk: { id: 'p_dimsum01', nama: 'Dimsum', satuan: 'pack', harga: 45000, hpp: 0, bahan: [{ nama: 'Kemasan', harga: 2500 }, { nama: 'Gas dan listrik', harga: 1500 }] } },
    { op: 'resep.set', produkId: 'p_dimsum01', hasil: 1, items: [{ bahanId: 'bb_ayam001', qty: 500 }, { bahanId: 'bb_tepung01', qty: 500 }, { bahanId: 'bb_bumbu001', qty: 100 }] }]).ok);
  let d = L(), p = d.produk[0]; assert.strictEqual(p.hpp, 35500, 'HPP ' + p.hpp); assert.strictEqual(p.resep.length, 3); assert.strictEqual(p.hasil, 1);
  // klien dan server memakai rumus yang sama
  const byId = {}; d.bahanBaku.forEach(b => byId[b.id] = b); assert.strictEqual(LakuCore.hppFromResep(p, byId), 35500);
  // resep untuk 10 unit
  S([{ op: 'resep.set', produkId: 'p_dimsum01', hasil: 10, items: [{ bahanId: 'bb_ayam001', qty: 5000 }, { bahanId: 'bb_tepung01', qty: 5000 }, { bahanId: 'bb_bumbu001', qty: 1000 }] }]);
  assert.strictEqual(L().produk[0].hpp, 35500); assert.strictEqual(L().produk[0].hasil, 10);
  assert.strictEqual(S([bb('bb_ayam001', 'Daging ayam', 'kg', 6, 44000, 1)]).error, 'valid');   // satuan dipakai resep -> tidak boleh diubah
});
ok('beli bahan: stok bertambah, harga baru menghitung ulang HPP, tercatat di log', () => {
  const { S, L, bb } = inv();
  S([bb('bb_ayam001', 'Daging ayam', 'gram', 1000, 44000, 1000), { op: 'produk.upsert', produk: { id: 'p_dimsum01', nama: 'Dimsum', satuan: 'pack', harga: 45000, hpp: 0 } }, { op: 'resep.set', produkId: 'p_dimsum01', items: [{ bahanId: 'bb_ayam001', qty: 500 }] }]);
  assert.strictEqual(L().produk[0].hpp, 22000);
  assert(S([{ op: 'bahanbaku.beli', id: 'bb_ayam001', jumlah: 2000, hargaTotal: 96000 }]).ok);   // 48 per gram
  const d = L(); assert.strictEqual(d.bahanBaku[0].stok, 3000); assert.strictEqual(d.produk[0].hpp, 24000); assert.strictEqual(d.stokLog.filter(x => x.jenis === 'beli').length, 1);
  assert.strictEqual(S([{ op: 'bahanbaku.beli', id: 'bb_ayam001', jumlah: 0, hargaTotal: 1 }]).error, 'valid');
  assert(S([{ op: 'bahanbaku.koreksi', id: 'bb_ayam001', stok: 2500 }]).ok); assert.strictEqual(L().bahanBaku[0].stok, 2500); assert.strictEqual(L().stokLog.filter(x => x.jenis === 'koreksi')[0].jumlah, -500);
});
ok('produksi: memotong stok bahan sesuai resep, menambah stok produk; ditolak bila bahan kurang (tanpa perubahan)', () => {
  const { S, L, bb } = inv();
  S([bb('bb_ayam001', 'Daging ayam', 'gram', 1200, 44000, 1000), bb('bb_tepung01', 'Tepung', 'gram', 10000, 13000, 1000), { op: 'produk.upsert', produk: { id: 'p_dimsum01', nama: 'Dimsum', satuan: 'pack', harga: 45000, stok: 5 } },
    { op: 'resep.set', produkId: 'p_dimsum01', hasil: 1, items: [{ bahanId: 'bb_ayam001', qty: 500 }, { bahanId: 'bb_tepung01', qty: 500 }] }]);
  assert(S([{ op: 'produksi.catat', produkId: 'p_dimsum01', qty: 2 }]).ok);
  let d = L(); assert.strictEqual(d.bahanBaku.find(b => b.id === 'bb_ayam001').stok, 200); assert.strictEqual(d.bahanBaku.find(b => b.id === 'bb_tepung01').stok, 9000); assert.strictEqual(d.produk[0].stok, 7);
  const r = S([{ op: 'produksi.catat', produkId: 'p_dimsum01', qty: 1 }]); assert.strictEqual(r.error, 'stok'); assert(/Daging ayam kurang 300 gram/.test(r.message), r.message);
  d = L(); assert.strictEqual(d.bahanBaku.find(b => b.id === 'bb_ayam001').stok, 200); assert.strictEqual(d.bahanBaku.find(b => b.id === 'bb_tepung01').stok, 9000); assert.strictEqual(d.produk[0].stok, 7, 'tidak ada perubahan saat ditolak');
  assert.strictEqual(S([{ op: 'produksi.catat', produkId: 'p_dimsum01', qty: -3 }]).error, 'valid');
});
ok('hapus bahan: keluar dari resep, HPP dihitung ulang, bahan tidak muncul lagi', () => {
  const { S, L, bb } = inv();
  S([bb('bb_ayam001', 'Ayam', 'gram', 1000, 44000, 1000), bb('bb_tepung01', 'Tepung', 'gram', 1000, 13000, 1000), { op: 'produk.upsert', produk: { id: 'p_dimsum01', nama: 'D', satuan: 'pack', harga: 45000 } }, { op: 'resep.set', produkId: 'p_dimsum01', items: [{ bahanId: 'bb_ayam001', qty: 500 }, { bahanId: 'bb_tepung01', qty: 500 }] }]);
  assert.strictEqual(L().produk[0].hpp, 28500); S([{ op: 'bahanbaku.delete', id: 'bb_tepung01' }]);
  const d = L(); assert.strictEqual(d.bahanBaku.length, 1); assert.strictEqual(d.produk[0].resep.length, 1); assert.strictEqual(d.produk[0].hpp, 22000);
});
ok('ISOLASI bahan baku/resep/produksi antar akun', () => {
  const shared = mkApi(), A = inv(shared), B = inv(shared);
  A.S([A.bb('bb_ayam001', 'Ayam', 'gram', 1000, 44000, 1000), { op: 'produk.upsert', produk: { id: 'p_dimsum01', nama: 'D', satuan: 'pack', harga: 45000 } }, { op: 'resep.set', produkId: 'p_dimsum01', items: [{ bahanId: 'bb_ayam001', qty: 500 }] }]);
  assert.strictEqual(B.S([B.bb('bb_ayam001', 'DIRETAS', 'gram', 1, 1, 1)]).error, 'forbidden');
  assert.strictEqual(B.S([{ op: 'bahanbaku.beli', id: 'bb_ayam001', jumlah: 5, hargaTotal: 5 }]).error, 'forbidden');
  assert.strictEqual(B.S([{ op: 'bahanbaku.delete', id: 'bb_ayam001' }]).error, 'forbidden');
  assert.strictEqual(B.S([{ op: 'bahanbaku.koreksi', id: 'bb_ayam001', stok: 0 }]).error, 'forbidden');
  assert.strictEqual(B.S([{ op: 'produksi.catat', produkId: 'p_dimsum01', qty: 1 }]).error, 'forbidden');
  B.S([B.bb('bb_milikb01', 'Garam', 'gram', 100, 1000, 100), { op: 'produk.upsert', produk: { id: 'p_punyab001', nama: 'X', satuan: 'pcs', harga: 1 } }]);
  assert.strictEqual(B.S([{ op: 'resep.set', produkId: 'p_dimsum01', items: [{ bahanId: 'bb_milikb01', qty: 1 }] }]).error, 'forbidden');   // produk milik A
  assert.strictEqual(B.S([{ op: 'resep.set', produkId: 'p_punyab001', items: [{ bahanId: 'bb_ayam001', qty: 1 }] }]).error, 'forbidden');   // bahan milik A
  const a = A.L(); assert.strictEqual(a.bahanBaku[0].nama, 'Ayam'); assert.strictEqual(a.bahanBaku[0].stok, 1000); assert.strictEqual(B.L().bahanBaku.length, 1);
});
ok('contoh.hapus membersihkan bahan baku, resep, dan log contoh saja', () => {
  const { S, L, bb } = inv();
  S([bb('bb_milik0001', 'Milik sendiri', 'gram', 10, 10, 1), bb('bb_contoh001', 'Contoh', 'gram', 10, 10, 1, { sumber: 'contoh' }), { op: 'produk.upsert', produk: { id: 'p_cnth0001', nama: 'C', satuan: 'pcs', harga: 1, sumber: 'contoh' } }, { op: 'resep.set', produkId: 'p_cnth0001', items: [{ bahanId: 'bb_contoh001', qty: 1 }] }]);
  S([{ op: 'contoh.hapus' }]); const d = L(); assert.deepStrictEqual(d.bahanBaku.map(b => b.id), ['bb_milik0001']); assert.strictEqual(d.produk.length, 0);
});
ok('hapus akun juga menghapus bahan baku, resep, dan log stok', () => {
  const g = mkApi(); const r = g.call({ action: 'register', nama: 'X', usaha: 'Y', email: 'del@x.id', password: 'SandiRahasia1!' }), tk = r.data.token;
  g.call({ action: 'save', token: tk, ops: [{ op: 'bahanbaku.upsert', bahan: { id: 'bb_ayam001', nama: 'A', satuan: 'gram', stok: 1, hargaBeli: 1, isiBeli: 1 } }, { op: 'bahanbaku.beli', id: 'bb_ayam001', jumlah: 1, hargaTotal: 1 }] });
  assert(g.call({ action: 'hapusAkun', token: tk, password: 'SandiRahasia1!' }).ok); ['BahanBaku', 'Resep', 'StokLog'].forEach(t => assert.strictEqual(g.store.all(t).length, 0, t));
});
ok('kebijakan sandi baru tidak mengunci pengguna lama dan teks formulir dibatasi', () => {
  const g = mkApi();
  assert.strictEqual(reg({ email: 'sari..uji@example.com' }).error, 'valid');
  assert.strictEqual(reg({ email: 'uji@example.com', password: 'hurufkecil123!' }).error, 'valid');
  assert.strictEqual(reg({ email: 'uji@example.com', nama: 'Sari 😊' }).error, 'valid');
  assert.strictEqual(reg({ email: 'uji@example.com', usaha: 'A'.repeat(81) }).error, 'valid');
  const salt = 'a1b2c3d4', pw = 'sandi-lama', userId = 'u_legacy';
  let hash = LakuCore.sha256(salt + '|' + pw);
  for (let i = 0; i < 2000; i++) hash = LakuCore.sha256(hash + salt + pw);
  g.store.append('Users', [{ user_id: userId, email: 'lama@example.com', password_hash: 'v1:' + hash, salt, status: 'aktif' }]);
  g.store.append('Usaha', [{ usaha_id: 'b_legacy', user_id: userId }]);
  assert(g.call({ action: 'login', email: 'lama@example.com', password: pw }).ok);
});

ok('impor ditolak utuh saat tanggal atau angka salah dan HPP dari item dihitung backend', () => {
  const g = mkApi(), pid = 'p_hppuji1';
  const token = g.call({ action: 'register', nama: 'Sari', usaha: 'Dapur', email: 'impor@x.id', password: 'SandiRahasia1!' }).data.token;
  const save = (...ops) => g.call({ action: 'save', token, ops });
  assert(save({ op: 'produk.upsert', produk: { id: pid, nama: 'Produk HPP', hpp: 999, bahan: [{ nama: 'Bahan', harga: 120 }] } }).ok);
  assert(save({ op: 'produk.upsert', produk: { id: pid, nama: 'Produk HPP', hpp: 999 } }).ok);
  const before = g.store.all('Penjualan').length;
  const valid = { produkId: pid, tanggal: '2026-11-25', qty: 2, harga: 0, sumber: 'impor' };
  for (const bad of [{ tanggal: '2026-02-30' }, { qty: -1 }, { harga: 1e9 + 1 }]) {
    assert.strictEqual(save({ op: 'penjualan.add', rows: [valid, { ...valid, ...bad }] }).error, 'valid');
    assert.strictEqual(g.store.all('Penjualan').length, before);
  }
  assert(save({ op: 'penjualan.add', rows: [valid] }).ok);
  const data = g.call({ action: 'load', token }).data;
  assert.strictEqual(data.produk.find(p => p.id === pid).hpp, 120);
});
console.log('\n' + n + ' tes lulus');
