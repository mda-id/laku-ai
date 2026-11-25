/* Tes adaptor Apps Script (Code.gs) memakai simulasi SpreadsheetApp. Sel ber-format '@' menyimpan SEMUA nilai sebagai teks. */
const assert = require('assert'); const { createGas } = require('./fake-gas');
const G = createGas(), book = G.book, post = G.post;
const vm2 = null;
let n = 0; const ok = (m, f) => { f(); n++; console.log('  ✓ ' + m); };

ok('setup() membuat 9 tab dengan header', () => {
  G.run('setup')();
  assert.strictEqual(Object.keys(book.sheets).length, 9);
  assert.deepStrictEqual(book.sheets.Penjualan.rows[0], ['tx_id', 'usaha_id', 'tanggal', 'jam', 'produk_id', 'qty', 'harga', 'kanal', 'sumber']);
});
let tok;
ok('daftar via doPost; sandi tidak tampil; nomor WA 0812 tetap utuh', () => {
  const r = post({ action: 'register', nama: 'Sari', usaha: 'Dapur Sari', email: 'sari@mail.com', password: 'rahasia123', wa: '08123456789', jenis: 'Frozen food', kota: 'Malang' });
  assert(r.ok, JSON.stringify(r)); tok = r.data.token;
  const u = book.sheets.Users.rows[1]; assert.strictEqual(u[3], '08123456789'); assert(!JSON.stringify(book.sheets.Users.rows).includes('rahasia123'));
  assert(!JSON.stringify(book.sheets.Sesi.rows).includes(tok), 'token tidak boleh tersimpan polos');
});
ok('login ulang berhasil, sandi salah gagal', () => {
  assert(post({ action: 'login', email: 'sari@mail.com', password: 'rahasia123' }).ok);
  assert.strictEqual(post({ action: 'login', email: 'sari@mail.com', password: 'salah!!!!' }).error, 'login');
});
ok('produk + bahan + penjualan: angka & tanggal kembali benar walau sel teks', () => {
  const r = post({ action: 'save', token: tok, ops: [
    { op: 'produk.upsert', produk: { id: 'p_risol001', nama: 'Risol Mayo', satuan: 'pcs', harga: 10000, hpp: 5900, stok: 35, produksiLalu: 80, bahan: [{ nama: 'Tepung', harga: 6500 }] } },
    { op: 'penjualan.add', rows: [{ tanggal: '2026-11-20', jam: '13:40', produkId: 'p_risol001', qty: 24, harga: 10000, kanal: 'toko' }, { tanggal: '2026-11-21', jam: '09:05', produkId: 'p_risol001', qty: 12, harga: 10000, kanal: 'wa' }] }] });
  assert(r.ok, JSON.stringify(r));
  const d = post({ action: 'load', token: tok }).data;
  assert.strictEqual(d.produk[0].harga, 10000); assert.strictEqual(typeof d.produk[0].harga, 'number'); assert.strictEqual(d.produk[0].bahan[0].harga, 6500);
  assert.strictEqual(d.penjualan.length, 2); assert.strictEqual(d.penjualan[0].tanggal, '2026-11-20'); assert.strictEqual(d.penjualan[0].qty, 24); assert.strictEqual(d.penjualan[0].jam, '13:40');
});
ok('update produk menimpa baris yang sama (tidak menggandakan)', () => {
  post({ action: 'save', token: tok, ops: [{ op: 'produk.upsert', produk: { id: 'p_risol001', nama: 'Risol Mayo', harga: 11000, hpp: 5900, stok: 20 } }] });
  const d = post({ action: 'load', token: tok }).data; assert.strictEqual(d.produk.length, 1); assert.strictEqual(d.produk[0].harga, 11000); assert.strictEqual(d.produk[0].stok, 20);
  assert.strictEqual(book.sheets.Produk.getLastRow(), 2);
});
ok('hapus baris di tengah tidak merusak baris lain', () => {
  const d = post({ action: 'load', token: tok }).data, first = d.penjualan[0].id;
  post({ action: 'save', token: tok, ops: [{ op: 'penjualan.delete', ids: [first] }] });
  const d2 = post({ action: 'load', token: tok }).data; assert.strictEqual(d2.penjualan.length, 1); assert.strictEqual(d2.penjualan[0].tanggal, '2026-11-21');
});
ok('isolasi antar akun lewat doPost', () => {
  const b = post({ action: 'register', nama: 'Andi', usaha: 'Kedai Andi', email: 'andi@mail.com', password: 'rahasia456' }).data.token;
  assert.strictEqual(post({ action: 'load', token: b }).data.produk.length, 0);
  assert.strictEqual(post({ action: 'save', token: b, ops: [{ op: 'produk.upsert', produk: { id: 'p_risol001', nama: 'X', harga: 1 } }] }).error, 'forbidden');
});
ok('JSON rusak / aksi aneh tidak membocorkan error internal', () => {
  const out = post('{bukan json'); assert.strictEqual(out.ok, false); assert.strictEqual(out.error, 'server');
  assert.strictEqual(post({ action: 'drop_database' }).error, 'auth');
});

const CID = '123456-abc.apps.googleusercontent.com';
ok('Google via doPost: token sah diterima; aud salah / email belum verifikasi / kedaluwarsa ditolak', () => {
  const G2 = createGas({ clientId: CID }); G2.run('setup')();
  const p2 = G2.post;
  const good = p2({ action: 'google', idToken: 'tok|' + CID + '|dewi@mail.com|true|3600|Dewi Rahma' }); assert(good.ok, JSON.stringify(good)); assert.strictEqual(good.data.isNew, true);
  assert.strictEqual(p2({ action: 'google', idToken: 'tok|client-lain.apps.googleusercontent.com|x@y.com|true|3600' }).error, 'login');
  assert.strictEqual(p2({ action: 'google', idToken: 'tok|' + CID + '|x@y.com|false|3600' }).error, 'login');
  assert.strictEqual(p2({ action: 'google', idToken: 'tok|' + CID + '|x@y.com|true|-10' }).error, 'login');
  assert.strictEqual(p2({ action: 'google', idToken: 'sembarang' }).error, 'login');
  const again = p2({ action: 'google', idToken: 'tok|' + CID + '|dewi@mail.com|true|3600|Dewi Rahma' }); assert.strictEqual(again.data.isNew, false);
  assert.strictEqual(G2.book.sheets.Users.getLastRow(), 2, 'satu baris Users saja');
  assert(String(G2.book.sheets.Users.rows[1][4]).startsWith('google:'), 'hash sandi berisi penanda google, bukan sandi');
});
ok('Google tanpa Client ID terpasang di skrip => nonaktif', () => {
  assert.strictEqual(post({ action: 'google', idToken: 'tok|' + CID + '|x@y.com|true|3600' }).error, 'login');
});
console.log('\n' + n + ' tes adaptor lulus');
