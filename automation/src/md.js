// ===== Markdown mini-parser (dipakai adapter WordPress & Wix) =====
// parseMarkdown(md) -> [{type:'heading',level,inlines}|{type:'paragraph',inlines}|{type:'list',ordered,items:[inlines]}|{type:'quote',inlines}]
// inlines: [{text, bold, italic, code, href}]
function parseInline(s) {
  const out = []; const src = String(s || '');
  const push = (t, m) => { if (t) out.push(Object.assign({ text: t }, m || {})); };
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|_([^_\n]+)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let m; let last = 0;
  while ((m = re.exec(src))) {
    push(src.slice(last, m.index));
    if (m[2] || m[3]) push(m[2] || m[3], { bold: true });
    else if (m[4] || m[5]) push(m[4] || m[5], { italic: true });
    else if (m[6]) push(m[6], { code: true });
    else if (m[7]) push(m[7], { href: m[8] });
    last = m.index + m[0].length;
  }
  push(src.slice(last));
  return out;
}
function parseMarkdown(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  const blocks = []; let para = []; let list = null;
  const flushPara = () => { if (para.length) { blocks.push({ type: 'paragraph', inlines: parseInline(para.join(' ')) }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) { flushPara(); flushList(); continue; }
    let m;
    if ((m = t.match(/^(#{1,6})\s+(.*)$/))) { flushPara(); flushList(); blocks.push({ type: 'heading', level: Math.min(Math.max(m[1].length, 2), 4), inlines: parseInline(m[2].replace(/\s#+$/, '')) }); continue; }
    if ((m = t.match(/^[-*+]\s+(.*)$/))) { flushPara(); if (!list || list.ordered) { flushList(); list = { type: 'list', ordered: false, items: [] }; } list.items.push(parseInline(m[1])); continue; }
    if ((m = t.match(/^\d+[.)]\s+(.*)$/))) { flushPara(); if (!list || !list.ordered) { flushList(); list = { type: 'list', ordered: true, items: [] }; } list.items.push(parseInline(m[1])); continue; }
    if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); flushList(); blocks.push({ type: 'quote', inlines: parseInline(m[1]) }); continue; }
    if (/^(-{3,}|\*{3,})$/.test(t)) { flushPara(); flushList(); continue; }
    flushList(); para.push(t);
  }
  flushPara(); flushList();
  return blocks;
}
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inlinesToHtml(inl) {
  return inl.map(x => { let h = escHtml(x.text); if (x.code) h = '<code>' + h + '</code>'; if (x.bold) h = '<strong>' + h + '</strong>'; if (x.italic) h = '<em>' + h + '</em>'; if (x.href) h = '<a href="' + escHtml(x.href) + '" target="_blank" rel="noopener">' + h + '</a>'; return h; }).join('');
}
function markdownToHtml(md) {
  return parseMarkdown(md).map(b => {
    if (b.type === 'heading') return '<h' + b.level + '>' + inlinesToHtml(b.inlines) + '</h' + b.level + '>';
    if (b.type === 'quote') return '<blockquote><p>' + inlinesToHtml(b.inlines) + '</p></blockquote>';
    if (b.type === 'list') return (b.ordered ? '<ol>' : '<ul>') + b.items.map(it => '<li>' + inlinesToHtml(it) + '</li>').join('') + (b.ordered ? '</ol>' : '</ul>');
    return '<p>' + inlinesToHtml(b.inlines) + '</p>';
  }).join('\n');
}
// Ricos (Wix rich content)
function markdownToRicos(md) {
  let seq = 0; const nid = () => 'n' + (++seq).toString(36) + Date.now().toString(36).slice(-4);
  const textNode = x => { const dec = []; if (x.bold) dec.push({ type: 'BOLD', fontWeightValue: 700 }); if (x.italic) dec.push({ type: 'ITALIC', italicData: true }); if (x.href) dec.push({ type: 'LINK', linkData: { link: { url: x.href, target: 'BLANK' } } }); return { type: 'TEXT', id: '', nodes: [], textData: { text: x.text, decorations: dec } }; };
  const paragraph = inl => ({ type: 'PARAGRAPH', id: nid(), nodes: inl.map(textNode), paragraphData: {} });
  const nodes = [];
  for (const b of parseMarkdown(md)) {
    if (b.type === 'heading') nodes.push({ type: 'HEADING', id: nid(), nodes: b.inlines.map(textNode), headingData: { level: b.level } });
    else if (b.type === 'quote') nodes.push({ type: 'BLOCKQUOTE', id: nid(), nodes: [paragraph(b.inlines)], blockquoteData: {} });
    else if (b.type === 'list') nodes.push({ type: b.ordered ? 'ORDERED_LIST' : 'BULLETED_LIST', id: nid(), nodes: b.items.map(it => ({ type: 'LIST_ITEM', id: nid(), nodes: [paragraph(it)] })), [b.ordered ? 'orderedListData' : 'bulletedListData']: { indentation: 0 } });
    else nodes.push(paragraph(b.inlines));
  }
  return { nodes, metadata: { version: 1 } };
}
