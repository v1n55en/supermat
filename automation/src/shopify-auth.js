// Adapter Shopify — tentukan access token (langsung, atau hasil tukar Client Credentials)
const P = $('Siapkan Shopify').first().json;
let token = P.accessToken, preError = P.preError, tokenNote = '';
if (!preError && P.needsExchange) {
  const R = $('Shopify: Ambil Token').first().json || {};
  const st = Number(R.statusCode || 0);
  let b = R.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = { raw: b.slice(0, 200) }; } }
  b = b || {};
  if (st >= 200 && st < 300 && b.access_token) { token = b.access_token; tokenNote = 'client_credentials'; }
  else if (st === 404) preError = 'Toko ' + P.shop + ' tidak ditemukan (404), atau app belum di-install di toko ini. Cek domain .myshopify.com.';
  else preError = 'Gagal menukar Client ID/Secret jadi token (HTTP ' + (st || '-') + '): ' + (b.error_description || b.error || b.errors || b.raw || 'cek Client ID & Secret, dan pastikan app sudah di-install di toko ini (app & toko harus satu organisasi Shopify).');
}
if (preError) token = '';
return [{ json: Object.assign({}, P, { token, tokenNote, preError, accessToken: undefined, clientSecret: undefined,
  gqlUrl: 'https://' + (preError ? 'invalid-shop.myshopify.com' : P.shop) + '/admin/api/2026-07/graphql.json' }) }];
