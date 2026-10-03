// Adapter Wix Blog — siapkan header & konten Ricos dari kredensial user (API key + site id)
const IN = $input.first().json;
const X = (IN.cms || {}).wix || {};
const A = IN.article || {};
const action = IN.action === 'publish' ? 'publish' : 'draft';
const postId = String(IN.postId || '').trim();

__MD__

const headers = { Authorization: String(X.apiKey || ''), 'wix-site-id': String(X.siteId || ''), 'Content-Type': 'application/json' };
let draftPost = null;
if (A.title) {
  draftPost = {
    title: String(A.title).slice(0, 200),
    excerpt: String(A.excerpt || '').slice(0, 500),
    richContent: markdownToRicos(A.bodyMarkdown || A.body || ''),
    seoSlug: String(A.slug || '').trim() || undefined,
  };
}
if (!draftPost && !postId) throw new Error('Tidak ada artikel maupun postId untuk diproses.');

return [{ json: {
  cmsType: 'wix', action, postId, siteId: String(X.siteId || ''), memberIdInput: String(X.memberId || ''),
  headers, draftPost,
  keyword: A.primaryKeyword || '', title: A.title || '', requestId: IN.requestId || '',
} }];
