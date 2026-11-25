/* LakuPustaka: materi belajar bisnis untuk pemilik UMKM.
   Isinya panduan umum dan rumus; angka dalam contoh adalah rekaan untuk latihan, bukan data industri.
   Blok: ['h',teks] ['p',teks] ['ul',[..]] ['ol',[..]] ['box',jenis,teks] ['calc',nama] ['tabel',[judul],[[baris]]] */
(function (root) {
  'use strict';
  var KAT = ['Dasar', 'Harga & HPP', 'Stok', 'Pemasaran', 'Keuangan', 'Bertumbuh', 'laku.ai'];
  var T = [
    { id: 'hpp-dasar', judul: 'HPP: apa itu dan cara menghitungnya', kat: 'Harga & HPP', menit: 4, ringkas: 'Biaya sebenarnya untuk membuat satu produk. Tanpa HPP yang benar, harga jual hanya tebakan.', aksi: { t: 'Buka Kalkulator HPP', h: '#/hpp' }, terkait: ['margin-markup', 'harga-jual'], blok: [
      ['p', '<b>HPP (harga pokok penjualan)</b> adalah semua biaya langsung untuk menghasilkan <b>satu unit</b> yang Anda jual: satu pack dimsum, satu risol, satu porsi.'],
      ['h', 'Yang masuk ke HPP'],
      ['ul', ['<b>Bahan baku</b>: daging, tepung, sayur.', '<b>Bahan penolong</b>: bumbu, minyak, mayo.', '<b>Kemasan</b>: kotak, plastik, stiker, sendok.', '<b>Energi produksi</b> per unit: gas dan listrik untuk memasak.', '<b>Tenaga kerja langsung</b>, bila dibayar per produksi.', '<b>Susut</b>: bahan terbuang atau produk gagal (perkirakan persentasenya).']],
      ['box', 'rumus', 'HPP per unit = total biaya bahan dan produksi satu batch ÷ jumlah unit jadi'],
      ['box', 'contoh', '<b>Dimsum Ayam, per pack</b> (angka contoh): daging ayam Rp22.000 + kulit dan tepung Rp6.500 + bumbu Rp3.000 + kemasan Rp2.500 + gas dan listrik Rp1.500 = <b>HPP Rp35.500</b>. Jika dijual Rp45.000, margin kotornya 21%.'],
      ['h', 'Kesalahan yang sering terjadi'],
      ['ul', ['Lupa memasukkan kemasan, gas, atau susut.', 'Memakai harga bahan bulan lalu padahal sudah naik.', 'Menghitung per kilo padahal dijual per pack.', 'Tidak menghitung ulang sampai margin sudah menipis.']],
      ['h', 'Kapan dihitung ulang'],
      ['p', 'Setiap harga bahan utama berubah, dan sekurangnya sebulan sekali. Dalam survei pilot laku.ai (19 responden), 84% pemilik usaha menghitung ulang HPP hanya setelah harga bahan naik. Di laku.ai, setiap perubahan harga bahan di Kalkulator HPP dicatat otomatis dan muncul di Analitik → Stok dan bahan.']
    ] },
    { id: 'margin-markup', judul: 'Margin, markup, dan laba bersih: bedanya apa?', kat: 'Harga & HPP', menit: 4, ringkas: 'Tiga istilah yang sering tertukar dan membuat harga jual meleset.', aksi: { t: 'Lihat margin produk Anda', h: '#/analitik' }, terkait: ['target-margin', 'harga-jual'], blok: [
      ['box', 'rumus', 'Margin kotor (%) = (Harga jual − HPP) ÷ Harga jual × 100<br>Markup (%) = (Harga jual − HPP) ÷ HPP × 100'],
      ['box', 'contoh', 'HPP Rp35.500, harga jual Rp45.000. Laba kotor per pack = Rp9.500. <b>Margin kotor 21,1%</b>, <b>markup 26,8%</b>. Angkanya beda karena pembaginya beda.'],
      ['calc', 'margin'],
      ['h', 'Jangan tertukar'],
      ['p', 'Markup 30% <b>bukan</b> margin 30%. Jika HPP Rp100 dinaikkan 30%, harga jadi Rp130 dan margin kotornya hanya 23,1%. Kalau target Anda margin, hitung dengan rumus margin.'],
      ['h', 'Margin kotor belum laba bersih'],
      ['p', 'Margin kotor hanya mengurangi harga dengan HPP. Laba bersih masih harus dikurangi <b>biaya operasional</b>: sewa, gaji, listrik tempat usaha, internet, iklan, biaya platform, dan lain-lain. Karena itu margin kotor yang terlihat besar bisa tetap menyisakan laba bersih tipis.'],
      ['tabel', ['Alur uang', 'Contoh per bulan'], [['Omzet (total penjualan)', 'Rp12.000.000'], ['− HPP semua produk terjual', 'Rp7.800.000'], ['= Laba kotor (margin kotor 35%)', 'Rp4.200.000'], ['− Biaya operasional', 'Rp2.400.000'], ['= Laba bersih (15% dari omzet)', 'Rp1.800.000']]],
      ['p', 'Angka di atas rekaan untuk latihan.']
    ] },
    { id: 'target-margin', judul: 'Dari mana angka target margin? Cara menentukannya', kat: 'Harga & HPP', menit: 6, ringkas: 'Tidak ada satu angka yang cocok untuk semua usaha. Hitung dari biaya dan laba yang Anda inginkan.', aksi: { t: 'Atur target di Akun', h: '#/akun' }, terkait: ['margin-markup', 'harga-jual', 'baca-skor'], blok: [
      ['box', 'catatan', '<b>Tentang angka 35% di laku.ai.</b> Angka itu adalah <b>angka awal (asumsi)</b> supaya grafik punya garis acuan. Ia bukan standar industri dan bukan hasil survei. Ganti dengan angka yang Anda hitung dari usaha Anda sendiri, seperti di bawah.'],
      ['h', 'Margin kotor harus menutup tiga hal'],
      ['ol', ['<b>Biaya operasional</b> bulanan (sewa, gaji, listrik, internet, iklan, biaya platform).', '<b>Laba bersih</b> yang Anda inginkan (gaji pemilik dan dana untuk bertumbuh).', '<b>Cadangan</b> untuk diskon, susut, dan barang tidak laku.']],
      ['box', 'rumus', 'Target margin kotor (%) = (Biaya operasional bulanan + Laba bersih yang diinginkan) ÷ Omzet bulanan × 100'],
      ['box', 'contoh', '(angka rekaan) Omzet Rp12.000.000, biaya operasional Rp2.400.000, laba bersih yang diinginkan 15% (Rp1.800.000). Target margin kotor = (2.400.000 + 1.800.000) ÷ 12.000.000 = <b>35%</b>. Pada usaha lain dengan biaya operasional lebih besar atau komisi platform tinggi, angkanya bisa jauh berbeda.'],
      ['calc', 'target'],
      ['h', 'Hal yang membuat angkanya berbeda antar usaha'],
      ['ul', ['<b>Jenis produk</b>: struktur biaya makanan berat, camilan, dan minuman berbeda.', '<b>Kanal penjualan</b>: penjualan lewat aplikasi pesan-antar biasanya dikenai komisi, cek persentasenya di aplikasi mitra Anda. Margin di kanal itu lebih tipis dari toko sendiri.', '<b>Skala</b>: biaya tetap yang sama terbagi ke omzet yang lebih besar akan menurunkan margin yang dibutuhkan.', '<b>Margin per produk tidak harus sama</b>: produk unggulan boleh lebih tipis bila volumenya besar, produk lain menutupnya.']],
      ['h', 'Setelah punya angkanya'],
      ['ul', ['Isi di menu <b>Akun → Target usaha</b>. Garis target di grafik margin dan skor kesehatan akan mengikutinya.', 'Produk yang margin-nya jauh di bawah target ditandai "Cek margin" dan masuk insight.', 'Tinjau ulang target setiap beberapa bulan, atau saat biaya operasional berubah.']]
    ] },
    { id: 'harga-jual', judul: 'Menentukan dan menaikkan harga jual', kat: 'Harga & HPP', menit: 4, ringkas: 'Dari HPP dan target margin ke angka di label harga, tanpa membuat pelanggan kaget.', aksi: { t: 'Coba di Kalkulator HPP', h: '#/hpp' }, terkait: ['hpp-dasar', 'target-margin'], blok: [
      ['box', 'rumus', 'Harga jual = HPP ÷ (1 − target margin)'],
      ['box', 'contoh', 'HPP Rp35.500 dan target margin 35%: 35.500 ÷ 0,65 = Rp54.615, dibulatkan menjadi <b>Rp55.000</b>.'],
      ['h', 'Kalau harga hasil hitungan terlalu tinggi untuk pasar'],
      ['ul', ['Cek lagi HPP: resep, ukuran porsi, kemasan, pemasok lain.', 'Naikkan harga <b>bertahap</b> (misalnya 5-10% per langkah), lalu lihat penjualan dua minggu.', 'Bandingkan dengan produk sejenis di sekitar Anda, bukan hanya dengan hitungan sendiri.', 'Bulatkan ke kelipatan yang mudah (Rp500 atau Rp1.000) agar mudah dibayar dan dikembalikan.']],
      ['box', 'contoh', 'Di laku.ai, kalkulator menawarkan tiga pilihan: harga sekarang, naik ±7%, dan naik ±11%. Misalnya Rp45.000 menjadi Rp48.000 menaikkan margin dari 21% ke 26% dengan kenaikan hanya Rp3.000.'],
      ['h', 'Mengomunikasikan kenaikan'],
      ['p', 'Beri alasan singkat (harga bahan naik), umumkan sebelum berlaku, dan pertahankan kualitas atau ukuran porsi. Pelanggan lebih mudah menerima alasan yang jelas.']
    ] },
    { id: 'stok-dasar', judul: 'Mengatur stok: kapan harus produksi', kat: 'Stok', menit: 5, ringkas: 'Kehabisan berarti penjualan hilang, menumpuk berarti uang mengendap dan bisa rusak.', aksi: { t: 'Buka Rekomendasi stok', h: '#/stok' }, terkait: ['catat-sederhana', 'baca-skor'], blok: [
      ['box', 'rumus', 'Cakupan stok (hari) = sisa stok ÷ rata-rata penjualan per hari'],
      ['box', 'contoh', 'Sisa 40 pcs, rata-rata terjual 16 pcs per hari: cakupan 2,5 hari. Stok akan habis sebelum akhir pekan padahal akhir pekan biasanya paling ramai.'],
      ['h', 'Batas yang dipakai laku.ai'],
      ['ul', ['<b>Rawan habis</b>: cakupan kurang dari 3,5 hari.', '<b>Menumpuk</b>: cakupan lebih dari 10 hari.', '<b>Wajar</b>: 3,5 sampai 10 hari.']],
      ['p', 'Ini angka awal aplikasi. Sesuaikan dengan <b>masa simpan produk</b> Anda: frozen food biasanya bisa disimpan lebih lama daripada makanan basah, sehingga cakupan yang lebih besar masih wajar.'],
      ['h', 'Cara laku.ai menghitung saran produksi'],
      ['ol', ['Rata-rata penjualan mingguan 4 minggu terakhir.', 'Disesuaikan dengan tren (maksimal ±25%, dibagi dua agar tidak berlebihan).', 'Ditambah cadangan 10%.', 'Dikurangi sisa stok. Hasilnya dibandingkan dengan produksi minggu lalu untuk menentukan Naikkan, Kurangi, atau Tetap.']],
      ['h', 'Kebiasaan yang membantu'],
      ['ul', ['Hitung sisa stok di awal minggu atau sebelum jam ramai, lalu isi di menu Stok.', 'Pakai urutan <b>FIFO</b> (yang masuk lebih dulu dijual lebih dulu).', 'Catat kapan produk habis; itu penjualan yang hilang dan sinyal untuk menaikkan produksi.', 'Lihat Analitik → Waktu ramai untuk tahu hari dan jam terpadat.']]
    ] },
    { id: 'catat-sederhana', judul: 'Mencatat penjualan dengan ringan', kat: 'Dasar', menit: 3, ringkas: 'Cukup tiga data dan lima menit sehari. Catatan kecil yang rutin lebih berguna daripada pembukuan lengkap yang ditinggalkan.', aksi: { t: 'Catat penjualan sekarang', h: '#/catat' }, terkait: ['stok-dasar', 'baca-skor'], blok: [
      ['p', 'Semua analisis di laku.ai (skor, tren, saran stok) berasal dari catatan penjualan. Dalam survei pilot kami, 11 dari 19 pemilik usaha belum mencatat penjualan secara digital, padahal sebagian besar mengaku memakai data penjualan untuk keputusan besar.'],
      ['h', 'Tiga data minimum'],
      ['ul', ['<b>Produk</b> apa yang terjual.', '<b>Jumlah</b>nya.', '<b>Harga</b> per unit (terisi otomatis dari produk).']],
      ['p', 'Kanal dan jam bersifat opsional, tetapi membuat Analitik (kanal penjualan, waktu ramai) lebih berguna.'],
      ['h', 'Rutinitas lima menit'],
      ['ol', ['Akhir hari, buka <b>Catat penjualan → Isi cepat</b>.', 'Mulai dari <b>3-5 produk utama</b> saja.', 'Punya buku atau nota? Foto sebagai rujukan lalu ketik isinya di tab Foto nota.', 'Punya rekap kasir atau Excel? Simpan sebagai CSV dan impor.']],
      ['box', 'tip', 'Target awal: <b>14 hari</b> pencatatan untuk diagnosis pertama, dan <b>8 minggu</b> untuk perkiraan dan perbandingan periode yang lebih tepercaya.']
    ] },
    { id: 'promosi-terukur', judul: 'Promosi yang terukur: untung atau buntung?', kat: 'Pemasaran', menit: 5, ringkas: 'Diskon menaikkan penjualan, tetapi juga memangkas laba per unit. Hitung dulu sebelum menjalankan.', aksi: { t: 'Catat promosi', h: '#/catat' }, terkait: ['margin-markup', 'baca-skor'], blok: [
      ['h', 'Hitung margin setelah diskon'],
      ['box', 'contoh', 'Dimsum Rp45.000 dengan HPP Rp35.500, laba Rp9.500 per pack. Diskon 10% membuat harga Rp40.500, laba tinggal Rp5.000 (margin 12,3%, turun dari 21,1%). Agar laba kotor total sama, volume harus naik <b>hampir dua kali lipat</b> (9.500 ÷ 5.000 = 1,9).'],
      ['p', 'Artinya diskon hanya masuk akal jika membawa banyak pembeli baru, atau dipakai untuk produk yang stoknya menumpuk.'],
      ['h', 'Langkah promosi terukur'],
      ['ol', ['Tentukan <b>tujuan</b> (naikkan volume, habiskan stok, kenalkan produk baru).', 'Pilih <b>satu promosi</b> pada satu waktu, jangan menumpuk beberapa.', 'Jalankan minimal <b>3 hari</b> agar hasilnya tidak kebetulan.', '<b>Catat promosi</b> di laku.ai (nama, produk, tanggal mulai dan selesai).', 'Lihat hasilnya di Analitik → Efektivitas promosi.']],
      ['h', 'Batasan pembacaan'],
      ['p', 'laku.ai membandingkan omzet harian selama promosi dengan periode sama panjang tepat sebelumnya. Ia <b>tidak memisahkan efek tren</b> (misalnya penjualan memang sedang naik) atau libur. Anggap hasilnya petunjuk, bukan bukti.'],
      ['h', 'Alternatif selain potongan harga'],
      ['ul', ['Bundling dua produk, bonus kecil dengan HPP rendah.', 'Gratis ongkir untuk pembelian minimal.', 'Pre-order akhir pekan untuk mengunci penjualan dan menyiapkan stok.']]
    ] },
    { id: 'arus-kas', judul: 'Omzet bukan laba, laba bukan uang tunai', kat: 'Keuangan', menit: 5, ringkas: 'Dasar keuangan usaha kecil: pisahkan uang, tahu ke mana uang mengalir, dan siapkan cadangan.', aksi: { t: 'Lihat target usaha', h: '#/akun' }, terkait: ['margin-markup', 'cabang-siap'], blok: [
      ['ul', ['<b>Omzet</b> adalah total penjualan.', '<b>Laba</b> adalah sisa setelah semua biaya.', '<b>Kas</b> adalah uang yang benar-benar ada. Laba di catatan bisa belum jadi kas (piutang) atau sudah dipakai membeli stok.']],
      ['h', 'Kebiasaan dasar'],
      ['ol', ['<b>Pisahkan</b> uang usaha dan uang pribadi, minimal dengan rekening atau dompet terpisah.', 'Beri <b>gaji</b> untuk diri sendiri dengan nominal tetap, jangan mengambil dari kas sesuka hati.', 'Sisihkan <b>dana cadangan</b>. Aturan praktis umum: setara beberapa minggu sampai beberapa bulan biaya tetap, disesuaikan dengan risiko usaha Anda.', 'Catat <b>pembelian bahan</b> dan biaya tetap bulanan supaya biaya operasional (untuk menghitung target margin) bukan perkiraan.', 'Hati-hati menjual dengan tempo tanpa batas; tetapkan batas waktu dan jumlah.']],
      ['h', 'Titik impas'],
      ['box', 'rumus', 'Titik impas (unit) = Biaya tetap ÷ (Harga − Biaya variabel per unit)'],
      ['p', 'Biaya tetap tidak bergantung jumlah penjualan (sewa, gaji tetap, internet). Biaya variabel naik bersama penjualan (bahan, kemasan). Selisih harga dan biaya variabel adalah sumbangan tiap unit untuk menutup biaya tetap.']
    ] },
    { id: 'cabang-siap', judul: 'Siapkah membuka cabang? Modal dan titik impas', kat: 'Bertumbuh', menit: 6, ringkas: 'Cabang menggandakan biaya tetap. Pastikan induknya stabil dan hitung titik impas sebelum menyewa tempat.', aksi: { t: 'Lihat tahap Roadmap', h: '#/roadmap' }, terkait: ['arus-kas', 'franchise-dasar'], blok: [
      ['h', 'Tanda usaha induk sudah siap'],
      ['ul', ['Pencatatan konsisten minimal 8 minggu.', 'Margin kotor di atas target dalam dua periode berturut-turut.', 'Skor kesehatan stabil di kisaran tinggi.', 'Pemilik tidak perlu hadir terus untuk menjaga mutu (ada orang dan standar yang bisa dipercaya).']],
      ['h', 'Hitung titik impas cabang'],
      ['box', 'contoh', '(angka rekaan) Biaya tetap cabang Rp6.000.000 per bulan (sewa, gaji, listrik, internet). Sumbangan per pack Rp9.500 (harga Rp45.000 dikurangi biaya variabel). Titik impas = 6.000.000 ÷ 9.500 = <b>±632 pack per bulan</b>, sekitar 21 pack per hari hanya untuk menutup biaya, belum menghasilkan laba.'],
      ['h', 'Daftar periksa modal'],
      ['ul', ['Modal awal: sewa di muka, renovasi, peralatan, stok pertama.', 'Cadangan biaya tetap selama beberapa bulan pertama, karena penjualan biasanya naik perlahan.', 'Apakah omzet lokasi baru realistis mencapai titik impas dalam jangka waktu yang kuat Anda tanggung?', 'Pasokan bahan dan kapasitas produksi cukup untuk dua lokasi?']],
      ['box', 'tip', 'Setelah menghitung modal dan titik impas, tandai butirnya di <b>Roadmap → Siap buka cabang</b>.'],
      ['calc', 'bep']
    ] },
    { id: 'franchise-dasar', judul: 'Dasar-dasar menuju franchise atau kemitraan', kat: 'Bertumbuh', menit: 5, ringkas: 'Franchise menjual sistem, bukan sekadar produk. Apa yang perlu siap lebih dulu.', aksi: { t: 'Lihat tahap Roadmap', h: '#/roadmap' }, terkait: ['cabang-siap'], blok: [
      ['p', 'Mitra membayar untuk <b>sistem yang terbukti jalan</b>. Jika usaha induk belum stabil atau masih bergantung pada pemilik, kemitraan akan memperbesar masalah, bukan keuntungan.'],
      ['h', 'Yang perlu siap'],
      ['ul', ['<b>Produk unggulan jelas</b> dan konsisten rasanya.', '<b>Resep dan HPP terstandar</b>: takaran, bahan, pemasok, kemasan. Siapa pun yang mengikutinya menghasilkan produk yang sama.', '<b>SOP tertulis</b>: produksi, kebersihan, penyimpanan, layanan pelanggan, pencatatan.', '<b>Identitas merek</b>: nama, logo, aturan pemakaian.', '<b>Satu cabang percontohan</b> yang berjalan stabil dan bisa dihitung untungnya.', '<b>Paket kemitraan</b> yang jelas: biaya awal, pembagian hasil atau royalti, apa yang disediakan, pelatihan, dan kontrol mutu.']],
      ['box', 'catatan', 'Aspek hukum (perjanjian kemitraan, merek, perizinan) memiliki ketentuan tersendiri. Konsultasikan dengan ahli hukum sebelum menawarkan kemitraan.'],
      ['p', 'Di Roadmap, tahap <b>Siap franchise</b> memuat empat butir ini. Dua di antaranya (SOP tertulis dan cabang stabil) Anda tandai sendiri.']
    ] },
    { id: 'baca-skor', judul: 'Cara laku.ai menghitung skor kesehatan usaha', kat: 'laku.ai', menit: 4, ringkas: 'Aturannya terbuka. Skor adalah pemicu untuk bertanya, bukan vonis.', aksi: { t: 'Lihat diagnosis Anda', h: '#/diagnosis' }, terkait: ['target-margin', 'stok-dasar'], blok: [
      ['p', 'Skor total adalah <b>rata-rata empat komponen</b> (masing-masing 0-100), dari catatan penjualan 28 hari terakhir.'],
      ['tabel', ['Komponen', 'Cara menghitung'], [['Pertumbuhan omzet', '60 + 2 × pertumbuhan omzet 4 minggu terakhir (%), dibatasi 0-100. Tanpa pembanding, nilainya 60.'], ['Margin kotor', '100 × (margin ÷ target) dikurangi 20 poin untuk setiap produk yang margin-nya lebih dari 10 poin di bawah target.'], ['Perputaran stok', 'Per produk: 100 bila cakupan 3,5-10 hari, 70 bila 2-3,5 atau 10-14 hari, 40 selain itu (di bawah 2 atau di atas 14 hari). Dirata-rata. Nilai 60 bila sisa stok belum diisi.'], ['Konsistensi pencatatan', 'Jumlah hari yang ada penjualannya dari 28 hari terakhir ÷ 28 × 100.']]],
      ['h', 'Arti nilainya'],
      ['ul', ['Per komponen: <b>Baik</b> (80+), <b>Cukup</b> (60-79), <b>Perlu dijaga</b> (di bawah 60).', 'Total: <b>Sehat</b> (80+), <b>Cukup sehat</b> (60-79), <b>Perlu perhatian</b> (40-59), <b>Perlu tindakan</b> (di bawah 40).']],
      ['h', 'Batasannya'],
      ['ul', ['Ini aturan sederhana yang kami rancang, bukan standar baku akuntansi.', 'Produk tanpa HPP tidak ikut menghitung margin.', 'Skor hanya sebaik data yang Anda catat. Data baru beberapa hari membuat skor kurang bermakna.', 'Setiap komponen di halaman Diagnosis disertai alasan dan angka yang dipakai.']]
    ] }
  ];
  var K = [
    ['Omzet', 'Total nilai penjualan dalam periode tertentu, sebelum dikurangi biaya apa pun.'],
    ['HPP (harga pokok penjualan)', 'Biaya langsung untuk membuat satu unit produk yang dijual.'],
    ['Margin kotor', '(Harga jual − HPP) ÷ harga jual. Persentase harga yang tersisa setelah menutup HPP.'],
    ['Markup', '(Harga jual − HPP) ÷ HPP. Persentase tambahan di atas HPP. Nilainya selalu lebih besar dari margin.'],
    ['Laba kotor', 'Omzet dikurangi HPP, sebelum biaya operasional.'],
    ['Laba bersih', 'Sisa setelah HPP dan seluruh biaya operasional dikurangkan.'],
    ['Biaya tetap', 'Biaya yang relatif sama berapa pun penjualannya: sewa, gaji tetap, internet.'],
    ['Biaya variabel', 'Biaya yang naik seiring penjualan: bahan, kemasan, komisi per transaksi.'],
    ['Titik impas (BEP)', 'Jumlah penjualan yang membuat laba kotor tepat menutup biaya tetap.'],
    ['Cakupan stok', 'Berapa hari stok yang ada cukup, berdasarkan rata-rata penjualan harian.'],
    ['FIFO', 'First in, first out: barang yang masuk lebih dulu dijual lebih dulu.'],
    ['Arus kas', 'Pergerakan uang masuk dan keluar. Berbeda dari laba karena ada waktu pembayaran dan pembelian stok.'],
    ['Kanal penjualan', 'Jalur pembeli membeli: toko sendiri, WhatsApp, reseller, aplikasi pesan-antar, marketplace.'],
    ['SOP', 'Prosedur kerja tertulis agar pekerjaan dapat diulang dengan hasil yang sama oleh siapa pun.']
  ];
  root.LakuPustaka = { kategori: KAT, topics: T, kamus: K };
})(typeof self !== 'undefined' ? self : this);
