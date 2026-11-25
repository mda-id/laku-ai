# laku.ai

Klinik bisnis berbasis AI untuk UMKM: skor kesehatan usaha, tren produk, rekomendasi stok, kalkulator HPP, catat penjualan, dan roadmap usaha. Prototipe desain web + PWA (bisa dipasang sebagai ikon di layar utama Android/iPhone).

Tampilan mengikuti mockup di deck *LAKU AI Presentasi* (4 layar Android + versi web); modul dan angka mengikuti *Laporan Survei LAKU AI* (19 responden valid).

## Isi

| Path | Fungsi |
|---|---|
| `index.html` | Landing page |
| `app/` | Aplikasi (web ≥1024px dengan sidebar, mobile dengan tab bawah) + `manifest.webmanifest` |
| `sw.js` | Service worker (offline) |
| `assets/` | CSS, JS, font Poppins (self-host), ikon, gambar mockup |

## Modul

- **Beranda**: skor kesehatan usaha, omzet, margin, peringatan dini, produk unggulan
- **Diagnosis**: rincian skor dengan alasan dan data
- **Tren penjualan**: omzet mingguan, kontribusi produk, saran minggu ini
- **Rekomendasi stok**: Ikuti saran / Ubah sendiri (disimpan di perangkat)
- **Kalkulator HPP**: bahan editable, margin dan pilihan harga langsung terhitung
- **Catat penjualan**: isi cepat, foto nota (contoh hasil bacaan), impor CSV
- **Roadmap usaha**: rencana 3-12 bulan, kesiapan cabang/franchise (modul lanjut)
- **Akun**: paket, pengingat, privasi, pasang aplikasi

Data di aplikasi adalah contoh dan tersimpan di `localStorage` perangkat. Pembacaan nota otomatis dan impor POS/marketplace belum terhubung ke backend.

## Menjalankan

Tanpa build step:

```bash
python3 -m http.server 8000
# buka http://localhost:8000/
```

Service worker dan "Pasang aplikasi" butuh HTTPS atau `localhost`. Deploy ke GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`. File `.nojekyll` menonaktifkan Jekyll.

## Pasang di HP

- **Android (Chrome)**: menu ⋮ → Instal aplikasi
- **iPhone (Safari)**: Bagikan → Tambah ke Layar Utama
