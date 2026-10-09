/* Text-only RSS decoding. URL decoding remains a single pass. */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };

export const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]*>/g, '')
  .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  })
  .replace(/\s+/g, ' ')
  .trim();

export function cleanHeadline(value, source) {
  let title = String(value || '');
  // Okezone's RSS emits bare "amp;nbsp;" and "Famp;B" in titles.
  // Keep this publisher-specific repair out of URLs and other sources.
  if (source === 'Okezone') title = title.replace(/(?<!&)amp;/g, '&');
  for (let pass = 0; pass < 3; pass++) {
    const next = decode(title);
    if (next === title) break;
    title = next;
  }
  return title;
}
