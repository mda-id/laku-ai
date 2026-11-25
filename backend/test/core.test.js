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
ok('Google: email yang sama dengan akun sandi => masuk ke akun yang sama (email terverifikasi)', () => {
  const g = mkApi(); const a = g.call({ action: 'register', nama: 'Sari', usaha: 'U', email: 'sari@x.id', password: 'rahasia123' }); assert(a.ok);
  g.call({ action: 'save', token: a.data.token, ops: [{ op: 'produk.upsert', produk: { id: 'p_link0001', nama: 'Produk Lama', harga: 100 } }] });
  const r = g.call({ action: 'google', idToken: 'good|sari@x.id|subZ|Sari' }); assert.strictEqual(r.data.isNew, false); assert.strictEqual(r.data.data.produk[0].nama, 'Produk Lama');
  assert.strictEqual(g.store.all('Users').length, 1);
  assert(g.call({ action: 'login', email: 'sari@x.id', password: 'rahasia123' }).ok, 'sandi lama tetap berlaku');
});
ok('Google: daftar sandi dengan email yang sudah dipakai akun Google ditolak', () => {
  const g = mkApi(); g.call({ action: 'google', idToken: 'good|a@b.co|s1|A' });
  assert.strictEqual(g.call({ action: 'register', nama: 'X', usaha: 'Y', email: 'a@b.co', password: 'rahasia123' }).error, 'exists');
});
ok('Google: hapus akun butuh email konfirmasi (bukan sandi)', () => {
  const g = mkApi(); const r = g.call({ action: 'google', idToken: 'good|a@b.co|s1|A' }), tk = r.data.token;
  assert.strictEqual(g.call({ action: 'hapusAkun', token: tk, password: 'salah@b.co' }).error, 'login');
  assert(g.call({ action: 'hapusAkun', token: tk, password: 'A@B.co' }).ok); assert.strictEqual(g.store.all('Users').length, 0);
});
ok('logo usaha: simpan, ganti, hapus; format dan ukuran divalidasi', () => {
  const g = mkApi(); const r = g.call({ action: 'register', nama: 'Sari', usaha: 'U', email: 'logo@x.id', password: 'rahasia123' }), tk = r.data.token;
  const png = 'data:image/png;base64,iVBORw0KGgo=', jpg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
  assert.strictEqual(r.data.data.usaha.logo, '');
  assert(g.call({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: png } }] }).ok);
  assert.strictEqual(g.call({ action: 'load', token: tk }).data.usaha.logo, png);
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
console.log('\n' + n + ' tes lulus');
