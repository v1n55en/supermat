# Supermat — SEO Article Automation by 3Our

Web app SaaS: user mendaftar, menghubungkan **WordPress** atau **Wix** miliknya, memasukkan keyword → 3Our (lewat n8n) meriset tren & volume, menulis artikel SEO dengan AI, lalu artikel direview di web (paket Pro) dan diterbitkan ke CMS user. Semua API key riset/AI (SerpAPI, Ahrefs via RapidAPI, Gemini) milik 3Our — user cukup berlangganan ke 3Our (billing masih **dummy/simulasi**).

```
frontend (React/Vite, Vercel)  →  backend (Express, Vercel)  →  n8n 3Our (webhook "Supermat API")  →  SerpAPI / RapidAPI / Gemini
        ↑ login, keyword, review          ↑ auth, Supabase, kredensial CMS user          ↓
                                                                               adapter WordPress / Wix → CMS milik user
```

## Struktur repo

| Folder | Isi |
|---|---|
| `frontend/` | React 19 + Vite. Login/daftar, Kontrol Automasi (keyword, run, review drawer), Pengaturan CMS & API (WordPress/Wix + tes koneksi, API key 3Our), Langganan (dummy checkout), Analitik. |
| `backend/` | Express (ESM). JWT auth, Supabase (fallback `database.json` untuk dev), proxy ke n8n dengan `X-Supermat-Key`, kredensial CMS per user, kuota paket, public API `/api/v1/*`, cron jadwal. |
| `automation/` | Sumber & hasil build workflow n8n: `build-workflows.mjs` + `src/*.js` → `n8n-main-workflow.json`, `n8n-adapter-wordpress.json`, `n8n-adapter-wix.json` (import ke n8n). `n8n-adapter-sanity.json` = adapter lama (legacy). |
| `docs/` | Spesifikasi desain. |

## Alur produk

1. **Daftar/Masuk** → backend membuat akun (plan `free`, API key `spm_live_…`).
2. **Pengaturan CMS** → simpan kredensial WordPress (URL, user, Application Password) atau Wix (Site ID, API key) → backend langsung **tes koneksi** (`/wp-json/wp/v2/users/me` atau `blog/v3/posts`) dan menandai *verified*.
3. **Kontrol Automasi** → tambah keyword → backend `POST n8n /webhook/supermat-trigger` → n8n: Google Trends + Autocomplete (SerpAPI) → Ahrefs (RapidAPI) → pilih target keyword → Gemini (+ tool Google Search) → artikel JSON.
   - **Free**: artikel langsung dikirim sebagai **draf** ke CMS (`action: draft`).
   - **Pro + Web Approver**: status `Review Ready` → user edit di drawer → **Simpan draf** / **Publikasikan** → backend `POST n8n /webhook/supermat-publish` dengan kredensial CMS user (diambil dari server, bukan dari browser).
4. **Jadwal** (Pro): keyword `daily`/`weekly` dijalankan oleh Vercel Cron → `GET /api/cron/run-scheduled` (header `Authorization: Bearer CRON_SECRET`).
5. **Langganan**: halaman dummy (QRIS/VA/kartu) → `POST /api/billing/checkout` mengaktifkan plan `premium` 30 hari. Tidak ada transaksi nyata.
6. **3Our API** (per user, header `X-API-Key`): `POST /api/v1/articles/generate`, `POST /api/v1/articles/:id/publish`, `GET /api/v1/articles`.

## Deploy

### n8n (3Our)
Workflow sudah terpasang & aktif di `n8n.3ourasia.id`:
- `Supermat API: Generate & Publish (3Our)` — id `9cXOiWyr2L2qdWrv` (webhook `supermat-trigger`, `supermat-publish`)
- `Supermat Adapter: WordPress` — id `XokXcBPuDOlIexss`
- `Supermat Adapter: Wix Blog` — id `54QOd6HkD0duCqGq`

API key yang diterima n8n: env `SUPERMAT_API_KEYS` (pisah koma) atau daftar default di node **Auth & Normalize** (`SPM-3OUR-LIVE-7Q4K-2026`). Ganti key ini di n8n **dan** env backend `SUPERMAT_API_KEY` secara bersamaan.

Mengubah workflow: edit `automation/src/*.js` / `build-workflows.mjs`, jalankan `node automation/build-workflows.mjs`, lalu import JSON ke n8n (Import from file) dan salin ke workflow dengan id di atas (atau update node-nya langsung).

### Backend (Vercel, root `backend/`)
1. Buat project Supabase → jalankan `backend/supabase.sql` di SQL Editor.
2. Env (lihat `backend/.env.example`): `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY` (service role), `N8N_BASE_URL`, `SUPERMAT_API_KEY`, `CRON_SECRET`, `FRONTEND_ORIGIN`.
3. `vercel.json` sudah berisi cron harian `0 1 * * *` (08.00 WIB) → `/api/cron/run-scheduled`.

### Frontend (Vercel, root `frontend/`)
Env: `VITE_API_BASE_URL=https://<backend>.vercel.app`.

## Dev lokal
```bash
cd backend && cp .env.example .env && npm i && npm run dev      # tanpa Supabase → database.json
cd frontend && npm i && VITE_API_BASE_URL=http://localhost:5001 npm run dev
```

## Catatan keamanan
- Kredensial CMS disimpan apa adanya di tabel `cms_connections.config` (jsonb). Backend memakai service-role key, jadi tabel tidak terbuka ke klien. Enkripsi kolom bisa ditambah kemudian.
- Key 3Our (SerpAPI/RapidAPI/Gemini) hanya ada di credential n8n; tidak ada lagi key yang di-hardcode di workflow.
