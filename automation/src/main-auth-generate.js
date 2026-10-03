// 3Our Supermat API — validasi API key & normalisasi input untuk endpoint GENERATE
// Key dibaca dari env n8n SUPERMAT_API_KEYS (pisah koma) bila ada, kalau tidak pakai daftar di bawah.
const DEFAULT_KEYS = ['SPM-3OUR-LIVE-7Q4K-2026'];
let keys = DEFAULT_KEYS;
try { const e = String($env.SUPERMAT_API_KEYS || '').trim(); if (e) keys = e.split(',').map(s => s.trim()).filter(Boolean); } catch (err) { /* env access diblokir -> pakai default */ }

const headers = $json.headers || {};
const body = $json.body || {};
const bearer = String(headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
const key = String(headers['x-supermat-key'] || headers['x-api-key'] || bearer || body.apiKey || '').trim();
const ok = !!key && keys.includes(key);

const keyword = String(body.keyword || body.query || '').trim();
let statusCode = 200, error = '';
if (!ok) { statusCode = 401; error = 'API key tidak valid. Kirim header X-Supermat-Key.'; }
else if (!keyword) { statusCode = 400; error = 'Field "keyword" wajib diisi.'; }

return [{ json: {
  ok: statusCode === 200, statusCode, error,
  keyword,
  geo: String(body.Geo || body.geo || 'ID').toUpperCase(),
  ln: String(body.Ln || body.ln || 'id').toLowerCase(),
  clientName: String(body.Client_Name || body.clientName || body.brandName || 'Brand Anda').trim(),
  niche: String(body.niche || '').trim(),
  tone: String(body.tone || '').trim(),
  wordCount: Math.min(Math.max(Number(body.wordCount) || 800, 400), 1500),
  requestId: String(body.requestId || ('req_' + Date.now().toString(36))),
} }];
