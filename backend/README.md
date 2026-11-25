# Backend laku.ai: Google Sheets + Apps Script

Aplikasi (GitHub Pages) berbicara ke **Google Apps Script Web App**, yang membaca dan menulis **Google Sheets**. Semua logika ada di `assets/js/core.js` (juga dipakai mode demo di browser), dibungkus oleh `backend/gas.js` dan digabung menjadi satu file `backend/Code.gs`.

Spreadsheet database: **laku.ai Database** (id `1ODmtf1OkA1mExrEOz9aR6l5xBIu_s0onzq6Gq3aIqyg`), 9 tab: `Users`, `Usaha`, `Produk`, `Bahan`, `HargaBahan`, `Penjualan`, `Promosi`, `Keputusan`, `Sesi`. Nama tab dan header jangan diubah.

## Pasang (sekali, ±3 menit)

1. Buka spreadsheet, menu **Extensions → Apps Script**.
2. Hapus isi `Code.gs` bawaan, tempel seluruh isi [`backend/Code.gs`](Code.gs), klik **Save**.
3. Pilih fungsi **`setup`** di bar atas, klik **Run**, lalu **Review permissions → pilih akun → Advanced → Go to … (unsafe) → Allow**. (Peringatan muncul karena skrip belum diverifikasi Google; skrip ini milik Anda sendiri.)
4. Klik **Deploy → New deployment → ikon roda gigi → Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - klik **Deploy**, salin **Web app URL** (berakhiran `/exec`).
5. Tempel URL itu ke `assets/js/config.js` pada `API_URL`, commit ke `main`. Selesai: aplikasi berpindah dari mode demo ke database Sheets.
6. Cek: buka URL `/exec` di browser; harus tampil `{"ok":true,"data":{"service":"laku-ai","status":"siap"...}}`.

Mengubah kode backend nanti: tempel `Code.gs` baru, lalu **Deploy → Manage deployments → ✎ → Version: New version → Deploy** (URL tetap sama).

## Keamanan

- Akses "Anyone" hanya membuka pintu API; setiap aksi data wajib token sesi, dan server selalu memfilter berdasarkan `usaha_id` milik token (diuji: akun B tidak bisa membaca/mengubah data akun A).
- Kata sandi disimpan sebagai hash SHA-256 berulang 2000 kali + salt acak (bukan sandi asli). Ini lebih lemah daripada bcrypt; pertimbangkan Masuk dengan Google bila beta berkembang.
- Token sesi disimpan di sheet `Sesi` hanya dalam bentuk hash; berlaku 30 hari. Percobaan login dibatasi 8 kali per 15 menit per email.
- Teks yang diawali `= + - @` dinetralkan agar tidak dieksekusi sebagai rumus di sheet.
- **Jangan bagikan spreadsheet** kecuali ke tim inti: berisi hash sandi dan data usaha pengguna.

## Batas

Cocok untuk beta 15-20 pengguna. Apps Script punya kuota harian dan respons 1-3 detik; tiap tab dirancang 3.000 baris (otomatis bertambah). Untuk skala lebih besar, pindahkan ke Postgres/Supabase dengan antarmuka `store` yang sama (`all`, `append`, `update`, `remove`).

## Pengembangan

```bash
node backend/test/core.test.js       # logika backend (14 tes)
node backend/test/gas.test.js        # adaptor Apps Script dengan simulasi SpreadsheetApp (8 tes)
node backend/test/analytics.test.js  # mesin analitik
SPREADSHEET_ID=<id> node backend/build.js   # hasilkan backend/Code.gs
node backend/test/fake-gas-server.js 8790   # server tiruan untuk uji e2e mode "sheets"
```
