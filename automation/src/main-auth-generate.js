// 3Our Supermat API — validasi API key & normalisasi input untuk endpoint GENERATE
// API key (header X-Supermat-Key) divalidasi oleh node Webhook (Header Auth, credential "Supermat API Key (Header)").
// Request tanpa key yang benar sudah ditolak 403 sebelum sampai ke node ini. Key TIDAK ditulis di kode/repo.
const headers = $json.headers || {};
const body = $json.body || {};
const ok = true;

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
