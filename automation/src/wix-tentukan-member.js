// Adapter Wix Blog — tentukan memberId (penulis) & susun request berikutnya
const P = $('Siapkan Wix').first().json;
const posts = $('Wix: Cek Posts').first().json || {};
const members = $input.first().json || {};
const bodyOf = r => { if (!r) return {}; if (r.body && typeof r.body === 'object') return r.body; if (typeof r.body === 'string') { try { return JSON.parse(r.body); } catch (e) { return {}; } } return r; };
const pb = bodyOf(posts), mb = bodyOf(members);
const pStatus = Number(posts.statusCode || 0), mStatus = Number(members.statusCode || 0);

if (pStatus === 401 || pStatus === 403) {
  return [{ json: { status: 'error', cmsType: 'wix', action: P.action, httpStatus: pStatus, message: 'Wix menolak API key / Site ID (' + pStatus + '). Pastikan API key dibuat di Wix Account > API Keys dengan izin Blog & Members, dan Site ID benar.', requestId: P.requestId } }];
}
if (pStatus >= 400) {
  return [{ json: { status: 'error', cmsType: 'wix', action: P.action, httpStatus: pStatus, message: 'Wix Blog API error ' + pStatus + ': ' + (pb.message || JSON.stringify(pb).slice(0, 200)), requestId: P.requestId } }];
}

let memberId = P.memberIdInput || '';
if (!memberId && Array.isArray(pb.posts) && pb.posts[0] && pb.posts[0].memberId) memberId = pb.posts[0].memberId;
if (!memberId && Array.isArray(mb.members) && mb.members[0] && mb.members[0].id) memberId = mb.members[0].id;
if (!memberId && !P.postId) {
  return [{ json: { status: 'error', cmsType: 'wix', action: P.action, httpStatus: mStatus, message: 'Tidak menemukan member/penulis di situs Wix (Blog belum punya post dan Members API tidak bisa diakses). Buat satu post dulu di Wix Blog atau beri izin "Members" pada API key.', requestId: P.requestId } }];
}

const draftPost = P.draftPost ? Object.assign({}, P.draftPost, { memberId }) : null;
return [{ json: {
  status: 'prep', cmsType: 'wix', action: P.action, postId: P.postId, siteId: P.siteId, headers: P.headers, memberId,
  createBody: draftPost ? { draftPost, publish: P.action === 'publish', fieldsets: ['URL'] } : null,
  publishUrl: P.postId ? 'https://www.wixapis.com/blog/v3/draft-posts/' + P.postId + '/publish' : '',
  title: P.title, requestId: P.requestId,
} }];
