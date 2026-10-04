// Adapter Shopify — pilih blog, ubah markdown → HTML, susun mutation articleCreate / articleUpdate
const P = $('Shopify: Auth').first().json;
const R = $input.first().json || {};
__MD__
let preError = P.preError;
let blogs = [], primaryUrl = '';
if (!preError) {
  const st = Number(R.statusCode || 0);
  let b = R.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  if (st === 401) preError = 'Token Shopify tidak valid (401). Cek access token / Client ID & Secret.';
  else if (st === 403) preError = 'Token Shopify tidak punya izin (403). Aktifkan scope write_content (dan read_content) lalu install ulang app.';
  else if (st === 404) preError = 'Toko Shopify tidak ditemukan (404). Cek domain .myshopify.com.';
  else if (!(st >= 200 && st < 300) || !b.data) preError = 'Gagal membaca toko Shopify: ' + (b.errors ? JSON.stringify(b.errors).slice(0, 200) : 'HTTP ' + st);
  else { blogs = (b.data.blogs && b.data.blogs.nodes) || []; primaryUrl = ((b.data.shop || {}).primaryDomain || {}).url || ''; }
}
const A = P.article; const publish = P.action === 'publish';
let blog = null;
if (!preError) {
  blog = P.blogId ? blogs.find(x => x.id === P.blogId || x.id.endsWith('/' + P.blogId) || x.handle === P.blogId) : blogs[0];
  if (!blog && !P.postId) preError = P.blogId ? 'Blog "' + P.blogId + '" tidak ditemukan di toko.' : 'Toko belum punya blog. Buat dulu di Shopify Admin → Online Store → Blog posts → Manage blogs.';
}
const articleGid = P.postId ? (P.postId.startsWith('gid://') ? P.postId : 'gid://shopify/Article/' + P.postId) : '';
const FIELDS = 'article { id handle title isPublished blog { handle } } userErrors { field message }';
let query, variables;
if (A && A.title) {
  const input = {
    title: String(A.title),
    handle: String(A.slug || '').trim() || undefined,
    body: markdownToHtml(A.bodyMarkdown || A.body || ''),
    summary: A.excerpt ? '<p>' + String(A.excerpt).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</p>' : undefined,
    tags: Array.isArray(A.keywords) ? A.keywords.slice(0, 8).map(String) : undefined,
    isPublished: publish,
  };
  if (publish) input.publishDate = new Date().toISOString();
  if (articleGid) { query = 'mutation($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { ' + FIELDS + ' } }'; variables = { id: articleGid, article: input }; }
  else { input.blogId = blog && blog.id; input.author = { name: P.authorName }; query = 'mutation($article: ArticleCreateInput!) { articleCreate(article: $article) { ' + FIELDS + ' } }'; variables = { article: input }; }
} else if (articleGid) {
  query = 'mutation($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { ' + FIELDS + ' } }';
  variables = { id: articleGid, article: { isPublished: true, publishDate: new Date().toISOString() } };
} else preError = preError || 'Tidak ada artikel maupun postId untuk diproses.';
return [{ json: { gqlUrl: P.gqlUrl, token: P.token, body: { query: query || '{ shop { name } }', variables: variables || {} },
  preError, shop: P.shop, storeHandle: P.storeHandle, primaryUrl, blogHandle: blog ? blog.handle : '',
  action: P.action, title: A ? A.title || '' : '', requestId: P.requestId } }];
