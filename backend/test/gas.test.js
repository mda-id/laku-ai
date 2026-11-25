/* Tes adaptor Apps Script (Code.gs) memakai simulasi SpreadsheetApp. Sel ber-format '@' menyimpan SEMUA nilai sebagai teks. */
const assert = require('assert'); const { createGas } = require('./fake-gas');
const G = createGas(), book = G.book, post = G.post;
const vm2 = null;
let n = 0; const ok = (m, f) => { f(); n++; console.log('  ✓ ' + m); };

ok('setup() membuat 13 tab dengan header', () => {
  G.run('setup')();
  assert.strictEqual(Object.keys(book.sheets).length, 13);
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
ok('migrasi kolom: sheet lama (tanpa kolom logo) otomatis diperbarui dan data tetap utuh', () => {
  const G3 = createGas(); G3.run('setup')();
  const sh = G3.book.sheets.Usaha; sh.rows[0] = sh.rows[0].slice(0, 14); sh.maxC = 14; G3.run('checked_ = {}');   // meniru spreadsheet versi lama + eksekusi baru (cache per-eksekusi kosong)
  const p3 = G3.post; const r = p3({ action: 'register', nama: 'Lama', usaha: 'Usaha Lama', email: 'lama@x.id', password: 'rahasia123' }); assert(r.ok, JSON.stringify(r));
  assert.strictEqual(sh.rows[0][14], 'logo'); assert.strictEqual(sh.rows[0].length, 15);
  const tk = r.data.token, png = 'data:image/png;base64,iVBORw0KGgo=';
  assert(p3({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { logo: png } }] }).ok);
  assert.strictEqual(p3({ action: 'load', token: tk }).data.usaha.logo, png); assert.strictEqual(p3({ action: 'load', token: tk }).data.usaha.nama, 'Usaha Lama');
});
ok('ping GAS: google=false tanpa Client ID, true bila terpasang', () => {
  assert.strictEqual(post({ action: 'ping' }).data.google, false);
  assert.strictEqual(createGas({ clientId: CID }).post({ action: 'ping' }).data.google, true);
});
ok('Google tanpa Client ID terpasang di skrip => nonaktif', () => {
  assert.strictEqual(post({ action: 'google', idToken: 'tok|' + CID + '|x@y.com|true|3600' }).error, 'login');
});
ok('bahan baku, resep, produksi lewat doPost; migrasi kolom hasil_resep di tab Produk lama', () => {
  const G4 = createGas({}); const r = G4.post({ action: 'register', nama: 'Bahan', usaha: 'Usaha Bahan', email: 'bahan@x.id', password: 'rahasia123' }); assert(r.ok); const tk = r.data.token;
  const sh = G4.book.sheets.Produk; sh.rows[0] = sh.rows[0].slice(0, 10); sh.maxC = 10; G4.run('checked_ = {}');   // Produk versi lama (tanpa hasil_resep)
  const res = G4.post({ action: 'save', token: tk, ops: [
    { op: 'bahanbaku.upsert', bahan: { id: 'bb_ayam0001', nama: 'Ayam', satuan: 'gram', stok: 5000, hargaBeli: 44000, isiBeli: 1000, minStok: 500 } },
    { op: 'produk.upsert', produk: { id: 'p_dimsum01', nama: 'Dimsum', satuan: 'pack', harga: 45000, hpp: 0, stok: 0, produksiLalu: 0 } },
    { op: 'resep.set', produkId: 'p_dimsum01', hasil: 10, items: [{ bahanId: 'bb_ayam0001', qty: 500 }] },
    { op: 'produksi.catat', produkId: 'p_dimsum01', qty: 10 }] });
  assert(res.ok, JSON.stringify(res)); assert.strictEqual(sh.rows[0].indexOf('hasil_resep') >= 0, true);
  const d = G4.post({ action: 'load', token: tk }).data; assert.strictEqual(d.bahanBaku[0].stok, 4500); assert.strictEqual(d.produk[0].hpp, 2200); assert.strictEqual(d.produk[0].stok, 10); assert.strictEqual(d.produk[0].hasil, 10);
  assert(['BahanBaku', 'Resep', 'StokLog'].every(n => G4.book.sheets[n]));
  const bad = G4.post({ action: 'save', token: tk, ops: [{ op: 'produksi.catat', produkId: 'p_dimsum01', qty: 1000 }] }); assert.strictEqual(bad.ok, false); assert.strictEqual(bad.error, 'stok');
  assert.strictEqual(G4.post({ action: 'load', token: tk }).data.bahanBaku[0].stok, 4500);
});
ok('riset harga pasar: kunci API wajib, panggilan Anthropic benar, hasil disaring, dan cache', () => {
  const calls = []; const good = { rendah: 14000, tengah: 18000, tinggi: 24000, ringkas: 'Seblak di Bandung Rp14-24 rb.', cakupan: 'Kota Bandung', keyakinan: 'sedang', pembanding: [{ nama: 'Seblak A', harga: 17000, sumber: 'GoFood', url: 'https://gofood.co.id/x' }, { nama: '=HYPERLINK(1)', harga: 1, sumber: 'x', url: 'javascript:alert(1)' }], saranValue: ['Tambah topping'], catatan: 'Sampel kecil.' };
  const mk = (props, fn) => createGas({ props, anthropic: fn || (b => { calls.push(b); return { code: 200, body: { stop_reason: 'end_turn', content: [{ type: 'server_tool_use' }, { type: 'text', text: 'Berikut hasilnya:\n' + JSON.stringify(good) }] } }; }) });
  const none = mk({}); assert.strictEqual(none.post({ action: 'ping' }).data.riset, false);
  const G = mk({ ANTHROPIC_API_KEY: 'sk-ant-uji' }); assert.strictEqual(G.post({ action: 'ping' }).data.riset, true);
  const r = G.post({ action: 'register', nama: 'R', usaha: 'Usaha R', email: 'riset@x.id', password: 'rahasia123', kota: 'Bandung' }); assert(r.ok); const tk = r.data.token;
  assert(G.post({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { kota: 'Bandung', jenis: 'Camilan' } }, { op: 'produk.upsert', produk: { id: 'p_seblak01', nama: 'Seblak Komplit', satuan: 'porsi', harga: 20000, hpp: 9000 } }] }).ok);
  assert.strictEqual(none.post({ action: 'riset', token: tk, produkId: 'p_seblak01' }).ok, false);
  const a = G.post({ action: 'riset', token: tk, produkId: 'p_seblak01', kualitas: 'medium' }); assert(a.ok, JSON.stringify(a));
  assert.strictEqual(a.data.cached, false); assert.strictEqual(a.data.hasil.tengah, 18000); assert.strictEqual(a.data.hasil.pembanding.length, 2); assert(!/^=/.test(a.data.hasil.pembanding[1].nama)); assert.strictEqual(a.data.hasil.pembanding[1].url, '');
  assert.strictEqual(calls.length, 1); const b = calls[0]; assert.strictEqual(b.model, 'claude-opus-5-5'); assert(b.tools[0].type.indexOf('web_search') === 0); assert(b.messages[0].content.indexOf('Seblak Komplit') >= 0 && b.messages[0].content.indexOf('Bandung') >= 0 && b.messages[0].content.indexOf('20000') < 0);
  const c = G.post({ action: 'riset', token: tk, produkId: 'p_seblak01', kualitas: 'medium' }); assert(c.ok && c.data.cached === true); assert.strictEqual(calls.length, 1);
  const d = G.post({ action: 'load', token: tk }).data; assert.strictEqual(d.riset.length, 1); assert.strictEqual(d.riset[0].hasil.rendah, 14000); assert(!JSON.stringify(G.book.sheets.Riset.rows).includes('javascript:'));
  for (const k of ['ekonomis', 'premium', 'medium']) { const x = G.post({ action: 'riset', token: tk, produkId: 'p_seblak01', kualitas: k, refresh: true }); assert(x.ok, JSON.stringify(x)); }
  assert.strictEqual(G.post({ action: 'riset', token: tk, produkId: 'p_seblak01', kota: 'Cimahi', kualitas: 'medium' }).ok, true);
  assert.strictEqual(G.post({ action: 'risetKuota', token: tk }).data.sisa, 15);
  const other = G.post({ action: 'register', nama: 'O', usaha: 'Usaha O', email: 'o@x.id', password: 'rahasia123' }); assert.strictEqual(G.post({ action: 'riset', token: other.data.token, produkId: 'p_seblak01' }).ok, false);
});
ok('riset: kegagalan layanan AI tidak membocorkan kunci; fallback dihentikan bila ditolak; pause_turn dilanjutkan', () => {
  let n = 0; const seen = [];
  const G = createGas({ props: { ANTHROPIC_API_KEY: 'sk-ant-RAHASIA' }, anthropic: (b) => { n++; seen.push(b); if (b.fallbacks) return { code: 400, body: { error: { message: 'unknown field fallbacks' } } }; if (n === 2) return { code: 200, body: { stop_reason: 'pause_turn', content: [{ type: 'server_tool_use' }] } }; return { code: 200, body: { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"rendah":10000,"tengah":12000,"tinggi":15000}' }] } }; } });
  const r = G.post({ action: 'register', nama: 'R', usaha: 'Usaha R', email: 'r2@x.id', password: 'rahasia123' }); const tk = r.data.token;
  G.post({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { kota: 'Malang' } }, { op: 'produk.upsert', produk: { id: 'p_risol0001', nama: 'Risol', satuan: 'pcs', harga: 5000, hpp: 2000 } }] });
  const x = G.post({ action: 'riset', token: tk, produkId: 'p_risol0001' }); assert(x.ok, JSON.stringify(x)); assert.strictEqual(x.data.hasil.tengah, 12000); assert.strictEqual(seen[0].fallbacks, 'default'); assert(!seen[1].fallbacks); assert(seen.length >= 3);
  const F = createGas({ props: { ANTHROPIC_API_KEY: 'sk-ant-RAHASIA' }, anthropic: () => ({ code: 401, body: { error: { message: 'invalid x-api-key sk-ant-RAHASIA' } } }) });
  const r2 = F.post({ action: 'register', nama: 'R', usaha: 'Usaha R', email: 'r3@x.id', password: 'rahasia123' }); F.post({ action: 'save', token: r2.data.token, ops: [{ op: 'usaha.update', fields: { kota: 'Malang' } }, { op: 'produk.upsert', produk: { id: 'p_risol0001', nama: 'Risol', satuan: 'pcs', harga: 5000, hpp: 2000 } }] });
  const y = F.post({ action: 'riset', token: r2.data.token, produkId: 'p_risol0001' }); assert.strictEqual(y.ok, false); assert.strictEqual(y.error, 'ai'); assert(!JSON.stringify(y).includes('RAHASIA'));
});
ok('riset manual (AI langganan sendiri, tanpa API): prompt diberikan server, hasil tempelan disaring, tanpa kunci API', () => {
  const G = createGas({}); assert.strictEqual(G.post({ action: 'ping' }).data.riset, false);
  const r = G.post({ action: 'register', nama: 'M', usaha: 'Usaha M', email: 'man@x.id', password: 'rahasia123' }); const tk = r.data.token;
  G.post({ action: 'save', token: tk, ops: [{ op: 'usaha.update', fields: { kota: 'Surabaya', jenis: 'Camilan' } }, { op: 'produk.upsert', produk: { id: 'p_seblak01', nama: 'Seblak', satuan: 'porsi', harga: 20000, hpp: 9000 } }] });
  const pr = G.post({ action: 'risetPrompt', token: tk, produkId: 'p_seblak01', kualitas: 'premium' }); assert(pr.ok); assert(/JSON/.test(pr.data.system) && /Surabaya/.test(pr.data.user) && /premium/.test(pr.data.user) && !/20000/.test(pr.data.user));
  const ans = 'Tentu! ```json\n{"rendah":12000,"tengah":16000,"tinggi":21000,"ringkas":"ok","pembanding":[{"nama":"A","harga":15000,"sumber":"GoFood","url":"https://x.id"}]}\n``` semoga membantu';
  const a = G.post({ action: 'risetManual', token: tk, produkId: 'p_seblak01', kualitas: 'premium', json: ans }); assert(a.ok, JSON.stringify(a)); assert.strictEqual(a.data.hasil.tengah, 16000); assert.strictEqual(a.data.hasil.asal, 'manual');
  assert.strictEqual(G.post({ action: 'load', token: tk }).data.riset[0].hasil.asal, 'manual');
  assert.strictEqual(G.post({ action: 'risetManual', token: tk, produkId: 'p_seblak01', json: 'bukan json' }).error, 'ai');
  assert.strictEqual(G.post({ action: 'risetManual', token: tk, produkId: 'p_seblak01', json: '{"rendah":0,"tengah":0,"tinggi":0}' }).ok, false);
  assert.strictEqual(G.post({ action: 'risetManual', token: tk, produkId: 'p_seblak01', json: 'x'.repeat(30000) }).ok, false);
  const o = G.post({ action: 'register', nama: 'O', usaha: 'Usaha O', email: 'o2@x.id', password: 'rahasia123' }); assert.strictEqual(G.post({ action: 'risetManual', token: o.data.token, produkId: 'p_seblak01', json: ans }).ok, false);
});
ok('kuota Gratis habis setelah lima riset, reset Senin WIB, cache dan manual tetap tersedia', () => {
  const answer = '{"rendah":10000,"tengah":12000,"tinggi":15000}';
  let calls = 0;
  const G = createGas({ props: { ANTHROPIC_API_KEY: 'sk-ant-uji' }, anthropic: () => {
    calls++;
    return { code: 200, body: { content: [{ type: 'text', text: answer }] } };
  } });
  G.setNow('2026-11-29T16:59:59Z');
  function account(email, product) {
    const token = G.post({ action: 'register', nama: 'R', usaha: 'U', email, password: 'rahasia123', kota: 'Malang' }).data.token;
    assert(G.post({ action: 'save', token, ops: [{ op: 'produk.upsert', produk: { id: product, nama: 'Risol isi 5', satuan: 'paket' } }] }).ok);
    return token;
  }
  const token = account('free@x.id', 'p_risolfree');
  const other = account('pro@x.id', 'p_risolpro');
  const users = G.book.sheets.Users.rows;
  const setPlan = (row, paket) => { users[row][users[0].indexOf('paket')] = paket; };
  setPlan(1, 'free');
  setPlan(2, 'pro');
  const q = (action, fields = {}) => G.post({ action, token, produkId: 'p_risolfree', ...fields });
  assert.strictEqual(q('load').data.kuotaRiset.batas, 5);
  for (let i = 0; i < 5; i++) assert.strictEqual(q('riset', { refresh: true }).data.sisa, 4 - i);
  assert.strictEqual(q('riset', { refresh: true }).error, 'limit');
  assert.strictEqual(q('riset', { cacheOnly: true }).data.cached, true);
  assert.strictEqual(q('risetManual', { json: answer }).data.hasil.asal, 'manual');
  const useCache = G.post({ action: 'riset', token: other, produkId: 'p_risolpro' });
  assert.strictEqual(useCache.data.cached, true);
  assert.strictEqual(useCache.data.kuotaRiset.sisa, 20);
  assert.strictEqual(useCache.data.kuotaRiset.sisaBulanan, 90);
  assert.strictEqual(calls, 5);
  G.setNow('2026-11-29T17:00:00Z');
  assert.strictEqual(q('risetKuota').data.sisa, 5);
  assert.strictEqual(q('riset', { kota: 'Surabaya', cacheOnly: true }).error, 'cache');
  assert.strictEqual(q('risetKuota').data.sisa, 5);
});

ok('jatah riset ditahan selama proses, dikembalikan saat gagal, dan batas API berlaku lintas akun', () => {
  let nested, token, calls = 0;
  const G = createGas({ props: { ANTHROPIC_API_KEY: 'sk-ant-uji', RISET_API_LIMIT_HARIAN: '1' }, anthropic: () => {
    calls++;
    nested = G.post({ action: 'riset', token, produkId: 'p_risolfree', refresh: true });
    return { code: 503, body: {} };
  } });
  G.setNow('2026-11-29T16:59:59Z');
  token = G.post({ action: 'register', nama: 'R', usaha: 'U', email: 'cap@x.id', password: 'rahasia123', kota: 'Malang' }).data.token;
  G.book.sheets.Users.rows[1][6] = 'free';
  G.post({ action: 'save', token, ops: [{ op: 'produk.upsert', produk: { id: 'p_risolfree', nama: 'Risol' } }] });
  G.run('GasStore_').append('Riset', Array.from({ length: 4 }, (_, i) => ({
    riset_id: 'rs_fixture_' + i, usaha_id: G.post({ action: 'load', token }).data.usaha.id,
    hasil: '{"asal":"api"}', dibuat: '2026-11-29T16:00:00Z'
  })));
  const search = { action: 'riset', token, produkId: 'p_risolfree', refresh: true };
  assert.strictEqual(G.post(search).error, 'ai');
  assert.strictEqual(nested.error, 'limit');
  assert.strictEqual(G.post({ action: 'risetKuota', token }).data.sisa, 1);
  assert.strictEqual(G.post(search).error, 'budget');
  assert.strictEqual(G.post({ action: 'risetKuota', token }).data.sisa, 1);
  assert.strictEqual(calls, 1);
});

ok('setelah uji coba Pro berakhir, API menutup operasi Pro dan pencatatan dasar tetap aktif', () => {
  const G = createGas();
  G.setNow('2026-11-10T00:00:00Z');
  const token = G.post({ action: 'register', nama: 'R', usaha: 'U', email: 'trial@x.id', password: 'rahasia123' }).data.token;
  const save = (...ops) => G.post({ action: 'save', token, ops });
  const promo = { op: 'promosi.add', rows: [{ id: 'pr_trial_1', nama: 'Diskon', mulai: '2026-11-10', selesai: '2026-11-12' }] };
  assert(save(promo).ok);
  assert.strictEqual(G.post({ action: 'load', token }).data.promosi.length, 1);
  G.setNow('2026-11-24T00:00:00Z');
  assert.strictEqual(G.post({ action: 'load', token }).data.kuotaRiset.paket, 'Free');
  assert.strictEqual(G.post({ action: 'load', token }).data.promosi.length, 0);
  assert.strictEqual(save(promo).error, 'pro');
  assert.strictEqual(save({ op: 'keputusan.add', row: {} }).error, 'pro');
  assert(save({ op: 'produk.upsert', produk: { id: 'p_risol0001', nama: 'Risol' } }).ok);
  G.book.sheets.Users.rows[1][6] = 'pro';
  assert.strictEqual(G.post({ action: 'load', token }).data.promosi.length, 1);
});
ok('Gemini memakai Google Search dan mempertahankan kuota saat akses ditolak atau sumber kosong', () => {
  let mode = 'grounded';
  const G = createGas({
    props: { GEMINI_API_KEY: 'key-gemini-test', ANTHROPIC_API_KEY: 'key-anthropic-test' },
    anthropic: () => assert.fail('Permintaan Gemini tidak boleh beralih provider'),
    gemini: (body, params, url) => {
      assert.strictEqual(url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
      assert.strictEqual(params.headers['x-goog-api-key'], 'key-gemini-test');
      assert.strictEqual(params.headers['Api-Revision'], '2026-05-20');
      assert.strictEqual(body.model, 'gemini-4-hydrogen');
      assert.strictEqual(body.store, false);
      assert.deepStrictEqual(body.tools, [{ type: 'google_search' }]);
      assert(body.input.includes('Malang'));
      if (mode === 'denied') return { code: 429, body: { error: { message: 'key-gemini-test' } } };
      const part = { type: 'text', text: '{"rendah":10000,"tengah":12000,"tinggi":15000}' };
      const steps = [{ type: 'model_output', content: [part] }];
      if (mode === 'queries-only' || mode === 'grounded') {
        steps.unshift({ type: 'google_search_call', arguments: { queries: ['harga risol Malang'] } });
      }
      if (mode === 'grounded') part.annotations = [{ type: 'url_citation', url: 'https://example.com/risol' }];
      return { code: 200, body: { status: mode === 'truncated' ? 'incomplete' : 'completed', steps } };
    }
  });
  assert(G.post({ action: 'ping' }).data.riset);
  const token = G.post({ action: 'register', nama: 'R', usaha: 'U', email: 'gemini@x.id', password: 'rahasia123', kota: 'Malang' }).data.token;
  assert(G.post({ action: 'save', token, ops: [{ op: 'produk.upsert', produk: { id: 'p_risolgmn', nama: 'Risol' } }] }).ok);
  const q = { action: 'riset', token, produkId: 'p_risolgmn', refresh: true };
  const done = G.post(q);
  assert(done.ok, JSON.stringify(done));
  assert.strictEqual(done.data.sisa, 19);
  for (const [failed, message] of [
    ['denied', /HTTP 429/], ['ungrounded', /tidak mencatat pencarian/],
    ['queries-only', /menjalankan pencarian/], ['truncated', /belum menyelesaikan/]
  ]) {
    mode = failed;
    const result = G.post(q);
    assert.strictEqual(result.error, 'ai');
    assert.match(result.message, message);
    assert(!JSON.stringify(result).includes('key-gemini-test'));
    assert.strictEqual(G.post({ action: 'risetKuota', token }).data.sisa, 19);
  }
});
console.log('\n' + n + ' tes adaptor lulus');
