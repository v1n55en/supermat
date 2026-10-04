// Adapter Shopify Blog — normalisasi kredensial user
// Auth: Admin API access token (shpat_…, custom app lama) ATAU Client ID + Client Secret (app Dev Dashboard, ditukar jadi token 24 jam)
const IN = $input.first().json;
const S = (IN.cms || {}).shopify || {};
let shop = String(S.shop || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
if (shop && !shop.includes('.')) shop = shop + '.myshopify.com';
const accessToken = String(S.accessToken || '').trim();
const clientId = String(S.clientId || '').trim();
const clientSecret = String(S.clientSecret || '').trim();
let needsExchange = !accessToken && !!clientId && !!clientSecret;
let preError = '';
if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) preError = 'Domain toko harus berformat namatoko.myshopify.com (bukan domain custom).';
else if (!accessToken && !needsExchange) preError = 'Isi Admin API access token, atau Client ID + Client Secret.';
// jangan kirim rahasia ke host yang tidak valid
if (preError) needsExchange = false;
return [{ json: {
  cmsType: 'shopify', action: IN.action === 'publish' ? 'publish' : 'draft',
  shop, storeHandle: shop.replace(/\.myshopify\.com$/, ''), needsExchange, accessToken, clientId, clientSecret,
  blogId: String(S.blogId || '').trim(), authorName: String(S.authorName || IN.clientName || 'Admin').trim() || 'Admin',
  article: IN.article && typeof IN.article === 'object' ? IN.article : null,
  postId: String(IN.postId || '').trim(),
  preError, requestId: IN.requestId || '',
} }];
