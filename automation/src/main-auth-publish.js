// 3Our Supermat API — validasi API key & normalisasi input untuk endpoint PUBLISH
// Body: { cmsType: 'wordpress'|'wix'|'sanity', action: 'draft'|'publish', cms: {...kredensial user...}, article: {...}, postId?: '' }
// API key (header X-Supermat-Key) divalidasi oleh node Webhook (Header Auth, credential "Supermat API Key (Header)").
// Request tanpa key yang benar sudah ditolak 403 sebelum sampai ke node ini. Key TIDAK ditulis di kode/repo.
const headers = $json.headers || {};
const body = $json.body || {};
const ok = true;

const cmsType = String(body.cmsType || body.CMS_Type || '').toLowerCase().trim();
const action = String(body.action || '').toLowerCase() === 'publish' ? 'publish' : 'draft';
const cmsIn = body.cms || {};
const str = v => String(v ?? '').trim();
const cms = {
  wordpress: {
    url: str((cmsIn.wordpress || {}).url || body.wpUrl).replace(/\/+$/, ''),
    user: str((cmsIn.wordpress || {}).user || body.wpUser),
    appPassword: str((cmsIn.wordpress || {}).appPassword || body.wpPass),
  },
  wix: {
    siteId: str((cmsIn.wix || {}).siteId || body.wixSiteId),
    apiKey: str((cmsIn.wix || {}).apiKey || body.wixKey),
    memberId: str((cmsIn.wix || {}).memberId || body.wixMemberId),
  },
  sanity: {
    projectId: str((cmsIn.sanity || {}).projectId || body.projectId),
    dataset: str((cmsIn.sanity || {}).dataset || body.dataset) || 'production',
    token: str((cmsIn.sanity || {}).token || body.authToken),
    studioUrl: str((cmsIn.sanity || {}).studioUrl || body.studioUrl),
  },
};
const article = body.article && typeof body.article === 'object' ? body.article : null;
const postId = str(body.postId || body.draftDocId || body.draftPostId);

let statusCode = 200, error = '';
if (!ok) { statusCode = 401; error = 'API key tidak valid. Kirim header X-Supermat-Key.'; }
else if (!['wordpress', 'wix', 'sanity'].includes(cmsType)) { statusCode = 400; error = 'cmsType harus wordpress, wix, atau sanity.'; }
else if (!article && !postId) { statusCode = 400; error = 'Field "article" wajib diisi (atau postId untuk publish draf yang sudah ada).'; }
else if (article && (!str(article.title) || !str(article.bodyMarkdown || article.body))) { statusCode = 400; error = 'article.title dan article.bodyMarkdown wajib diisi.'; }
else if (cmsType === 'wordpress' && (!cms.wordpress.url || !cms.wordpress.user || !cms.wordpress.appPassword)) { statusCode = 400; error = 'Kredensial WordPress belum lengkap (url, user, appPassword).'; }
else if (cmsType === 'wix' && (!cms.wix.siteId || !cms.wix.apiKey)) { statusCode = 400; error = 'Kredensial Wix belum lengkap (siteId, apiKey).'; }
else if (cmsType === 'sanity' && (!cms.sanity.projectId || !cms.sanity.token)) { statusCode = 400; error = 'Kredensial Sanity belum lengkap (projectId, token).'; }
if (cms.wordpress.url && !/^https?:\/\//i.test(cms.wordpress.url)) cms.wordpress.url = 'https://' + cms.wordpress.url;

return [{ json: {
  ok: statusCode === 200, statusCode, error,
  cmsType, action, cms, postId,
  article: article ? Object.assign({}, article, { bodyMarkdown: str(article.bodyMarkdown || article.body) }) : null,
  clientName: str(body.clientName || body.Client_Name || 'Brand Anda'),
  // kompatibilitas adapter Sanity lama
  projectId: cms.sanity.projectId, authToken: cms.sanity.token, draftDocId: cmsType === 'sanity' ? postId : '',
  telegramChatId: '',
  requestId: str(body.requestId) || ('pub_' + Date.now().toString(36)),
} }];
