# Backend laku.ai: Google Sheets + Apps Script

Aplikasi (GitHub Pages) berbicara ke **Google Apps Script Web App**, yang membaca dan menulis **Google Sheets**. Semua logika ada di `assets/js/core.js` (juga dipakai mode demo di browser), dibungkus oleh `backend/gas.js` dan digabung menjadi satu file `backend/Code.gs`.

Kolom baru di kode otomatis ditambahkan ke header sheet lama saat pertama dipakai (migrasi; mis. kolom `logo` di tab `Usaha`).

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

## Masuk dengan Google (opsional)

Tombol "Lanjutkan dengan Google" di halaman Daftar dan Masuk. Kode sudah ada; tombolnya hanya muncul setelah **Client ID** diisi. Token Google diperiksa di server (Apps Script menghubungi `oauth2.googleapis.com/tokeninfo`): tanda tangan, `aud` (harus Client ID Anda), `iss`, email terverifikasi, dan kedaluwarsa. Email yang sama dengan akun sandi otomatis menyatu ke akun itu.

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → pilih atau buat project.
2. **APIs & Services → OAuth consent screen**: User type **External**, isi nama aplikasi (laku.ai) dan email dukungan, lalu **Publish app** (status "In production"; cakupan `openid`, `email`, `profile` tidak perlu verifikasi). Bila dibiarkan "Testing", hanya *test users* yang bisa masuk.
3. **Credentials → Create credentials → OAuth client ID → Web application**. Pada **Authorized JavaScript origins** isi `https://mda-id.github.io` (tanpa path dan tanpa garis miring di akhir). *Redirect URI* tidak perlu. Salin **Client ID** (`…apps.googleusercontent.com`; bukan rahasia).
4. Isi `GOOGLE_CLIENT_ID` di `assets/js/config.js`.
5. Bangun ulang backend dengan Client ID yang sama, lalu tempel ke Apps Script:
   ```bash
   SPREADSHEET_ID=1ODmtf1OkA1mExrEOz9aR6l5xBIu_s0onzq6Gq3aIqyg GOOGLE_CLIENT_ID=<client-id> node backend/build.js
   ```
   Tempel `backend/Code.gs`, **Deploy → Manage deployments → ✎ → New version → Deploy**, dan izinkan akses baru ("Connect to an external service").

Client ID di `config.js` dan di `Code.gs` harus identik; bila berbeda, server menolak token dengan alasan `aud tidak cocok`.

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


## Pembaruan: bahan baku & resep (versi API 4)
Tab baru dibuat otomatis saat pertama dipakai: `BahanBaku`, `Resep`, `StokLog`; tab `Produk` mendapat kolom `hasil_resep`. Tempel `Code.gs` terbaru lalu **New version → Deploy**. Selama backend lama masih terpasang, fitur bahan baku disembunyikan (aplikasi memeriksa `ping.resep`).

## Riset harga pasar AI (versi API 5)
AI mencari harga produk sejenis di wilayah usaha (pencarian web), lalu aplikasi menilai harga pengguna: **overprice / kompetitif / underprice**, menampilkan rekomendasi harga terhadap target margin, dan saran nilai produk.

Mengaktifkan (sekali):
1. Buat API key di console.anthropic.com (akun berbayar; tiap riset memakai pencarian web + model sehingga berbiaya, bukan gratis).
2. Apps Script → **Project Settings → Script properties → Add script property**: nama `ANTHROPIC_API_KEY`, nilai = key tadi. Jangan menaruhnya di kode atau di `config.js`.
3. Tempel `Code.gs` terbaru → **Deploy → Manage deployments → ✎ → New version → Deploy**. Izinkan akses eksternal bila diminta.

Keamanan dan biaya: key hanya ada di server; hasil disaring (angka dibatasi, URL hanya http/https, teks dibersihkan) sebelum disimpan di tab `Riset`; kuota Free 5 riset baru per minggu dan Pro 20 per minggu, maksimum 90 per bulan. Kuota mingguan direset Senin pukul 00.00 WIB. Kuota bulanan direset pada tanggal 1 pukul 00.00 WIB. Hasil otomatis yang setara dapat dipakai ulang selama 7 hari. Cache, mode manual, dan kegagalan tidak mengurangi kuota akun. Isi halaman web diperlakukan sebagai data, bukan perintah. Tanpa key, fitur otomatis nonaktif (`ping.riset=false`).

### Tanpa API: pakai langganan AI sendiri (ChatGPT / Gemini / Claude)
Langganan konsumen (ChatGPT Plus, Gemini Advanced / Google AI Pro, Claude Pro) tidak menyertakan akses API untuk aplikasi, dan mengotomatiskan akun langganan lewat login/scraping melanggar ketentuan layanan serta rapuh, jadi tidak dipakai. Sebagai gantinya ada **mode manual** (aktif bersama Code.gs versi 6, tanpa kunci apa pun): di kartu Riset pasar AI, buka "Pakai ChatGPT / Gemini / Claude langganan Anda", salin prompt, tempel di AI favorit Anda dengan pencarian web aktif, lalu tempel jawaban JSON-nya kembali. Jawaban disaring server dengan aturan yang sama dan ditandai "diisi manual".

Atur batas panggilan API harian untuk seluruh aplikasi dengan Script Property `RISET_API_LIMIT_HARIAN` (bawaan 30 panggilan per hari WIB, termasuk percobaan ulang). Nilai `0` menghentikan panggilan API baru.

### Gemini (Google AI Studio)

Simpan API key sebagai Script Property `GEMINI_API_KEY`, lalu deploy versi `Code.gs` terbaru. Backend memakai Gemini Interactions API dengan Google Search. Model bawaan `gemini-3.5-flash-lite` dapat diganti lewat `GEMINI_MODEL` jika proyek menyediakan model lain yang mendukung pencarian melalui endpoint tersebut. Hapus override lama dari Script Properties untuk memakai model bawaan. Gemini dipilih ketika key tersedia dan backend tidak beralih ke Anthropic bila permintaan Gemini gagal.

Uji menggunakan proyek yang kuota dan akses Google Search-nya sudah dicek di Google AI Studio. Google AI Plus tidak menyertakan kredit bulanan Gemini API. Membuat key Free Tier tidak otomatis memberi akses Google Search pada semua model. Lihat https://ai.google.dev/gemini-api/docs/pricing sebelum mengaktifkan billing.
