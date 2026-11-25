/* laku.ai backend — FILE HASIL BUILD, jangan diedit manual.
   Sumber: assets/js/core.js + backend/gas.js. Bangun ulang: node backend/build.js */

/* LakuCore: logika backend bersama.
   Dipakai di dua tempat dengan kode yang sama persis:
   1) Google Apps Script (database = Google Sheets), 2) mode demo di browser (database = localStorage).
   Sinkron, tanpa dependensi. Store dan env disuntikkan dari luar. */
(function (root) {
  'use strict';

  var TABLES = {
    Users: ['user_id', 'nama', 'email', 'wa', 'password_hash', 'salt', 'paket', 'dibuat', 'login_terakhir', 'status'],
    Usaha: ['usaha_id', 'user_id', 'nama_usaha', 'jenis', 'kota', 'outlet', 'omzet_range', 'lama_usaha', 'kanal', 'target_omzet', 'target_margin', 'prefs', 'onboarding', 'dibuat'],
    Produk: ['produk_id', 'usaha_id', 'nama', 'satuan', 'harga_jual', 'hpp', 'stok', 'produksi_lalu', 'aktif', 'sumber'],
    Bahan: ['bahan_id', 'usaha_id', 'produk_id', 'nama', 'harga', 'diperbarui'],
    HargaBahan: ['log_id', 'usaha_id', 'produk_id', 'nama', 'harga', 'tanggal'],
    Penjualan: ['tx_id', 'usaha_id', 'tanggal', 'jam', 'produk_id', 'qty', 'harga', 'kanal', 'sumber'],
    Promosi: ['promo_id', 'usaha_id', 'nama', 'produk_id', 'mulai', 'selesai', 'sumber'],
    Keputusan: ['id', 'usaha_id', 'tipe', 'produk_id', 'saran', 'tindakan', 'nilai_akhir', 'waktu'],
    Sesi: ['token_hash', 'user_id', 'dibuat', 'kedaluwarsa', 'perangkat']
  };
  var NUMS = { harga_jual: 1, hpp: 1, stok: 1, produksi_lalu: 1, harga: 1, qty: 1, saran: 1, nilai_akhir: 1, target_omzet: 1, target_margin: 1 };
  var KANAL = ['toko', 'wa', 'reseller', 'gofood', 'marketplace', 'lainnya'];
  var DAY = 86400000, SESSION_DAYS = 30, LOAD_DAYS = 130, ROUNDS = 2000;
  var RE_DATE = /^\d{4}-\d{2}-\d{2}$/, RE_TIME = /^\d{2}:\d{2}$/, RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- SHA-256 murni (fallback bila env.sha256 tidak ada) ---------- */
  function sha256(str) {
    var ascii = unescape(encodeURIComponent(String(str)));
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var pow = Math.pow, mw = pow(2, 32), i, j, result = '', words = [], bitLen = ascii.length * 8;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], pc = k.length, comp = {};
    for (var c = 2; pc < 64; c++) {
      if (!comp[c]) { for (i = 0; i < 313; i += c) comp[i] = c; hash[pc] = (pow(c, 0.5) * mw) | 0; k[pc++] = (pow(c, 1 / 3) * mw) | 0; }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((bitLen / mw) | 0); words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash; hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : '') + b.toString(16); }
    return result;
  }

  /* ---------- util ---------- */
  function err(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function S(v, max) {
    v = (v == null ? '' : String(v)).replace(/[\u0000-\u001f]/g, ' ').trim();
    max = max || 200; if (v.length > max) v = v.slice(0, max);
    return /^[=+\-@]/.test(v) ? "'" + v : v;   // cegah formula injection di spreadsheet
  }
  function unS(v) { v = (v == null ? '' : String(v)); return /^'[=+\-@]/.test(v) ? v.slice(1) : v; }
  function N(v, min, max, def) { v = Number(v); if (!isFinite(v)) return def == null ? 0 : def; return Math.min(max, Math.max(min, v)); }
  function isTrue(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }
  function typed(t, o) {
    var out = {}, cols = TABLES[t];
    for (var i = 0; i < cols.length; i++) { var c = cols[i], v = o[c]; out[c] = NUMS[c] ? (Number(v) || 0) : unS(v); }
    return out;
  }
  function jparse(s, def) { try { var v = JSON.parse(s); return v && typeof v === 'object' ? v : def; } catch (e) { return def; } }

  function create(store, env) {
    env = env || {};
    var now = function () { return env.now ? env.now() : Date.now(); };
    var H = env.sha256 || sha256;
    var iso = function (ms) { return new Date(ms).toISOString(); };
    var rid = function (p) { return p + '_' + env.randomHex(5); };

    function pwHash(pw, salt) { var h = H(salt + '|' + pw); for (var i = 0; i < ROUNDS; i++) h = H(h + salt + pw); return 'v1:' + h; }
    function safeEq(a, b) { if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

    function newSession(userId, device) {
      var token = env.randomHex(48), t = now();
      store.append('Sesi', [{ token_hash: H(token), user_id: userId, dibuat: iso(t), kedaluwarsa: iso(t + SESSION_DAYS * DAY), perangkat: S(device, 40) }]);
      return token;
    }
    function auth(token) {
      if (!token || typeof token !== 'string' || token.length < 32) throw err('auth', 'Sesi berakhir, silakan masuk lagi.');
      var h = H(token), s = store.all('Sesi').filter(function (r) { return String(r.token_hash) === h; })[0];
      if (!s || Date.parse(s.kedaluwarsa) < now()) throw err('auth', 'Sesi berakhir, silakan masuk lagi.');
      var u = store.all('Users').filter(function (r) { return String(r.user_id) === String(s.user_id); })[0];
      if (!u || u.status !== 'aktif') throw err('auth', 'Akun tidak aktif.');
      var b = store.all('Usaha').filter(function (r) { return String(r.user_id) === String(u.user_id); })[0];
      if (!b) throw err('auth', 'Data usaha tidak ditemukan.');
      return { user: u, usaha: b, sesi: s };
    }

    /* ---------- bentuk data untuk klien ---------- */
    function outUser(u) { u = typed('Users', u); return { id: u.user_id, nama: u.nama, email: u.email, wa: u.wa, paket: u.paket, dibuat: u.dibuat, google: String(u.password_hash).indexOf('google:') === 0 }; }
    function outUsaha(b) {
      b = typed('Usaha', b);
      return { id: b.usaha_id, nama: b.nama_usaha, jenis: b.jenis, kota: b.kota, outlet: b.outlet, omzetRange: b.omzet_range, lamaUsaha: b.lama_usaha,
        kanal: b.kanal ? b.kanal.split(',').filter(Boolean) : [], targetOmzet: b.target_omzet || 15000000, targetMargin: b.target_margin || 35,
        prefs: jparse(b.prefs, {}), onboarding: b.onboarding || 'profil' };
    }
    function loadAll(ctx) {
      var uid = String(ctx.usaha.usaha_id), cutoff = iso(now() - LOAD_DAYS * DAY).slice(0, 10);
      var mine = function (r) { return String(r.usaha_id) === uid; };
      var bahan = store.all('Bahan').filter(mine).map(function (r) { return typed('Bahan', r); });
      var produk = store.all('Produk').filter(mine).filter(function (r) { return isTrue(r.aktif); }).map(function (r) {
        var p = typed('Produk', r);
        return { id: p.produk_id, nama: p.nama, satuan: p.satuan, harga: p.harga_jual, hpp: p.hpp, stok: p.stok, produksiLalu: p.produksi_lalu, sumber: p.sumber,
          bahan: bahan.filter(function (b) { return b.produk_id === p.produk_id; }).map(function (b) { return { id: b.bahan_id, nama: b.nama, harga: b.harga }; }) };
      });
      return {
        user: outUser(ctx.user), usaha: outUsaha(ctx.usaha), produk: produk,
        penjualan: store.all('Penjualan').filter(mine).map(function (r) { return typed('Penjualan', r); }).filter(function (r) { return r.tanggal >= cutoff; })
          .map(function (r) { return { id: r.tx_id, tanggal: r.tanggal, jam: r.jam, produkId: r.produk_id, qty: r.qty, harga: r.harga, kanal: r.kanal, sumber: r.sumber }; }),
        promosi: store.all('Promosi').filter(mine).map(function (r) { r = typed('Promosi', r); return { id: r.promo_id, nama: r.nama, produkId: r.produk_id, mulai: r.mulai, selesai: r.selesai, sumber: r.sumber }; }),
        hargaBahan: store.all('HargaBahan').filter(mine).map(function (r) { r = typed('HargaBahan', r); return { id: r.log_id, produkId: r.produk_id, nama: r.nama, harga: r.harga, tanggal: r.tanggal }; }),
        keputusan: store.all('Keputusan').filter(mine).map(function (r) { r = typed('Keputusan', r); return { id: r.id, tipe: r.tipe, produkId: r.produk_id, saran: r.saran, tindakan: r.tindakan, nilaiAkhir: r.nilai_akhir, waktu: r.waktu }; }),
        serverTime: iso(now())
      };
    }

    /* ---------- aksi publik ---------- */
    function register(q) {
      var email = S(q.email, 120).toLowerCase(), pw = String(q.password || ''), nama = S(q.nama, 80), usaha = S(q.usaha, 80);
      if (!nama || !usaha) throw err('valid', 'Nama pemilik dan nama usaha wajib diisi.');
      if (!RE_EMAIL.test(email)) throw err('valid', 'Format email tidak valid.');
      if (pw.length < 8 || pw.length > 100) throw err('valid', 'Kata sandi minimal 8 karakter.');
      if (store.all('Users').some(function (r) { return String(r.email).toLowerCase() === email; })) throw err('exists', 'Email sudah terdaftar. Silakan masuk.');
      var salt = env.randomHex(8), t = iso(now()), uid = rid('u'), bid = rid('b');
      store.append('Users', [{ user_id: uid, nama: nama, email: email, wa: S(q.wa, 20), password_hash: pwHash(pw, salt), salt: salt, paket: 'pro_trial', dibuat: t, login_terakhir: t, status: 'aktif' }]);
      store.append('Usaha', [{ usaha_id: bid, user_id: uid, nama_usaha: usaha, jenis: S(q.jenis, 40), kota: S(q.kota, 60), outlet: '', omzet_range: '', lama_usaha: '', kanal: '', target_omzet: 15000000, target_margin: 35, prefs: '{}', onboarding: 'profil', dibuat: t }]);
      var token = newSession(uid, q.device), ctx = auth(token);
      return { token: token, data: loadAll(ctx) };
    }
    function login(q) {
      var email = S(q.email, 120).toLowerCase(), pw = String(q.password || ''), key = 'att:' + email;
      var tries = env.cache ? Number(env.cache.get(key) || 0) : 0;
      if (tries >= 8) throw err('limit', 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
      var u = store.all('Users').filter(function (r) { return String(r.email).toLowerCase() === email; })[0];
      if (u && String(u.password_hash).indexOf('google:') === 0) throw err('google', 'Akun ini terdaftar lewat Google. Gunakan tombol "Lanjutkan dengan Google".');
      var ok = u && safeEq(String(u.password_hash), pwHash(pw, String(u.salt))) && u.status === 'aktif';
      if (!ok) { if (env.cache) env.cache.put(key, String(tries + 1), 900); throw err('login', 'Email atau kata sandi salah.'); }
      store.update('Users', function (r) { return String(r.user_id) === String(u.user_id); }, function (r) { r.login_terakhir = iso(now()); });
      store.remove('Sesi', function (r) { return Date.parse(r.kedaluwarsa) < now(); });
      var token = newSession(u.user_id, q.device), ctx = auth(token);
      return { token: token, data: loadAll(ctx) };
    }

    function googleAuth(q) {
      if (!env.verifyGoogle) throw err('valid', 'Masuk dengan Google belum diaktifkan.');
      var g, why = ''; try { g = env.verifyGoogle(String(q.idToken || '')); } catch (e) { g = null; why = String((e && e.message) || e).replace(/[\r\n]+/g, ' ').slice(0, 120); }
      if (!g || !g.email || !g.sub) throw err('login', 'Token Google tidak valid atau kedaluwarsa. Coba lagi.' + (why ? ' (Rincian: ' + why + ')' : ''));
      var email = S(g.email, 120).toLowerCase(), isNew = false;
      var u = store.all('Users').filter(function (r) { return String(r.email).toLowerCase() === email; })[0];
      if (u && u.status !== 'aktif') throw err('login', 'Akun tidak aktif.');
      if (!u) {
        var t = iso(now()), uid = rid('u'), bid = rid('b'), nama = S(g.name || email.split('@')[0], 80) || 'Pengguna';
        store.append('Users', [{ user_id: uid, nama: nama, email: email, wa: '', password_hash: 'google:' + S(g.sub, 40), salt: '', paket: 'pro_trial', dibuat: t, login_terakhir: t, status: 'aktif' }]);
        store.append('Usaha', [{ usaha_id: bid, user_id: uid, nama_usaha: S(q.usaha || ('Usaha ' + nama), 80), jenis: '', kota: '', outlet: '', omzet_range: '', lama_usaha: '', kanal: '', target_omzet: 15000000, target_margin: 35, prefs: '{"g":true}', onboarding: 'profil', dibuat: t }]);
        u = { user_id: uid }; isNew = true;
      } else store.update('Users', function (r) { return String(r.user_id) === String(u.user_id); }, function (r) { r.login_terakhir = iso(now()); });
      store.remove('Sesi', function (r) { return Date.parse(r.kedaluwarsa) < now(); });
      var token = newSession(u.user_id, q.device), ctx = auth(token);
      return { token: token, isNew: isNew, data: loadAll(ctx) };
    }

    /* ---------- operasi simpan ---------- */
    var OPS = {};
    OPS['usaha.update'] = function (ctx, o) {
      var f = o.fields || {}, p = {};
      if ('nama' in f) p.nama_usaha = S(f.nama, 80);
      if ('jenis' in f) p.jenis = S(f.jenis, 40);
      if ('kota' in f) p.kota = S(f.kota, 60);
      if ('outlet' in f) p.outlet = S(f.outlet, 20);
      if ('omzetRange' in f) p.omzet_range = S(f.omzetRange, 30);
      if ('lamaUsaha' in f) p.lama_usaha = S(f.lamaUsaha, 30);
      if ('kanal' in f) p.kanal = (Array.isArray(f.kanal) ? f.kanal : []).filter(function (k) { return KANAL.indexOf(k) >= 0; }).join(',');
      if ('targetOmzet' in f) p.target_omzet = N(f.targetOmzet, 0, 1e12, 15000000);
      if ('targetMargin' in f) p.target_margin = N(f.targetMargin, 1, 90, 35);
      if ('prefs' in f) { var js = JSON.stringify(f.prefs || {}); if (js.length > 1500) throw err('valid', 'Pengaturan terlalu besar.'); p.prefs = js; }
      if ('onboarding' in f) p.onboarding = ['profil', 'produk', 'data', 'selesai'].indexOf(f.onboarding) >= 0 ? f.onboarding : 'profil';
      store.update('Usaha', function (r) { return String(r.usaha_id) === String(ctx.usaha.usaha_id); }, function (r) { for (var k in p) r[k] = p[k]; });
    };
    OPS['profil.update'] = function (ctx, o) {
      var f = o.fields || {}, p = {};
      if ('nama' in f) { p.nama = S(f.nama, 80); if (!p.nama) throw err('valid', 'Nama tidak boleh kosong.'); }
      if ('wa' in f) p.wa = S(f.wa, 20);
      store.update('Users', function (r) { return String(r.user_id) === String(ctx.user.user_id); }, function (r) { for (var k in p) r[k] = p[k]; });
    };
    OPS['produk.upsert'] = function (ctx, o) {
      var p = o.produk || {}, uid = String(ctx.usaha.usaha_id), id = S(p.id, 30);
      if (!/^p_[a-z0-9]{4,20}$/.test(id)) throw err('valid', 'ID produk tidak valid.');
      var existing = store.all('Produk').filter(function (r) { return String(r.produk_id) === id; })[0];
      if (existing && String(existing.usaha_id) !== uid) throw err('forbidden', 'Produk bukan milik Anda.');
      var nama = S(p.nama, 60); if (!nama) throw err('valid', 'Nama produk wajib diisi.');
      var row = { produk_id: id, usaha_id: uid, nama: nama, satuan: S(p.satuan || 'pcs', 12), harga_jual: N(p.harga, 0, 1e9), hpp: N(p.hpp, 0, 1e9), stok: N(p.stok, 0, 1e7), produksi_lalu: N(p.produksiLalu, 0, 1e7), aktif: 'TRUE', sumber: p.sumber === 'contoh' ? 'contoh' : 'manual' };
      if (!existing) {
        var count = store.all('Produk').filter(function (r) { return String(r.usaha_id) === uid && isTrue(r.aktif); }).length;
        if (count >= 60) throw err('limit', 'Batas 60 produk tercapai.');
        store.append('Produk', [row]);
      } else store.update('Produk', function (r) { return String(r.produk_id) === id; }, function (r) { for (var k in row) r[k] = row[k]; });
      if (Array.isArray(p.bahan)) {
        var t = iso(now()), today = t.slice(0, 10), prev = store.all('Bahan').filter(function (r) { return String(r.usaha_id) === uid && String(r.produk_id) === id; });
        var list = p.bahan.slice(0, 40).map(function (b) { return { bahan_id: /^m_[a-z0-9]{4,20}$/.test(String(b.id)) ? String(b.id) : rid('m'), usaha_id: uid, produk_id: id, nama: S(b.nama, 60), harga: N(b.harga, 0, 1e9), diperbarui: t }; }).filter(function (b) { return b.nama; });
        var logs = [];
        list.forEach(function (b) { var old = prev.filter(function (x) { return String(x.nama) === b.nama; })[0]; if (!old || Number(old.harga) !== b.harga) logs.push({ log_id: rid('h'), usaha_id: uid, produk_id: id, nama: b.nama, harga: b.harga, tanggal: today }); });
        store.remove('Bahan', function (r) { return String(r.usaha_id) === uid && String(r.produk_id) === id; });
        store.append('Bahan', list);
        store.append('HargaBahan', logs);
      }
    };
    OPS['produk.delete'] = function (ctx, o) {
      var id = S(o.id, 30), uid = String(ctx.usaha.usaha_id);
      store.update('Produk', function (r) { return String(r.produk_id) === id && String(r.usaha_id) === uid; }, function (r) { r.aktif = 'FALSE'; });
    };
    OPS['penjualan.add'] = function (ctx, o) {
      var rows = Array.isArray(o.rows) ? o.rows : []; if (rows.length > 2000) throw err('limit', 'Maksimal 2000 baris per simpan.');
      var uid = String(ctx.usaha.usaha_id), owned = {};
      store.all('Produk').forEach(function (r) { if (String(r.usaha_id) === uid) owned[String(r.produk_id)] = 1; });
      var out = rows.map(function (r) {
        if (!RE_DATE.test(String(r.tanggal))) throw err('valid', 'Format tanggal harus YYYY-MM-DD.');
        if (!owned[String(r.produkId)]) throw err('valid', 'Produk tidak ditemukan.');
        var qty = N(r.qty, 0, 1e6); if (qty <= 0) throw err('valid', 'Jumlah harus lebih dari 0.');
        return { tx_id: /^t_[a-z0-9]{4,20}$/.test(String(r.id)) ? String(r.id) : rid('t'), usaha_id: uid, tanggal: String(r.tanggal), jam: RE_TIME.test(String(r.jam)) ? String(r.jam) : '12:00', produk_id: String(r.produkId), qty: qty, harga: N(r.harga, 0, 1e9), kanal: KANAL.indexOf(r.kanal) >= 0 ? r.kanal : 'toko', sumber: ['manual', 'impor', 'nota', 'contoh'].indexOf(r.sumber) >= 0 ? r.sumber : 'manual' };
      });
      store.append('Penjualan', out);
    };
    OPS['penjualan.delete'] = function (ctx, o) {
      var ids = {}, uid = String(ctx.usaha.usaha_id); (o.ids || []).slice(0, 500).forEach(function (i) { ids[String(i)] = 1; });
      store.remove('Penjualan', function (r) { return String(r.usaha_id) === uid && ids[String(r.tx_id)]; });
    };
    OPS['promosi.add'] = function (ctx, o) {
      var rows = (Array.isArray(o.rows) ? o.rows : []).slice(0, 50), uid = String(ctx.usaha.usaha_id);
      store.append('Promosi', rows.map(function (r) {
        if (!RE_DATE.test(String(r.mulai)) || !RE_DATE.test(String(r.selesai)) || r.selesai < r.mulai) throw err('valid', 'Tanggal promosi tidak valid.');
        var nm = S(r.nama, 80); if (!nm) throw err('valid', 'Nama promosi wajib diisi.');
        return { promo_id: /^r_[a-z0-9]{4,20}$/.test(String(r.id)) ? String(r.id) : rid('r'), usaha_id: uid, nama: nm, produk_id: S(r.produkId, 30), mulai: r.mulai, selesai: r.selesai, sumber: r.sumber === 'contoh' ? 'contoh' : 'manual' };
      }));
    };
    OPS['promosi.delete'] = function (ctx, o) {
      var id = S(o.id, 30), uid = String(ctx.usaha.usaha_id);
      store.remove('Promosi', function (r) { return String(r.promo_id) === id && String(r.usaha_id) === uid; });
    };
    OPS['hargabahan.add'] = function (ctx, o) {
      var uid = String(ctx.usaha.usaha_id);
      store.append('HargaBahan', (o.rows || []).slice(0, 200).map(function (r) {
        if (!RE_DATE.test(String(r.tanggal))) throw err('valid', 'Tanggal tidak valid.');
        return { log_id: rid('h'), usaha_id: uid, produk_id: S(r.produkId, 30), nama: S(r.nama, 60), harga: N(r.harga, 0, 1e9), tanggal: r.tanggal };
      }));
    };
    OPS['keputusan.add'] = function (ctx, o) {
      var r = o.row || {}, uid = String(ctx.usaha.usaha_id);
      store.append('Keputusan', [{ id: /^k_[a-z0-9]{4,20}$/.test(String(r.id)) ? String(r.id) : rid('k'), usaha_id: uid, tipe: ['stok', 'harga'].indexOf(r.tipe) >= 0 ? r.tipe : 'stok', produk_id: S(r.produkId, 30), saran: N(r.saran, 0, 1e9), tindakan: ['ikuti', 'ubah'].indexOf(r.tindakan) >= 0 ? r.tindakan : 'ikuti', nilai_akhir: N(r.nilaiAkhir, 0, 1e9), waktu: iso(now()) }]);
    };
    OPS['contoh.hapus'] = function (ctx) {
      var uid = String(ctx.usaha.usaha_id), sample = {};
      store.all('Produk').forEach(function (r) { if (String(r.usaha_id) === uid && r.sumber === 'contoh') sample[String(r.produk_id)] = 1; });
      store.remove('Penjualan', function (r) { return String(r.usaha_id) === uid && (r.sumber === 'contoh' || sample[String(r.produk_id)]); });
      store.remove('Promosi', function (r) { return String(r.usaha_id) === uid && r.sumber === 'contoh'; });
      store.remove('Bahan', function (r) { return String(r.usaha_id) === uid && sample[String(r.produk_id)]; });
      store.remove('HargaBahan', function (r) { return String(r.usaha_id) === uid && sample[String(r.produk_id)]; });
      store.remove('Keputusan', function (r) { return String(r.usaha_id) === uid && sample[String(r.produk_id)]; });
      store.remove('Produk', function (r) { return String(r.usaha_id) === uid && sample[String(r.produk_id)]; });
    };

    function save(ctx, q) {
      var ops = Array.isArray(q.ops) ? q.ops : [];
      if (ops.length > 60) throw err('limit', 'Terlalu banyak operasi.');
      ops.forEach(function (o) { var fn = OPS[o && o.op]; if (!fn) throw err('valid', 'Operasi tidak dikenal: ' + (o && o.op)); fn(ctx, o); });
      return { saved: ops.length, time: iso(now()) };
    }
    function hapusAkun(ctx, q) {
      var u = ctx.user;
      if (String(u.password_hash).indexOf('google:') === 0) { if (String(q.password || '').trim().toLowerCase() !== String(u.email).toLowerCase()) throw err('login', 'Email konfirmasi tidak cocok.'); }
      else if (!safeEq(String(u.password_hash), pwHash(String(q.password || ''), String(u.salt)))) throw err('login', 'Kata sandi salah.');
      var uid = String(ctx.usaha.usaha_id), usr = String(u.user_id), mine = function (r) { return String(r.usaha_id) === uid; };
      ['Produk', 'Bahan', 'HargaBahan', 'Penjualan', 'Promosi', 'Keputusan'].forEach(function (t) { store.remove(t, mine); });
      store.remove('Usaha', function (r) { return String(r.usaha_id) === uid; });
      store.remove('Sesi', function (r) { return String(r.user_id) === usr; });
      store.remove('Users', function (r) { return String(r.user_id) === usr; });
      return { deleted: true };
    }

    function handle(q) {
      try {
        q = q || {};
        switch (q.action) {
          case 'ping': return { ok: true, data: { service: 'laku-ai', time: iso(now()), version: 2, google: env.googleEnabled ? !!env.googleEnabled() : !!env.verifyGoogle } };
          case 'register': return { ok: true, data: register(q) };
          case 'login': return { ok: true, data: login(q) };
          case 'google': return { ok: true, data: googleAuth(q) };
        }
        var ctx = auth(q.token);
        switch (q.action) {
          case 'load': return { ok: true, data: loadAll(ctx) };
          case 'save': return { ok: true, data: save(ctx, q) };
          case 'logout': store.remove('Sesi', function (r) { return String(r.token_hash) === String(ctx.sesi.token_hash); }); return { ok: true, data: { bye: true } };
          case 'hapusAkun': return { ok: true, data: hapusAkun(ctx, q) };
        }
        throw err('valid', 'Aksi tidak dikenal.');
      } catch (e) {
        if (e && e.code) return { ok: false, error: e.code, message: e.message };
        return { ok: false, error: 'server', message: 'Terjadi kesalahan di server.' };
      }
    }
    return { handle: handle };
  }

  root.LakuCore = { create: create, TABLES: TABLES, sha256: sha256, WRITE_ACTIONS: ['register', 'login', 'google', 'save', 'logout', 'hapusAkun'] };
})(typeof self !== 'undefined' ? self : this);


/* ===== Adaptor Google Apps Script: store = Google Sheets, endpoint = Web App ===== */

var LAKU_FORMAT_ROWS_ = 3000;
/* ID spreadsheet database. Kosongkan bila skrip ini dibuat dari Extensions > Apps Script di dalam spreadsheet-nya. */
var LAKU_SPREADSHEET_ID_ = '1ODmtf1OkA1mExrEOz9aR6l5xBIu_s0onzq6Gq3aIqyg';
/* OAuth Client ID (Web application) dari Google Cloud Console untuk Masuk dengan Google. Kosong = fitur nonaktif. */
var LAKU_GOOGLE_CLIENT_ID_ = '576844121387-9e0lehogiaghqf02qntumm68548ail5v.apps.googleusercontent.com';
function book_() { return LAKU_SPREADSHEET_ID_ ? SpreadsheetApp.openById(LAKU_SPREADSHEET_ID_) : SpreadsheetApp.getActiveSpreadsheet(); }

function sheetFor_(name) {
  var ss = book_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var cols = LakuCore.TABLES[name];
  if (sh.getLastRow() < 1 || String(sh.getRange(1, 1).getValue()) !== cols[0]) initSheet_(sh, name);
  return sh;
}

function initSheet_(sh, name) {
  var cols = LakuCore.TABLES[name];
  if (sh.getMaxColumns() < cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), cols.length - sh.getMaxColumns());
  if (sh.getMaxRows() < LAKU_FORMAT_ROWS_) sh.insertRowsAfter(sh.getMaxRows(), LAKU_FORMAT_ROWS_ - sh.getMaxRows());
  sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length).setNumberFormat('@'); // teks polos: cegah tanggal/nomor WA berubah format
  sh.getRange(1, 1, 1, cols.length).setNumberFormat('@').setValues([cols]).setFontWeight('bold').setBackground('#E6F4EA');
  sh.setFrozenRows(1);
}

function rowToObj_(cols, v) { var o = {}; for (var i = 0; i < cols.length; i++) o[cols[i]] = v[i]; return o; }
function objToRow_(cols, o) { return cols.map(function (c) { return o[c] == null ? '' : o[c]; }); }

var GasStore_ = {
  all: function (t) {
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], last = sh.getLastRow();
    if (last < 2) return [];
    return sh.getRange(2, 1, last - 1, cols.length).getValues().map(function (v) { return rowToObj_(cols, v); });
  },
  append: function (t, rows) {
    if (!rows.length) return;
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], start = Math.max(sh.getLastRow(), 1) + 1, need = start + rows.length - 1;
    if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows() + 500);
    var rng = sh.getRange(start, 1, rows.length, cols.length);
    rng.setNumberFormat('@');
    rng.setValues(rows.map(function (o) { return objToRow_(cols, o); }));
  },
  update: function (t, pred, fn) {
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], last = sh.getLastRow();
    if (last < 2) return;
    var vals = sh.getRange(2, 1, last - 1, cols.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      var o = rowToObj_(cols, vals[i]);
      if (pred(o)) { fn(o); sh.getRange(i + 2, 1, 1, cols.length).setValues([objToRow_(cols, o)]); }
    }
  },
  remove: function (t, pred) {
    var sh = sheetFor_(t), cols = LakuCore.TABLES[t], last = sh.getLastRow();
    if (last < 2) return;
    var vals = sh.getRange(2, 1, last - 1, cols.length).getValues();
    var keep = vals.filter(function (v) { return !pred(rowToObj_(cols, v)); });
    if (keep.length === vals.length) return;
    sh.getRange(2, 1, last - 1, cols.length).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, cols.length).setValues(keep);
  }
};

var GasEnv_ = {
  now: function () { return Date.now(); },
  randomHex: function (n) { return (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, n); },
  sha256: function (s) {
    var d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8), h = '';
    for (var i = 0; i < d.length; i++) { var b = (d[i] + 256) % 256; h += (b < 16 ? '0' : '') + b.toString(16); }
    return h;
  },
  googleEnabled: function () { return !!LAKU_GOOGLE_CLIENT_ID_; },
  verifyGoogle: function (idToken) {
    if (!LAKU_GOOGLE_CLIENT_ID_ || !idToken) throw new Error('nonaktif');
    var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('token ditolak');
    var t = JSON.parse(res.getContentText());
    if (t.aud !== LAKU_GOOGLE_CLIENT_ID_) throw new Error('aud tidak cocok');
    if (['accounts.google.com', 'https://accounts.google.com'].indexOf(t.iss) < 0) throw new Error('iss salah');
    if (String(t.email_verified) !== 'true') throw new Error('email belum terverifikasi');
    if (Number(t.exp) * 1000 < Date.now()) throw new Error('kedaluwarsa');
    return { sub: t.sub, email: t.email, name: t.name };
  },
  cache: { get: function (k) { return CacheService.getScriptCache().get(k); }, put: function (k, v, ttl) { CacheService.getScriptCache().put(k, v, ttl); } }
};

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) {
  var res, lock = LockService.getScriptLock(), locked = false;
  try {
    var q = JSON.parse(e.postData.contents);
    if (q.action !== 'ping') { lock.waitLock(25000); locked = true; }
    res = LakuCore.create(GasStore_, GasEnv_).handle(q);
  } catch (err) {
    res = { ok: false, error: 'server', message: 'Terjadi kesalahan di server.' };
  } finally {
    if (locked) lock.releaseLock();
  }
  return json_(res);
}

function doGet() { return json_({ ok: true, data: { service: 'laku-ai', status: 'siap', hint: 'Gunakan POST dari aplikasi laku.ai' } }); }

/* Jalankan dari editor (pilih fungsi "cekGoogle" lalu Run) untuk memberi izin akses eksternal dan memeriksa koneksi ke Google. Log yang benar: HTTP 400 dan Client ID terpasang. */
function cekGoogle() {
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=uji', { muteHttpExceptions: true });
  Logger.log('Koneksi ke Google OK (HTTP ' + r.getResponseCode() + ', 400 = normal untuk token uji)');
  Logger.log('Client ID terpasang: ' + (LAKU_GOOGLE_CLIENT_ID_ || '(KOSONG: Masuk dengan Google nonaktif)'));
}

/* Jalankan SEKALI dari editor (pilih fungsi "setup" lalu Run) untuk memberi izin dan menyiapkan semua tab. */
function setup() {
  Object.keys(LakuCore.TABLES).forEach(function (t) { sheetFor_(t); });
  var s = book_().getSheetByName('Sheet1');
  if (s && s.getLastRow() === 0 && book_().getSheets().length > 1) book_().deleteSheet(s);
  Logger.log('Siap. Tab: ' + Object.keys(LakuCore.TABLES).join(', '));
}
