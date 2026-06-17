# Specification: Modular Article Automation (n8n)

**Date:** 2026-06-13  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. System Overview
This specification details a scalable, multi-client, and CMS-agnostic content automation engine driven by **n8n**. The workflow:
1. Ingests raw keywords and target parameters from Google Sheets.
2. Performs automated trend research (Google Trends & Ahrefs SEO metrics).
3. Drafts rich SEO articles via Gemini 2.5 Pro using dynamic web research (SerpApi).
4. Generates contextual hero images via Flux-1-schnell (Cloudflare AI).
5. Standardizes the output into a **Unified Post Payload**.
6. Routes the payload to a designated CMS Adapter (Sanity, WordPress, Wix) to create a `draft`.
7. Sends a secure Telegram Bot notification containing the CMS preview/edit link to the client for human-in-the-loop review.

---

## 2. Input Configuration (Google Sheets Schema)
The Google Sheet (Sheet ID: `1AcYRkZmiT44-flXBwIid1zejIkYDe8-l-5pgULIClVE`) acts as the client control database. It should have the following columns:

| Column Header | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| **`keyword`** | String | The target search phrase for riset & writing. | "Digital Marketing Kuliner" |
| **`Client_Name`** | String | Human-readable name of the client brand. | "Kedai Makmur F&B" |
| **`CMS_Type`** | String | Target CMS option (`sanity`, `wordpress`, `wix`). | "sanity" |
| **`Telegram_Chat_ID`** | String | The Telegram Chat ID or Group ID to notify. | "-412345678" |
| **`Geo`** | String | Target country code for Trends (default: `ID`). | "ID" |
| **`Ln`** | String | Target language code for Trends (default: `id`). | "id" |

---

## 3. Unified Post Payload Schema
This JSON structure represents the standard output of the **Main Writer Workflow**. All CMS Adapters MUST accept this format:

```json
{
  "clientName": "Kedai Makmur F&B",
  "telegramChatId": "-412345678",
  "cmsType": "sanity",
  "article": {
    "title": "5 Tren Digital Marketing Kuliner 2026 yang Wajib Kamu Coba",
    "slug": "5-tren-digital-marketing-kuliner-2026",
    "excerpt": "Tertinggal dalam promosi kuliner digital? Temukan 5 tren digital marketing kuliner 2026 terpopuler untuk meningkatkan omzet bisnis kuliner kamu secara instan.",
    "bodyMarkdown": "## Pendahuluan\nBisnis kuliner saat ini tidak bisa lepas dari media sosial...\n\n## 1. Video Pendek Estetik\nKonten visual TikTok dan Reels masih menjadi raja...",
    "keywords": ["digital marketing kuliner", "tren kuliner 2026"],
    "primaryKeyword": "digital marketing kuliner",
    "category": "marketing",
    "searchVolume": 1200,
    "difficulty": 18
  },
  "images": [
    {
      "idx": 0,
      "role": "hero",
      "binaryPropertyName": "data"
    }
  ]
}
```

---

## 4. CMS Adapter Specs & API Endpoints

### 4.1 Sanity CMS Adapter
- **Create Draft**: Posts a mutation transaction to create a document in `production` dataset under path `/data/mutate/production`.
- **Draft Document ID**: Crucial for human-in-the-loop: drafts in Sanity are designated by prefixing the ID with `drafts.`. Example: `drafts.post-uuid`.
- **Edit/Preview URL**: `https://<sanity-project-id>.sanity.studio/desk/post;drafts.post-uuid`

```json
{
  "mutations": [
    {
      "createOrReplace": {
        "_id": "drafts.post-12345",
        "_type": "post",
        "title": "5 Tren Digital Marketing...",
        "slug": { "_type": "slug", "current": "5-tren-digital-marketing-kuliner-2026" },
        "excerpt": "...",
        "body": [ ... ]
      }
    }
  ]
}
```

### 4.2 WordPress REST API Adapter
- **Endpoint**: `POST https://<client-domain>/wp-json/wp/v2/posts`
- **Headers**:
  - `Authorization`: `Basic <base64(username:application_password)>`
  - `Content-Type`: `application/json`
- **Payload**:
  - Sets `"status": "draft"`.
  - Sets HTML content generated from Markdown conversion.
- **Edit/Preview URL**: `https://<client-domain>/wp-admin/post.php?post=<wp-post-id>&action=edit`

```json
{
  "title": "5 Tren Digital Marketing...",
  "slug": "5-tren-digital-marketing-kuliner-2026",
  "excerpt": "...",
  "content": "<h2>Pendahuluan</h2><p>Bisnis kuliner saat ini...</p>",
  "status": "draft"
}
```

### 4.3 Wix CMS Adapter
- **Endpoint**: Wix Data API (`POST https://www.wixapis.com/wix-data/v2/items`)
- **Headers**:
  - `Authorization`: `Bearer <wix-api-key>`
- **Payload**: Pushes to `Blog/Posts` collection.
- **Edit/Preview URL**: `https://manage.wix.com/dashboard/<site-id>/blog/posts`

---

## 5. Notification & Publication Gate
Once a draft is created by the CMS sub-workflow, the adapter returns `draftEditUrl` to the master runner.
The **Telegram Notifier Sub-workflow** triggers a request to the Telegram Bot API:

- **Endpoint**: `POST https://api.telegram.org/bot<bot-token>/sendMessage`
- **Method**: Markdown or HTML parse mode.
- **Message Template**:
  ```text
  📢 *Artikel Baru Siap Ditinjau!*
  
  Klien: *Kedai Makmur F&B*
  Kata Kunci: `digital marketing kuliner`
  Judul: "5 Tren Digital Marketing Kuliner 2026"
  
  Draf artikel telah berhasil dibuat. Silakan tinjau, lakukan penyesuaian teks/gambar, dan terbitkan artikel Anda di tautan berikut:
  🔗 [Buka Editor Draf CMS](https://sanity-studio-url/desk/post;drafts.12345)
  ```

Once the client completes proofreading and clicks **Publish** natively inside their CMS, the CMS's native webhook fires to trigger the build/prerender workflow (Vercel deploy hook) to push the site update live.
