// Inline markdown for text written by models: **bold**, *italic* / _italic_, `code`, [text](url) and bare
// URLs or domains. Returns parts to render with Svelte (no {@html}, so nothing in the text can run).
// Part: { text, b?, i?, code?, href? }.

const TOKEN = /`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+?)\*\*|__([^_]+?)__|(?<![\w*])\*([^*\s][^*]*?)\*(?!\w)|(?<![\w])_([^_\s][^_]*?)_(?!\w)|\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s,;)\]]*)?)/gi;
// Bare domains only count with a common TLD, so "e.g." or "Node.js" stay text.
const DOMAIN_OK = /^https?:|\.(com|io|ai|xyz|dev|app|co|net|org|eu|be|nl|fr|de|uk|tech|so|sh|gg|jobs|careers)(\/|$)/i;

export function inlineMd(text, flags = {}) {
  const out = [];
  const s = String(text ?? '');
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    const [whole, code, linkText, linkUrl, b1, b2, i1, i2, url] = m;
    if (url !== undefined) {
      const raw = url.replace(/[.,]+$/, '');
      if (!DOMAIN_OK.test(raw)) continue;
      push(s.slice(last, m.index));
      out.push({ ...flags, text: raw, href: /^https?:/i.test(raw) ? raw : 'https://' + raw });
      last = m.index + raw.length;
      continue;
    }
    push(s.slice(last, m.index));
    if (code !== undefined) out.push({ ...flags, text: code, code: true });
    else if (linkText !== undefined) out.push({ ...flags, text: linkText, href: linkUrl });
    else if (b1 !== undefined || b2 !== undefined) out.push(...inlineMd(b1 ?? b2, { ...flags, b: true }));
    else out.push(...inlineMd(i1 ?? i2, { ...flags, i: true }));
    last = m.index + whole.length;
  }
  push(s.slice(last));
  return out;

  function push(t) {
    if (t) out.push({ ...flags, text: t });
  }
}
