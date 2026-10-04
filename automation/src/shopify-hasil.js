// Adapter Shopify — rapikan hasil mutation jadi format standar Supermat
const P = $('Susun Artikel Shopify').first().json;
const fail = (msg, st) => [{ json: { status: 'error', cmsType: 'shopify', action: P.action, httpStatus: st || 400, message: msg, requestId: P.requestId } }];
if (P.preError) return fail(P.preError, 400);
const R = $input.first().json || {};
const st = Number(R.statusCode || 0);
let b = R.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = { raw: b.slice(0, 200) }; } }
b = b || {};
if (st === 401 || st === 403) return fail('Shopify menolak akses (' + st + '). Pastikan app punya scope write_content.', st);
if (!(st >= 200 && st < 300)) return fail('Shopify error HTTP ' + (st || '-') + ': ' + (b.errors ? JSON.stringify(b.errors).slice(0, 200) : b.raw || ''), st || 502);
if (b.errors && !b.data) return fail('GraphQL Shopify error: ' + JSON.stringify(b.errors).slice(0, 300), 400);
const payload = (b.data && (b.data.articleCreate || b.data.articleUpdate)) || {};
const ue = payload.userErrors || [];
if (ue.length) return fail('Shopify menolak artikel: ' + ue.map(e => (e.field ? e.field.join('.') + ': ' : '') + e.message).join('; '), 400);
const a = payload.article;
if (!a || !a.id) return fail('Respons Shopify tanpa artikel.', 502);
const num = String(a.id).split('/').pop();
const blogHandle = (a.blog && a.blog.handle) || P.blogHandle;
const base = (P.primaryUrl || ('https://' + P.shop)).replace(/\/+$/, '');
return [{ json: {
  status: 'ok', cmsType: 'shopify', action: P.action,
  postId: num, postStatus: a.isPublished ? 'publish' : 'draft',
  draftEditUrl: 'https://admin.shopify.com/store/' + P.storeHandle + '/content/articles/' + num,
  publicUrl: a.isPublished ? base + '/blogs/' + blogHandle + '/' + a.handle : '',
  previewUrl: '', title: a.title || P.title,
  message: a.isPublished ? 'Artikel terbit di blog Shopify.' : 'Draf (tersembunyi) tersimpan di blog Shopify.',
  requestId: P.requestId,
} }];
