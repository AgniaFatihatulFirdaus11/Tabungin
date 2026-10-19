# Tabungin

Web app untuk mencatat target tabungan dengan progress yang langsung terupdate. Bisa dipasang di HP seperti aplikasi biasa, dipakai tanpa internet, dan tidak perlu membuat akun.

**Demo:** https://agniafatihatulfirdaus11.github.io/Tabungin/ <br>
**Demo:** https://tabunginn.netlify.app/
## Fitur

- Banyak target sekaligus (nama, nominal, tenggat opsional)
- Setor dan tarik dana, setiap transaksi tercatat di riwayat
- Progress bar, persentase, dan sisa nominal berubah seketika tanpa reload
- Estimasi tabungan per bulan dan info sisa hari menuju tenggat
- Ringkasan: total terkumpul, target berjalan, target tercapai
- Tombol nominal cepat (+50rb, +100rb, +500rb)
- Penarikan melebihi saldo ditolak
- Landing page dengan penjelasan fitur
- PWA: bisa dipasang di layar utama dan dipakai offline

## Teknologi

- HTML, CSS, dan JavaScript (tanpa framework)
- `localStorage` untuk penyimpanan data di browser
- Service worker dan Web App Manifest untuk PWA
- Font: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- Hosting: GitHub Pages

## Struktur proyek

```
.
├── index.html            # Landing page
├── app.html              # Aplikasi tabungan
├── landing.css           # Gaya landing page
├── style.css             # Gaya aplikasi
├── index.js              # Logika aplikasi (state, perhitungan, tampilan)
├── manifest.json         # Pengaturan PWA
├── sw.js                 # Service worker (cache untuk mode offline)
└── icon-*.png            # Ikon aplikasi (biasa dan maskable, 192 dan 512 px)
```

## Menjalankan di komputer

Tidak perlu instalasi. Cukup buka `index.html` di browser.

Untuk mencoba fitur PWA (service worker hanya jalan lewat `localhost` atau HTTPS), jalankan server lokal, misalnya:

```bash
python -m http.server 8000
```

lalu buka `http://localhost:8000`.

## Memasang di HP

**Android (Chrome):** buka alamat demo, ketuk menu titik tiga, pilih **Install app**.

**iPhone (Safari):** buka alamat demo, ketuk tombol **Bagikan**, pilih **Tambah ke Layar Utama**.

## Cara kerja singkat

1. Data disimpan dalam satu objek `state` berisi daftar target dan transaksi.
2. Saldo, persentase, dan sisa selalu dihitung ulang dari transaksi lewat `stats()`, tidak disimpan sebagai angka tetap, sehingga tidak ada selisih saat transaksi dihapus.
3. Setiap perubahan memanggil `commit()`, yang menyimpan data ke `localStorage` lalu menjalankan `render()` untuk menggambar ulang tampilan.

## Catatan

- Data tersimpan di browser pada perangkat yang dipakai. Data tidak tersinkron antar perangkat dan bisa hilang jika data browser dihapus.
- Saat offline, font berganti ke font bawaan perangkat bila belum tersimpan di cache browser.

## Rencana pengembangan

- [ ] Edit target
- [ ] Ikon atau emoji per target
- [ ] Filter Semua / Berjalan / Tercapai
- [ ] Grafik riwayat tabungan
- [ ] Ekspor dan impor data
- [ ] Sinkronisasi antar perangkat (akun dan database)
- [ ] Pengingat menabung
