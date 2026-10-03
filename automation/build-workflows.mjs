// Build n8n workflow JSON (Supermat API) dari sumber di ./src
// node automation/build-workflows.mjs  -> menulis n8n-main-workflow.json, n8n-adapter-wordpress.json, n8n-adapter-wix.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = f => fs.readFileSync(path.join(here, 'src', f), 'utf8');
const MD = src('md.js');
const code = (f) => src(f).replace('__MD__', MD);

// ---- ID workflow di n8n 3Our (dipakai node Execute Workflow) ----
export const IDS = {
  main: '9cXOiWyr2L2qdWrv',
  wordpress: 'XokXcBPuDOlIexss',
  wix: '54QOd6HkD0duCqGq',
  sanity: 'yRYqxg0wtw0Q0C9t',
};
// ---- Kredensial milik 3Our di n8n (API SerpAPI, RapidAPI, Gemini) ----
const CRED = {
  serpapi: { httpQueryAuth: { id: 'E7NNgmviGDIm3aE3', name: 'SerpAPI (Query Auth)' } },
  rapidapi: { httpHeaderAuth: { id: 'DHz0caqWkCEuxqry', name: 'Rapidapi' } },
  gemini: { googlePalmApi: { id: 'X4qY80NDFbDxQZZU', name: 'Google Gemini(PaLM) Api Veri' } },
};

const sticky = (name, pos, w, h, color, content) => ({ id: 'st-' + name.replace(/\W+/g, '-').toLowerCase(), name, type: 'n8n-nodes-base.stickyNote', typeVersion: 1, position: pos, parameters: { width: w, height: h, color, content } });
const codeNode = (name, pos, js, extra = {}) => ({ id: 'n-' + name.replace(/\W+/g, '-').toLowerCase(), name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos, parameters: { jsCode: js }, ...extra });
const ifBool = (name, pos, expr) => ({ id: 'n-' + name.replace(/\W+/g, '-').toLowerCase(), name, type: 'n8n-nodes-base.if', typeVersion: 2.2, position: pos, parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ id: 'c1', leftValue: expr, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } });
const respond = (name, pos, body, codeExpr) => ({ id: 'n-' + name.replace(/\W+/g, '-').toLowerCase(), name, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: pos, parameters: { respondWith: 'json', responseBody: body, options: codeExpr ? { responseCode: codeExpr } : {} } });
const respondFirst = (name, pos, codeExpr) => ({ id: 'n-' + name.replace(/\W+/g, '-').toLowerCase(), name, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: pos, parameters: { respondWith: 'firstIncomingItem', options: codeExpr ? { responseCode: codeExpr } : {} } });
const conn = (pairs) => { const c = {}; for (const [from, to, out = 0] of pairs) { c[from] = c[from] || { main: [] }; while (c[from].main.length <= out) c[from].main.push([]); c[from].main[out].push({ node: to, type: 'main', index: 0 }); } return c; };

const ERR_BODY = "={{ JSON.stringify({ status: 'error', message: $json.error, requestId: $json.requestId || null }) }}";
const ERR_CODE = '={{ $json.statusCode || 400 }}';

// =====================================================================
// MAIN: Supermat API — Generate & Publish
// =====================================================================
function buildMain() {
  const Y1 = 300, Y2 = 900;
  const nodes = [
    sticky('Sticky Overview', [-1120, 60], 560, 1180, 7, `## 🚀 3Our Supermat API (SEO Article Automation)
Backend untuk web app **Supermat** (supermat-three.vercel.app). Semua kunci riset & AI (SerpAPI, RapidAPI/Ahrefs, Gemini) milik 3Our dan tersimpan sebagai credential n8n — user cukup pakai **API key 3Our** (header \`X-Supermat-Key\`) + kredensial CMS mereka sendiri.

**Endpoint**
- \`POST /webhook/supermat-trigger\` — riset + tulis artikel. Body: \`{ keyword, Geo, Ln, Client_Name, niche?, tone?, wordCount? }\` → \`{ status, article:{title, slug, excerpt, bodyMarkdown, keywords, primaryKeyword, searchVolume, difficulty, …}, research }\`
- \`POST /webhook/supermat-publish\` — kirim artikel ke CMS user. Body: \`{ cmsType:'wordpress'|'wix'|'sanity', action:'draft'|'publish', cms:{ wordpress:{url,user,appPassword} | wix:{siteId,apiKey} | sanity:{projectId,dataset,token} }, article, postId? }\` → \`{ status, postId, draftEditUrl, publicUrl, message }\`

**API key** dibaca dari env \`SUPERMAT_API_KEYS\` (pisah koma) atau daftar default di node *Auth & Normalize*. Backend Supermat menyimpan key ini di env \`SUPERMAT_API_KEY\`.

**Error** selalu dibalas JSON \`{ status:'error', message }\` dengan HTTP code yang sesuai (401/400/502).`),
    sticky('Sticky Generate', [-520, 60], 2980, 560, 6, `## ① GENERATE — riset keyword → artikel (Gemini)
**Auth & Normalize** cek API key + rapikan input → **Riset Google Trends** (SerpAPI, related queries 3 bulan, geo/bahasa user) → **Riset Autocomplete** (SerpAPI Google Autocomplete, cadangan bila Trends kosong) → **Pilih Kandidat** (seed keyword + maks 3 query relevan) → **Riset SVolume** (Ahrefs via RapidAPI, per kandidat) → **Tentukan Target** (volume terbesar; fallback seed) → **AI Agent** (Gemini + tool Google Search SerpAPI untuk fakta, geo/bahasa mengikuti user, CTA ke brand user) → **Susun Artikel** → **Respond Generate**. Semua call eksternal *continue on error* supaya artikel tetap jadi walau riset gagal.`),
    sticky('Sticky Publish', [-520, 700], 2980, 520, 4, `## ② PUBLISH — kirim artikel ke CMS user
**Auth & Normalize (Publish)** validasi key, cmsType, kredensial CMS & artikel → **CMS Router** → adapter sub-workflow (**WordPress**, **Wix**, Sanity legacy) → **Respond Publish**. Adapter mengembalikan format standar \`{ status, postId, draftEditUrl, publicUrl, postStatus, message }\`. \`action:'draft'\` menyimpan draf; \`action:'publish'\` menerbitkan (kirim \`postId\` untuk menerbitkan draf yang sudah ada).`),

    // ---- generate path ----
    { id: 'n-webhook-generate', name: 'Webhook Generate', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [-460, Y1], webhookId: '4443f0f9-062a-45ed-891f-47479690bf5b', parameters: { httpMethod: 'POST', path: 'supermat-trigger', responseMode: 'responseNode', options: {} } },
    codeNode('Auth & Normalize', [-240, Y1], code('main-auth-generate.js')),
    ifBool('Auth OK?', [-20, Y1], '={{ $json.ok }}'),
    respond('Respond Error', [200, Y1 + 200], ERR_BODY, ERR_CODE),
    { id: 'n-riset-trends', name: 'Riset Google Trends', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [200, Y1], credentials: CRED.serpapi, onError: 'continueRegularOutput', parameters: { url: 'https://serpapi.com/search.json', authentication: 'genericCredentialType', genericAuthType: 'httpQueryAuth', sendQuery: true, queryParameters: { parameters: [
      { name: 'engine', value: 'google_trends' }, { name: 'q', value: '={{ $json.keyword }}' }, { name: 'geo', value: '={{ $json.geo }}' }, { name: 'hl', value: '={{ $json.ln }}' },
      { name: 'date', value: 'today 3-m' }, { name: 'data_type', value: 'RELATED_QUERIES' } ] }, options: { timeout: 30000 } } },
    { id: 'n-riset-autocomplete', name: 'Riset Autocomplete', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [420, Y1], credentials: CRED.serpapi, onError: 'continueRegularOutput', parameters: { url: 'https://serpapi.com/search.json', authentication: 'genericCredentialType', genericAuthType: 'httpQueryAuth', sendQuery: true, queryParameters: { parameters: [
      { name: 'engine', value: 'google_autocomplete' }, { name: 'q', value: "={{ $('Auth & Normalize').first().json.keyword }}" }, { name: 'gl', value: "={{ $('Auth & Normalize').first().json.geo.toLowerCase() }}" }, { name: 'hl', value: "={{ $('Auth & Normalize').first().json.ln }}" } ] }, options: { timeout: 30000 } } },
    codeNode('Pilih Kandidat', [640, Y1], code('main-pilih-kandidat.js')),
    { id: 'n-riset-svolume', name: 'Riset SVolume', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [860, Y1], credentials: CRED.rapidapi, onError: 'continueRegularOutput', parameters: { url: 'https://ahrefs-keyword-research.p.rapidapi.com/keyword-metrics', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendQuery: true, queryParameters: { parameters: [{ name: 'keyword', value: '={{ $json.query }}' }, { name: 'country', value: "={{ $('Auth & Normalize').first().json.geo.toLowerCase() }}" }] }, sendHeaders: true, headerParameters: { parameters: [{ name: 'x-rapidapi-host', value: 'ahrefs-keyword-research.p.rapidapi.com' }] }, options: { batching: { batch: { batchSize: 1, batchInterval: 800 } }, timeout: 30000 } } },
    codeNode('Tentukan Target', [1080, Y1], code('main-tentukan-target.js')),
    { id: 'n-ai-agent', name: 'AI Agent', type: '@n8n/n8n-nodes-langchain.agent', typeVersion: 3.1, position: [1300, Y1], parameters: { promptType: 'define', text: `=Tulis satu artikel blog SEO lengkap (struktur SILO) untuk keyword utama: {{ $json.targetKeyword }}.
Keyword asal yang diminta klien: {{ $json.keyword }}. Brand/klien: {{ $json.clientName }}{{ $json.niche ? ' (bidang: ' + $json.niche + ')' : '' }}.
Negara target: {{ $json.geo }} · Bahasa artikel: {{ $json.ln === 'id' ? 'Bahasa Indonesia' : $json.ln }}.{{ $json.tone ? ' Gaya tulisan yang diminta: ' + $json.tone + '.' : '' }}
Panjang WAJIB: minimal {{ $json.wordCount }} kata (hitung dengan cermat, jangan kurang), maksimal {{ Math.round($json.wordCount * 1.3) }} kata.

Konteks riset (jangan ditulis mentah): search volume {{ $json.searchVolume }}, keyword difficulty {{ $json.difficulty ?? 'n/a' }}, traffic potential {{ $json.trafficPotential }}. Query terkait yang sedang naik: {{ ($json.relatedQueries || []).slice(0,5).join(', ') || '-' }}.

Ikuti seluruh aturan PERAN, TONE, STRUKTUR, dan SEO. Judul menarik, pembuka ber-hook, heading logis, penutup dengan soft CTA untuk brand {{ $json.clientName }}.

FORMAT OUTPUT (WAJIB): JSON dengan tepat 4 field: "title", "slug", "excerpt", "body" (markdown, tanpa judul di dalam body). Jangan tambahkan teks apa pun di luar JSON.`, options: { systemMessage: `=RISET DATA (WAJIB SEBELUM MENULIS)
Sebelum menulis, panggil tool "Google Search Riset" 1-3 kali untuk mengumpulkan fakta, data, statistik, dan informasi terkini tentang topik. Utamakan sumber kredibel (situs resmi, media ternama, lembaga riset, data statistik resmi). Dasarkan semua klaim faktual pada hasil riset; JANGAN mengarang angka, fitur, harga, atau klaim. Bila tidak ditemukan, tulis secara umum tanpa data palsu. Lokasi pencarian: {{ $json.geo }}, bahasa: {{ $json.ln }}.

PERAN
Kamu SEO content strategist dan copywriter profesional untuk brand "{{ $json.clientName }}". Tulis artikel blog yang SEO-friendly, terasa ditulis manusia, dan enak dibaca.

TARGET PEMBACA
Orang yang mencari topik "{{ $json.keyword }}" di {{ $json.geo === 'ID' ? 'Indonesia' : $json.geo }}. Mereka sibuk; konten ringkas, to-the-point, bisa dibaca ±5 menit.

TONE & GAYA
- Santai tapi profesional. Sapa pembaca dengan "kamu", posisikan brand sebagai "kami/kita".
- Bahasa natural sehari-hari sesuai bahasa artikel; istilah marketing umum (engagement, conversion, funnel, awareness) boleh tetap Inggris.
- Variasikan panjang kalimat; paragraf maksimal 2-4 kalimat. Konektor percakapan ("Jadi,", "Nah,", "Masalahnya,") secukupnya.
- Boleh analogi, contoh konkret, dan list bila membantu.

STRUKTUR
- Pembuka: hook yang menohok asumsi umum/masalah nyata pembaca, lalu posisikan topik sebagai solusi.
- Isi: beberapa sub-bagian dengan heading H2/H3 yang logis sesuai search intent.
- Penutup: rangkum 2-4 poin kunci, satu punchline, lalu soft CTA relevan ke brand "{{ $json.clientName }}" (bukan hard selling, jangan sebut pihak lain).

ATURAN SEO
- Keyword utama natural di judul, pembuka, dan beberapa heading — tanpa keyword stuffing. Gunakan sinonim/LSI.
- Pembuka langsung menjawab maksud pencarian.

HINDARI (agar tidak terdengar AI)
- Klise: "di era digital yang serba cepat ini", "tak dapat dipungkiri", "mari kita selami", "dalam dunia yang terus berkembang".
- Transisi kaku bertubi-tubi ("selain itu", "lebih lanjut", "dengan demikian").
- Pembuka berupa definisi kamus; kesimpulan yang mengulang kaku; nada over-promising.

FORMAT OUTPUT (WAJIB)
Kembalikan HANYA satu objek JSON valid: {"title": string, "slug": string, "excerpt": string, "body": string}
- Tanpa code fence, tanpa teks lain. Harus bisa di-parse JSON.parse().
- Semua field non-kosong. slug: huruf kecil, dipisah tanda hubung. body: markdown lengkap dengan heading ## dan ###, di-escape dengan benar.` } } },
    { id: 'n-gemini', name: 'Gemini Writer', type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini', typeVersion: 1, position: [1220, Y1 + 220], credentials: CRED.gemini, parameters: { modelName: 'models/gemini-3.1-flash-lite', options: { temperature: 0.7 } } },
    { id: 'n-search-tool', name: 'Google Search Riset', type: 'n8n-nodes-base.httpRequestTool', typeVersion: 4.3, position: [1420, Y1 + 220], credentials: CRED.serpapi, parameters: { toolDescription: 'Cari informasi faktual terkini dari Google tentang sebuah topik/keyword. Gunakan untuk mengumpulkan fakta, data, statistik, dan referensi nyata sebelum menulis artikel.', url: 'https://serpapi.com/search.json', authentication: 'genericCredentialType', genericAuthType: 'httpQueryAuth', sendQuery: true, queryParameters: { parameters: [
      { name: 'engine', value: 'google' },
      { name: 'q', value: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('q', `Kata kunci atau pertanyaan pencarian Google untuk mengumpulkan fakta/data tentang topik artikel.`, 'string') }}" },
      { name: 'gl', value: "={{ $('Tentukan Target').first().json.geoLower }}" }, { name: 'hl', value: "={{ $('Tentukan Target').first().json.ln }}" }, { name: 'num', value: '8' } ] }, options: {}, optimizeResponse: true, dataField: 'organic_results' } },
    codeNode('Susun Artikel', [1640, Y1], code('main-susun-artikel.js')),
    ifBool('Artikel OK?', [1860, Y1], '={{ $json.ok }}'),
    respondFirst('Respond Generate', [2100, Y1]),
    respond('Respond AI Error', [2100, Y1 + 200], ERR_BODY, ERR_CODE),

    // ---- publish path ----
    { id: 'n-webhook-publish', name: 'Webhook Publish', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [-460, Y2], webhookId: '12f6c704-5949-4562-b019-0697ff10a265', parameters: { httpMethod: 'POST', path: 'supermat-publish', responseMode: 'responseNode', options: {} } },
    codeNode('Auth & Normalize (Publish)', [-240, Y2], code('main-auth-publish.js')),
    ifBool('Auth OK (Publish)?', [-20, Y2], '={{ $json.ok }}'),
    respond('Respond Error (Publish)', [200, Y2 + 200], ERR_BODY, ERR_CODE),
    { id: 'n-cms-router', name: 'CMS Router', type: 'n8n-nodes-base.switch', typeVersion: 3.2, position: [200, Y2], parameters: { rules: { values: [
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'r1', leftValue: '={{ $json.cmsType }}', rightValue: 'wordpress', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'wordpress' },
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'r2', leftValue: '={{ $json.cmsType }}', rightValue: 'wix', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'wix' },
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'r3', leftValue: '={{ $json.cmsType }}', rightValue: 'sanity', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'sanity' },
    ] }, options: { fallbackOutput: 'extra' } } },
    { id: 'n-adapter-wp', name: 'Adapter: WordPress', type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1, position: [480, Y2 - 160], parameters: { workflowId: IDS.wordpress, options: {} } },
    { id: 'n-adapter-wix', name: 'Adapter: Wix', type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1, position: [480, Y2], parameters: { workflowId: IDS.wix, options: {} } },
    { id: 'n-adapter-sanity', name: 'Adapter: Sanity (legacy)', type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1, position: [480, Y2 + 160], parameters: { workflowId: IDS.sanity, options: {} } },
    respond('Respond CMS Tidak Didukung', [480, Y2 + 320], "={{ JSON.stringify({ status: 'error', message: 'cmsType tidak didukung: ' + $json.cmsType }) }}", '400'),
    codeNode('Rapikan Hasil Publish', [740, Y2], `// Samakan format hasil adapter + tentukan HTTP code
const r = $input.first().json || {};
const ok = r.status === 'ok' || r.status === 'success';
return [{ json: {
  status: ok ? 'ok' : 'error',
  statusCode: ok ? 200 : (r.httpStatus && r.httpStatus >= 400 && r.httpStatus < 500 ? 400 : 502),
  cmsType: r.cmsType || $('Auth & Normalize (Publish)').first().json.cmsType,
  action: r.action || $('Auth & Normalize (Publish)').first().json.action,
  postId: r.postId || r.draftDocId || '',
  postStatus: r.postStatus || (ok ? ($('Auth & Normalize (Publish)').first().json.action === 'publish' ? 'publish' : 'draft') : ''),
  draftEditUrl: r.draftEditUrl || '',
  publicUrl: r.publicUrl || '',
  previewUrl: r.previewUrl || '',
  title: r.title || '',
  message: r.message || (ok ? 'Berhasil.' : 'Gagal mengirim ke CMS.'),
  requestId: r.requestId || $('Auth & Normalize (Publish)').first().json.requestId,
} }];`),
    respondFirst('Respond Publish', [960, Y2], '={{ $json.statusCode }}'),
  ];
  const connections = {
    ...conn([
      ['Webhook Generate', 'Auth & Normalize'], ['Auth & Normalize', 'Auth OK?'], ['Auth OK?', 'Riset Google Trends', 0], ['Auth OK?', 'Respond Error', 1],
      ['Riset Google Trends', 'Riset Autocomplete'], ['Riset Autocomplete', 'Pilih Kandidat'], ['Pilih Kandidat', 'Riset SVolume'], ['Riset SVolume', 'Tentukan Target'], ['Tentukan Target', 'AI Agent'], ['AI Agent', 'Susun Artikel'],
      ['Susun Artikel', 'Artikel OK?'], ['Artikel OK?', 'Respond Generate', 0], ['Artikel OK?', 'Respond AI Error', 1],
      ['Webhook Publish', 'Auth & Normalize (Publish)'], ['Auth & Normalize (Publish)', 'Auth OK (Publish)?'], ['Auth OK (Publish)?', 'CMS Router', 0], ['Auth OK (Publish)?', 'Respond Error (Publish)', 1],
      ['CMS Router', 'Adapter: WordPress', 0], ['CMS Router', 'Adapter: Wix', 1], ['CMS Router', 'Adapter: Sanity (legacy)', 2], ['CMS Router', 'Respond CMS Tidak Didukung', 3],
      ['Adapter: WordPress', 'Rapikan Hasil Publish'], ['Adapter: Wix', 'Rapikan Hasil Publish'], ['Adapter: Sanity (legacy)', 'Rapikan Hasil Publish'], ['Rapikan Hasil Publish', 'Respond Publish'],
    ]),
    'Gemini Writer': { ai_languageModel: [[{ node: 'AI Agent', type: 'ai_languageModel', index: 0 }]] },
    'Google Search Riset': { ai_tool: [[{ node: 'AI Agent', type: 'ai_tool', index: 0 }]] },
  };
  return { name: 'Supermat API: Generate & Publish (3Our)', nodes, connections, settings: { executionOrder: 'v1', binaryMode: 'separate' } };
}

// =====================================================================
// ADAPTER WORDPRESS
// =====================================================================
function buildWordPress() {
  const Y = 300;
  const nodes = [
    sticky('Sticky WP', [-560, 80], 1500, 420, 5, `## 🟦 Adapter WordPress (REST API, kredensial user)
Input dari Main: \`{ cms:{wordpress:{url,user,appPassword}}, article, action:'draft'|'publish', postId? }\`.
**Siapkan WP** membuat header \`Authorization: Basic base64(user:appPassword)\` (Application Password WP) dan mengubah markdown → HTML. Tanpa \`postId\` → \`POST /wp-json/wp/v2/posts\` (buat); dengan \`postId\` → \`POST /wp-json/wp/v2/posts/{id}\` (update/terbitkan). **Hasil WP** menerjemahkan respons/err jadi \`{ status, postId, draftEditUrl, publicUrl, previewUrl, postStatus, message }\`. Tidak ada kredensial 3Our yang dipakai di sini.`),
    { id: 'n-wp-trigger', name: 'Trigger dari Main', type: 'n8n-nodes-base.executeWorkflowTrigger', typeVersion: 1, position: [-500, Y], parameters: {} },
    codeNode('Siapkan WP', [-280, Y], code('wp-siapkan.js')),
    { id: 'n-wp-request', name: 'WP: Kirim Post', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [-60, Y], onError: 'continueRegularOutput', parameters: { method: 'POST', url: '={{ $json.url }}', sendHeaders: true, headerParameters: { parameters: [{ name: 'Authorization', value: '={{ $json.auth }}' }, { name: 'Content-Type', value: 'application/json' }, { name: 'User-Agent', value: 'Supermat/1.0 (+https://3ourasia.id)' }] }, sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.payload) }}', options: { response: { response: { fullResponse: true, neverError: true } }, timeout: 45000, redirect: { redirect: {} } } } },
    codeNode('Hasil WP', [160, Y], code('wp-hasil.js')),
  ];
  return { name: 'Supermat Adapter: WordPress', nodes, connections: conn([['Trigger dari Main', 'Siapkan WP'], ['Siapkan WP', 'WP: Kirim Post'], ['WP: Kirim Post', 'Hasil WP']]), settings: { executionOrder: 'v1' } };
}

// =====================================================================
// ADAPTER WIX
// =====================================================================
function buildWix() {
  const Y = 400;
  const H = (name, pos, method, url, body) => ({ id: 'n-' + name.replace(/\W+/g, '-').toLowerCase(), name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos, onError: 'continueRegularOutput', parameters: Object.assign({ method, url, sendHeaders: true, headerParameters: { parameters: [
    { name: 'Authorization', value: "={{ $('Siapkan Wix').first().json.headers.Authorization }}" }, { name: 'wix-site-id', value: "={{ $('Siapkan Wix').first().json.headers['wix-site-id'] }}" }, { name: 'Content-Type', value: 'application/json' } ] }, options: { response: { response: { fullResponse: true, neverError: true } }, timeout: 45000 } }, body ? { sendBody: true, specifyBody: 'json', jsonBody: body } : {}) });
  const nodes = [
    sticky('Sticky Wix', [-560, 60], 2200, 700, 3, `## 🟪 Adapter Wix Blog (REST v3, kredensial user)
Input dari Main: \`{ cms:{wix:{siteId, apiKey, memberId?}}, article, action, postId? }\`. Header: \`Authorization: <API key akun Wix>\`, \`wix-site-id\`.
**Siapkan Wix** ubah markdown → Ricos rich content. **Cek Posts/Members** mencari \`memberId\` penulis (wajib di Wix: dari post terakhir, lalu Members API, atau diisi user). Tanpa \`postId\` → **Buat Draft** \`POST /blog/v3/draft-posts\` (\`publish:true\` bila action publish). Dengan \`postId\` → **Publish Draft** \`POST /blog/v3/draft-posts/{id}/publish\`. **Ambil URL** \`GET /blog/v3/posts/{id}?fieldsets=URL\` untuk link publik. **Hasil Wix** → format standar Supermat.
Catatan: API key dibuat di Wix Account → API Keys dengan izin *Blog* (+ *Members* opsional). Edit draf: \`manage.wix.com/dashboard/{siteId}/blog/{draftId}/edit\`.`),
    { id: 'n-wix-trigger', name: 'Trigger dari Main', type: 'n8n-nodes-base.executeWorkflowTrigger', typeVersion: 1, position: [-500, Y], parameters: {} },
    codeNode('Siapkan Wix', [-280, Y], code('wix-siapkan.js')),
    H('Wix: Cek Posts', [-60, Y], 'GET', 'https://www.wixapis.com/blog/v3/posts?paging.limit=1&fieldsets=URL'),
    H('Wix: Cek Members', [160, Y], 'GET', 'https://www.wixapis.com/members/v1/members?paging.limit=1'),
    codeNode('Tentukan Member', [380, Y], code('wix-tentukan-member.js')),
    ifBool('Member OK?', [600, Y], "={{ $json.status === 'prep' }}"),
    ifBool('Ada postId?', [820, Y - 80], '={{ !!$json.postId }}'),
    H('Wix: Publish Draft', [1040, Y - 200], 'POST', '={{ $json.publishUrl }}', '={{ JSON.stringify({}) }}'),
    H('Wix: Buat Draft', [1040, Y], 'POST', 'https://www.wixapis.com/blog/v3/draft-posts', '={{ JSON.stringify($json.createBody) }}'),
    H('Wix: Ambil URL', [1260, Y - 80], 'GET', "={{ 'https://www.wixapis.com/blog/v3/posts/' + (($json.body && ($json.body.postId || ($json.body.draftPost && $json.body.draftPost.id))) || $('Tentukan Member').first().json.postId) + '?fieldsets=URL' }}"),
    codeNode('Hasil Wix', [1480, Y], code('wix-hasil.js')),
  ];
  const connections = conn([
    ['Trigger dari Main', 'Siapkan Wix'], ['Siapkan Wix', 'Wix: Cek Posts'], ['Wix: Cek Posts', 'Wix: Cek Members'], ['Wix: Cek Members', 'Tentukan Member'],
    ['Tentukan Member', 'Member OK?'], ['Member OK?', 'Ada postId?', 0], ['Member OK?', 'Hasil Wix', 1],
    ['Ada postId?', 'Wix: Publish Draft', 0], ['Ada postId?', 'Wix: Buat Draft', 1],
    ['Wix: Publish Draft', 'Wix: Ambil URL'], ['Wix: Buat Draft', 'Wix: Ambil URL'], ['Wix: Ambil URL', 'Hasil Wix'],
  ]);
  return { name: 'Supermat Adapter: Wix Blog', nodes, connections, settings: { executionOrder: 'v1' } };
}

const out = { 'n8n-main-workflow.json': buildMain(), 'n8n-adapter-wordpress.json': buildWordPress(), 'n8n-adapter-wix.json': buildWix() };
for (const [f, w] of Object.entries(out)) {
  fs.writeFileSync(path.join(here, f), JSON.stringify(w, null, 2));
  console.log('wrote', f, w.nodes.length, 'nodes');
}
