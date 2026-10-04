// Adapter Sanity — siapkan request ke Sanity HTTP API dari kredensial user (token Editor)
// draft            → Mutations API: createOrReplace "drafts.<id>"
// publish + artikel → Mutations API: createOrReplace "<id>" + hapus "drafts.<id>"
// publish tanpa artikel (postId draf lama) → Actions API: sanity.action.document.publish (isi draf apa adanya)
const IN = $input.first().json;
const S = (IN.cms || {}).sanity || {};
const projectId = String(S.projectId || '').trim().toLowerCase();
const dataset = String(S.dataset || 'production').trim();
const docType = String(S.docType || 'post').trim() || 'post';
const bodyField = String(S.bodyField || 'body').trim() || 'body';
const action = IN.action === 'publish' ? 'publish' : 'draft';
const A = IN.article && typeof IN.article === 'object' ? IN.article : null;
const API = 'https://' + projectId + '.api.sanity.io/v2025-02-19';

__MD__

let baseId = String(IN.postId || '').trim().replace(/^drafts\./, '');
if (!baseId) baseId = 'supermat-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const draftId = 'drafts.' + baseId;

let url, body, mode;
if (A && A.title) {
  const slug = String(A.slug || '').trim() || String(A.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
  const doc = {
    _type: docType,
    title: String(A.title),
    slug: { _type: 'slug', current: slug },
    excerpt: String(A.excerpt || ''),
    [bodyField]: markdownToPortableText(A.bodyMarkdown || A.body || ''),
  };
  if (action === 'publish') doc.publishedAt = new Date().toISOString();
  const mutations = action === 'publish'
    ? [{ createOrReplace: Object.assign({ _id: baseId }, doc) }, { delete: { id: draftId } }]
    : [{ createOrReplace: Object.assign({ _id: draftId }, doc) }];
  url = API + '/data/mutate/' + encodeURIComponent(dataset) + '?returnIds=true&visibility=sync';
  body = { mutations };
  mode = 'mutate';
} else {
  if (!IN.postId) throw new Error('Tidak ada artikel maupun postId untuk diproses.');
  url = API + '/data/actions/' + encodeURIComponent(dataset);
  body = { actions: [{ actionType: 'sanity.action.document.publish', draftId, publishedId: baseId }] };
  mode = 'publishDraft';
}

return [{ json: {
  cmsType: 'sanity', action, mode, projectId, dataset, docType, baseId,
  url, body, auth: 'Bearer ' + String(S.token || '').trim(),
  studioUrl: String(S.studioUrl || '').trim().replace(/\/+$/, ''),
  publicUrlPattern: String(S.publicUrlPattern || '').trim(),
  slug: A && A.title ? body.mutations[0].createOrReplace.slug.current : '',
  title: A ? A.title || '' : '',
  requestId: IN.requestId || '',
} }];
