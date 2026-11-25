/* Tes logika backend (jalankan: node backend/test/core.test.js) */
const assert = require('assert'), crypto = require('crypto'), path = require('path');
global.self = global;
require(path.join(__dirname, '../../assets/js/core.js'));
require(path.join(__dirname, '../../assets/js/store-local.js'));

function mkStorage() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; } }; }
function mkApi(storage) {
  const store = LakuLocalStore(storage || mkStorage()), cache = {};
  let t = Date.parse('2026-11-25T10:00:00Z');
  const env = { now: () => t, randomHex: n => crypto.randomBytes(n).toString('hex').slice(0, n * 1), sha256: s => crypto.createHash('sha256').update(s).digest('hex'),
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
const reg = (o) => api.call(Object.assign({ action: 'register', nama: 'Bu Sari', usaha: 'Dapur Bu Sari', email: 'sari@mail.com', password: 'rahasia123', jenis: 'Frozen food', kota: 'Malang', wa: '0812345678' }, o));

ok('daftar membuat akun + sesi + usaha', () => {
  const r = reg(); assert(r.ok, JSON.stringify(r)); assert(r.data.token.length >= 32);
  assert.strictEqual(r.data.data.usaha.nama, 'Dapur Bu Sari'); assert.strictEqual(r.data.data.user.paket, 'pro_trial'); assert.strictEqual(r.data.data.usaha.onboarding, 'profil');
});
ok('email ganda ditolak, validasi', () => {
  assert.strictEqual(reg().error, 'exists'); assert.strictEqual(reg({ email: 'bukan-email' }).error, 'valid'); assert.strictEqual(reg({ email: 'a@b.co', password: 'pendek' }).error, 'valid');
});
ok('sandi tidak tersimpan polos', () => {
  const u = api.store.all('Users')[0]; assert(!JSON.stringify(u).includes('rahasia123')); assert(u.password_hash.startsWith('v1:')); assert(u.salt.length >= 8);
});
let tokA;
ok('login benar/salah + rate limit', () => {
  const bad = api.call({ action: 'login', email: 'sari@mail.com', password: 'salah' }); assert.strictEqual(bad.error, 'login');
  const g = api.call({ action: 'login', email: 'SARI@mail.com', password: 'rahasia123' }); assert(g.ok); tokA = g.data.token;
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
  const l2 = api.call({ action: 'load', token: tokA }).data; assert.strictEqual(l2.produk.length, 1); assert.strictEqual(l2.hargaBahan.length, 3); assert.strictEqual(l2.produk[0].hpp, 36000);
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
ok('formula injection dinetralkan & kembali bersih saat dibaca', () => {
  api.call({ action: 'save', token: tokB, ops: [{ op: 'produk.upsert', produk: { id: pid2, nama: '=HYPERLINK("http://x")', harga: 1000 } }] });
  const raw = api.store.all('Produk').filter(r => r.produk_id === pid2)[0]; assert(raw.nama.startsWith("'="), raw.nama);
  assert.strictEqual(api.call({ action: 'load', token: tokB }).data.produk[0].nama, '=HYPERLINK("http://x")');
});
ok('usaha.update (onboarding, kanal, prefs) + whitelist kanal', () => {
  api.call({ action: 'save', token: tokA, ops: [{ op: 'usaha.update', fields: { outlet: '1', omzetRange: '5-15 jt', kanal: ['toko', 'wa', 'hacker'], targetOmzet: 15000000, prefs: { wa: true }, onboarding: 'selesai' } }] });
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
  const g = api.call({ action: 'login', email: 'sari@mail.com', password: 'rahasia123' }).data.token;
  assert(api.call({ action: 'logout', token: g }).ok); assert.strictEqual(api.call({ action: 'load', token: g }).error, 'auth');
  api.advance(31 * 86400000); assert.strictEqual(api.call({ action: 'load', token: tokA }).error, 'auth');
});
ok('hapus akun: butuh sandi, menghapus semua data & hanya milik sendiri', () => {
  const t = api.call({ action: 'login', email: 'sari@mail.com', password: 'rahasia123' }).data.token;
  assert.strictEqual(api.call({ action: 'hapusAkun', token: t, password: 'salah' }).error, 'login');
  assert(api.call({ action: 'hapusAkun', token: t, password: 'rahasia123' }).ok);
  assert.strictEqual(api.store.all('Users').filter(u => u.email === 'sari@mail.com').length, 0);
  assert.strictEqual(api.store.all('Produk').filter(p => p.nama === 'Dimsum Ayam').length, 0);
  assert.strictEqual(api.store.all('Users').filter(u => u.email === 'andi@mail.com').length, 1);
  assert(api.store.all('Produk').some(p => p.produk_id === pid2));   // data B utuh
});
console.log('\n' + n + ' tes lulus');
