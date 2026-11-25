# laku.ai

Klinik bisnis berbasis AI untuk UMKM: skor kesehatan usaha, analitik penjualan, rekomendasi stok, kalkulator HPP, catat penjualan, dan roadmap usaha. Web + PWA (bisa dipasang sebagai ikon di layar utama Android/iPhone). Tampilan mengikuti mockup deck *LAKU AI*; isi dan modul sama di web dan HP.

## Fitur

- **Akun**: daftar gratis, masuk (email atau Google), onboarding 3 langkah, uji coba Pro 14 hari, hapus akun
- **Beranda**: 6 KPI, skor kesehatan (4 komponen dengan alasan dan data), insight AI, omzet vs periode lalu + perkiraan, target bulan, margin per produk
- **Analitik**: omzet harian, kanal, matriks produk (laris vs margin), efektivitas promosi, heatmap waktu ramai, cakupan stok, pelacak harga bahan (periode 7/30/90 hari, cetak PDF)
- **Rekomendasi stok**: saran produksi dari penjualan dan sisa stok, Ikuti saran / Ubah sendiri
- **Kalkulator HPP**: banyak produk, bahan per produk, margin dan pilihan harga
- **Catat penjualan**: isi cepat, foto nota (rujukan, diketik manual), impor CSV, catat promosi
- **Roadmap**: 6 tahap berbasis pencapaian (bukan kalender): Fondasi data → Margin sehat → Stok terkendali → Omzet bertumbuh → Siap cabang → Siap franchise. Syarat tiap tahap dinilai otomatis dari data; tahap berikutnya terbuka saat syarat terpenuhi
- **Pustaka belajar**: 11 materi (HPP, margin, target margin, harga jual, stok, promosi, arus kas, cabang, franchise, cara baca skor) + kamus istilah, kalkulator interaktif, penanda "selesai dipelajari", tautan kontekstual dari Beranda/HPP/Roadmap/Diagnosis
- **Paket**: status uji coba, perbandingan Gratis vs Pro, harga (belum ada penagihan selama beta); kartu Klinik Pro di sidebar menuju halaman ini
- **Logo usaha**: unggah di Akun → Profil (dikecilkan ke JPEG persegi ≤30 KB di browser, disimpan di kolom `logo` tab Usaha, tampil di avatar)
- Semua angka dihitung dari catatan penjualan akun; tanpa data, akun baru melihat checklist persiapan

## Struktur

| Path | Fungsi |
|---|---|
| `index.html` | Landing page |
| `app/` | Aplikasi (`#/daftar`, `#/masuk`, `#/`, `#/analitik`, …) + manifest PWA |
| `assets/js/core.js` | Logika backend bersama (Apps Script + mode demo) |
| `assets/js/analytics.js` | Mesin analitik (murni fungsi) |
| `assets/js/config.js` | `API_URL` Web App Apps Script. Kosong = mode demo (data di perangkat) |
| `backend/` | Apps Script (`Code.gs` hasil build), panduan pasang, tes |
| `mockup/` | Galeri mockup desain v2 |
| `sw.js` | Service worker (offline) |

## Database

Mode **sheets**: isi `API_URL` di `assets/js/config.js` dengan URL Web App. Lihat [`backend/README.md`](backend/README.md).
Mode **demo** (`API_URL` kosong): akun dan data tersimpan di localStorage perangkat; berguna untuk mencoba tampilan.

## Pengaman uji lokal

Halaman yang dibuka dari `localhost` otomatis memakai **mode demo** walau `API_URL` terisi, supaya uji lokal tidak menulis ke database produksi. Untuk sengaja memakai backend asli dari localhost, tambahkan `?live` pada alamat. Server uji (`backend/test/fake-gas-server.js`) dikecualikan karena alamatnya sendiri localhost.

## Menjalankan lokal

```bash
python3 -m http.server 8000    # buka http://localhost:8000/
```

Service worker dan "Pasang aplikasi" butuh HTTPS atau `localhost`. Deploy: GitHub Pages, **Deploy from a branch → `main` / `(root)`** (`.nojekyll` sudah ada).

## Pasang di HP

- **Android (Chrome)**: menu ⋮ → Instal aplikasi
- **iPhone (Safari)**: Bagikan → Tambah ke Layar Utama
