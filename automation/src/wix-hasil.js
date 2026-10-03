// Adapter Wix Blog — rapikan hasil jadi format standar Supermat
const first = $input.first().json || {};
if (first.status === 'error') return [{ json: first }]; // error dari tahap sebelumnya diteruskan

const M = $('Tentukan Member').first().json;
const bodyOf = r => { if (!r) return {}; if (r.body && typeof r.body === 'object') return r.body; if (typeof r.body === 'string') { try { return JSON.parse(r.body); } catch (e) { return { raw: r.body.slice(0, 300) }; } } return r; };
const get = n => { try { return $(n).first().json; } catch (e) { return null; } };

const created = get('Wix: Buat Draft');
const published = get('Wix: Publish Draft');
const urlRes = get('Wix: Ambil URL');

let httpStatus = 0, b = {};
if (created) { httpStatus = Number(created.statusCode || 0); b = bodyOf(created); }
else if (published) { httpStatus = Number(published.statusCode || 0); b = bodyOf(published); }

if (httpStatus >= 400 || (!created && !published)) {
  const msg = b.message || (b.details && JSON.stringify(b.details).slice(0, 300)) || b.raw || ('HTTP ' + httpStatus);
  return [{ json: { status: 'error', cmsType: 'wix', action: M.action, httpStatus, message: 'Wix Blog API gagal: ' + msg, requestId: M.requestId } }];
}

const draftId = (b.draftPost && b.draftPost.id) || b.postId || M.postId || '';
const postId = b.postId || (b.post && b.post.id) || draftId;
const ub = bodyOf(urlRes);
const url = (ub.post && ub.post.url) || (b.post && b.post.url) || (b.draftPost && b.draftPost.url) || null;
const publicUrl = url && url.base ? String(url.base).replace(/\/+$/, '') + String(url.path || '') : '';
const isPublished = M.action === 'publish' && httpStatus < 400;

return [{ json: {
  status: 'ok', cmsType: 'wix', action: M.action,
  postId: String(draftId), postStatus: isPublished ? 'publish' : 'draft',
  draftEditUrl: 'https://manage.wix.com/dashboard/' + M.siteId + '/blog/' + draftId + '/edit',
  publicUrl: isPublished ? publicUrl : '',
  title: (b.draftPost && b.draftPost.title) || M.title,
  message: isPublished ? 'Artikel terbit di Wix Blog.' : 'Draf tersimpan di Wix Blog.',
  requestId: M.requestId,
} }];
