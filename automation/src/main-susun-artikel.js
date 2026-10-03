// Parse output AI Agent -> Unified Article Payload yang dikembalikan ke pemanggil API.
const T = $('Tentukan Target').first().json;
const ai = $input.first().json || {};

function safeParse(str) {
  if (!str) return null;
  if (typeof str === 'object') return str;
  const s = String(str);
  try { return JSON.parse(s); } catch (e) {}
  const clean = s.replace(/```json/gi, '').replace(/```/g, '').trim();
  const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(clean.slice(a, b + 1)); } catch (e) {} }
  return null;
}
const raw = ai.output ?? ai.text ?? ai;
const parsed = safeParse(raw) || {};

const slugify = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
const title = String(parsed.title || '').trim();
const body = String(parsed.body || parsed.bodyMarkdown || parsed.content || '').trim();
if (!title || !body) {
  return [{ json: { ok: false, statusCode: 502, error: 'AI tidak mengembalikan artikel yang valid. Coba lagi.', raw: typeof raw === 'string' ? raw.slice(0, 500) : raw, requestId: T.requestId } }];
}
const excerpt = String(parsed.excerpt || body.replace(/[#*_>`-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)).trim();
const words = body.split(/\s+/).filter(Boolean).length;
const keywords = [...new Set([T.targetKeyword, T.keyword, ...(T.relatedQueries || [])].filter(Boolean))].slice(0, 8);

return [{ json: {
  ok: true, statusCode: 200,
  status: 'ok',
  requestId: T.requestId,
  keyword: T.keyword,
  clientName: T.clientName,
  geo: T.geo, ln: T.ln,
  article: {
    title,
    slug: slugify(parsed.slug) || slugify(title),
    excerpt,
    bodyMarkdown: body,
    keywords,
    primaryKeyword: T.targetKeyword,
    searchVolume: T.searchVolume,
    difficulty: T.difficulty,
    trafficPotential: T.trafficPotential,
    wordCount: words,
    language: T.ln,
    generatedAt: new Date().toISOString(),
    model: 'gemini',
  },
  research: { candidates: T.candidates, relatedQueries: T.relatedQueries },
} }];
