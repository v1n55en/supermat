// Gabungkan metrik Ahrefs (RapidAPI) per kandidat, pilih target keyword terbaik.
// Prioritas: volume terbesar dengan difficulty valid; fallback: seed keyword tanpa metrik.
const N = $('Auth & Normalize').first().json;
const cands = $('Pilih Kandidat').all().map(i => i.json);
const metrics = $input.all().map(i => i.json || {});
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

const rows = cands.map((c, i) => {
  const m = metrics[i] || {}; const d = m.data || m || {};
  const diffRaw = d.difficulty;
  return {
    query: c.query, isSeed: !!c.isSeed,
    searchVolume: num(d.globalSearchVolume ?? d.searchVolume ?? d.volume),
    difficulty: (diffRaw === null || diffRaw === undefined || diffRaw === 'null' || diffRaw === '') ? null : num(diffRaw),
    trafficPotential: num(d.trafficPotential),
    cpc: num(d.cpc),
    error: m.error ? String(m.error.message || m.error) : '',
  };
});
const valid = rows.filter(r => r.searchVolume > 0).sort((a, b) => b.searchVolume - a.searchVolume);
const seedRow = rows.find(r => r.isSeed) || { query: N.keyword, searchVolume: 0, difficulty: null, trafficPotential: 0 };
const best = valid[0] || seedRow;

return [{ json: {
  ...N,
  targetKeyword: best.query,
  searchVolume: best.searchVolume,
  difficulty: best.difficulty,
  trafficPotential: best.trafficPotential,
  seedMetrics: { searchVolume: seedRow.searchVolume, difficulty: seedRow.difficulty },
  candidates: rows,
  relatedQueries: rows.map(r => r.query).filter(q => q !== best.query),
  geoLower: String(N.geo || 'ID').toLowerCase(),
} }];
