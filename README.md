# zennAI — Tonton Ceritamu Terungkap

Clone ringan dari *BagelChat*: platform cerita AI interaktif. Pilih skenario, ngobrol dengan AI yang menjawab dengan teks **dan gambar**, pilih arah cerita dari 3 opsi jawaban (A/B/C), atau tulis sendiri.

100% gratis, tanpa backend, tanpa database server — semua data tersimpan di browser kamu (localStorage).

## Fitur

- 🎴 **Galeri cerita** — kartu ber-gambar (AI-generated via Pollinations, gratis tanpa key), filter genre
- 💬 **Chat interaktif** — AI jadi penutur + karakter, jawaban disertai gambar adegan
- 🔀 **Opsi A/B/C** — saran jawaban dari AI, alur bercabang
- 🛠 **Buat cerita sendiri** — isi judul + premis + karakter, AI bangun dunianya
- 🔞 **Gate usia 21+ eksplisit** — muncul saat pertama buka, wajib konfirmasi
- 🛡 **Safe Mode** — default AKTIF: sembunyikan cerita 21+ dan suruh AI jaga konten aman untuk semua umur. Matikan di Pengaturan untuk tampilkan cerita dewasa
- 📚 **Perpustakaan** — lanjutkan cerita yang sudah dimulai

## Struktur

```
zennAI/
├─ index.html
├─ css/style.css
├─ js/
│  ├─ config.js      # pengaturan + helper gambar Pollinations
│  ├─ stories.js     # cerita benih + penanda 21+
│  └─ app.js         # logika UI + engine AI
└─ README.md
```

## Jalan lokal (untuk coba)

```bash
cd zennAI
python -m http.server 8000
# buka http://localhost:8000
```

Tanpa API key, app tetap jalan **mode demo** (penutur lokal) supaya semua fitur bisa dicoba.

## Deploy gratis

### Vercel (paling gampang)
1. Push folder `zennAI` ke repo GitHub (atau pakai `npx vercel` dari folder).
2. Buka [vercel.com](https://vercel.com) → **Add New → Project** → import repo.
3. Build settings: default saja (static). Deploy. Selesai.

### GitHub Pages
1. Push `zennAI` ke repo GitHub.
2. Settings → Pages → Source: branch `main`, folder `/root`.
3. Setelah deploy, akses `https://<username>.github.io/<repo>/`.

## API key AI (gratis)

1. Buka [openrouter.ai](https://openrouter.ai/keys) → daftar gratis → **Create Key** (contoh `sk-or-v1-...`).
2. Di app: **Pengaturan → API Key** → tempel key. Model default sudah model gratis: `recursive/flint-v1.0:free` (tinggal `Simpan`).
3. Atau model berbayar lain: ubah field **Model** (cth. `openai/gpt-4o-mini`).

**DeepSeek** (berbayar tipis): isi Model `deepseek/deepseek-chat` dan Endpoint `https://api.deepseek.com/v1`.

> ⚠️ Key disimpan di localStorage browser kamu dan dikirim langsung ke provider AI dari browser. Jangan pakai key yang punya akses billing besar untuk app ini.

## Catatan teknis

- **Gambar**: Pollinations (`https://image.pollinations.ai/prompt/...`) — gratis, tanpa key. Kalau lambat/gagal, fallback gradient otomatis.
- **AI chat**: OpenAI-compatible endpoint (default OpenRouter), respon diformat JSON `{reply, suggestions, image}` lalu diparse.
- **Tanpa server**: semua state di localStorage. Clear browser = cerita hilang.
