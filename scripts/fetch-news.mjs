/* Longhand Research: gathers The Wire.
   Run every hour by .github/workflows/wire.yml. Reads the sources in
   news/feeds.json, takes the headline, link and time of each story, and
   writes news/news.json for the site. Only headlines and links are kept;
   every story is read at its source.
   A source that fails is skipped; its earlier headlines stay until they age out. */

import { readFile, writeFile } from 'node:fs/promises';

const FEEDS = new URL('../news/feeds.json', import.meta.url);
const OUT = new URL('../news/news.json', import.meta.url);
const TOPICS = ['Markets', 'Macro', 'Commodities', 'Crypto'];
const KEEP_DAYS = 4;          // headlines older than this drop off
const PER_SOURCE = 25;        // newest stories taken from each feed per run
const MAX_ITEMS = 240;

/* Only market news. A source marked "strict" in feeds.json also covers
   general news, so its headlines are kept only when they name something a
   market reader follows: shares, rates, currencies, commodities, crypto,
   earnings, deals or the economy. Some subjects are never kept, from any
   source: sport, celebrities, accidents, promotions, how-to pieces. */
const MARKET = new RegExp([
  // Indonesian
  'ihsg', 'saham', 'bursa', 'bei', 'emiten', 'investor', 'obligasi', 'sbn', 'surat utang', 'rupiah', 'dolar', 'kurs', 'valas',
  'suku bunga', 'bi[- ]?rate', 'bi', 'bank indonesia', 'rdg', 'ojk', 'inflasi', 'deflasi', 'pdb', 'pertumbuhan ekonomi',
  'neraca (?:dagang|perdagangan|pembayaran)', 'cadangan devisa', 'ekspor', 'impor', 'dividen', 'laba', 'rugi bersih', 'pendapatan',
  'ipo', 'rights? issue', 'buyback', 'reksa ?dana', 'sekuritas', 'pasar modal', 'emas', 'minyak', 'batu ?bara', 'nikel',
  'cpo', 'timah', 'tembaga', 'komoditas', 'kripto', 'apbn', 'fiskal', 'moneter', 'perbankan', 'kredit', 'akuisisi', 'net (?:buy|sell)',
  'asing', 'uang beredar', 'harga (?:bbm|pangan pokok)', 'triliun', 'miliar',
  // English
  'stocks?', 'shares?', 'equit(?:y|ies)', 'markets?', 's&p', 'nasdaq', 'dow', 'bonds?', 'yields?', 'treasur(?:y|ies)', 'rates?', 'fed',
  'fomc', 'central banks?', 'inflation', 'cpi', 'ppi', 'gdp', 'recession', 'payrolls?', 'jobs report', 'earnings', 'revenue', 'profits?',
  'dividends?', 'mergers?', 'acquisitions?', 'investors?', 'funds?', 'etfs?', 'dollar', 'currenc(?:y|ies)', 'forex', 'yen', 'euro',
  'yuan', 'oil', 'crude', 'brent', 'gold', 'silver', 'copper', 'lithium', 'coal', 'commodit(?:y|ies)', 'opec', 'bitcoin', 'crypto',
  'tariffs?', 'trade', 'econom(?:y|ic|ies)', 'banks?', 'lending', 'credit', 'debt', 'deficit', 'stimulus', 'wall street',
  'hedge funds?', 'valuations?', 'rally', 'sell-?off', 'billion', 'trillion',
].map((w) => `\\b${w}\\b`).join('|'), 'i');
const NEVER = new RegExp([
  'sepak ?bola', 'liga', 'timnas', 'artis', 'seleb\\w*', 'zodiak', 'resep', 'horoskop', 'gosip', 'viral', 'kecelakaan', 'banjir', 'gempa',
  'pembunuhan', 'lowongan', 'cpns', 'bansos', 'hadiah', 'promo', 'diskon', 'bonus', 'kuis', 'pengertian', 'cara', 'tips',
  'quiz', 'recipes?', 'celebrit(?:y|ies)', 'horoscopes?', 'nfl', 'nba', 'football', 'obituary',
].map((w) => `\\b${w}\\b`).join('|'), 'i');
const onTopic = (title, strict) => !NEVER.test(title) && (!strict || MARKET.test(title));

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };
const decode = (s) => String(s || '')
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

const tag = (xml, name) => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(xml);
  return m ? m[1] : '';
};

function parse(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    let link = decode(tag(b, 'link'));
    if (!link) {
      const m = /<link\b[^>]*?href="([^"]+)"[^>]*>/i.exec(b);
      link = m ? decode(m[1]) : '';
    }
    if (!/^https?:\/\//i.test(link)) link = decode(tag(b, 'guid'));
    const when = decode(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    return { title: decode(tag(b, 'title')), url: link, time: Date.parse(when) };
  });
}

async function gather(feed) {
  const res = await fetch(feed.url, {
    headers: { 'user-agent': 'LonghandResearch/1.0 (+https://longhandresearch.github.io/wire.html)', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(20000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = parse(await res.text());
  if (!items.length) throw new Error('no stories in the feed');
  return items;
}

const now = Date.now();
const oldest = now - KEEP_DAYS * 86400000;
const { feeds } = JSON.parse(await readFile(FEEDS, 'utf8'));
let previous = [];
try { previous = JSON.parse(await readFile(OUT, 'utf8')).items || []; } catch { /* first run */ }

const fresh = [];
const results = await Promise.allSettled(feeds.map(gather));
results.forEach((r, i) => {
  const f = feeds[i];
  if (r.status === 'rejected') {
    console.log(`::warning::${f.name} (${f.url}) skipped: ${r.reason && r.reason.message}`);
    return;
  }
  const topic = TOPICS.includes(f.topic) ? f.topic : 'Markets';
  const ok = r.value
    .filter((x) => x.title && /^https?:\/\//i.test(x.url) && Number.isFinite(x.time) && onTopic(x.title, f.strict))
    .sort((a, b) => b.time - a.time)
    .slice(0, PER_SOURCE)
    .map((x) => ({
      title: x.title.slice(0, 300),
      url: x.url,
      source: f.name,
      topic,
      ...(/^[a-z]{2}$/.test(f.lang || '') ? { lang: f.lang } : {}),
      time: new Date(Math.min(x.time, now)).toISOString(),   // a clock running fast never puts a story in the future
    }));
  console.log(`${f.name} · ${topic}: ${ok.length} headlines`);
  fresh.push(...ok);
});

// The newest copy of each story wins; the same headline from two feeds shows once
const seen = new Set();
const key = (x) => x.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Headlines kept earlier are checked again, so a tightened filter applies at once
const strictSources = new Set(feeds.filter((f) => f.strict).map((f) => f.name));
const items = [...fresh, ...previous.filter((x) => onTopic(x.title, strictSources.has(x.source)))]
  .filter((x) => Date.parse(x.time) >= oldest)
  .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
  .filter((x) => {
    if (seen.has(x.url) || seen.has(key(x))) return false;
    seen.add(x.url);
    seen.add(key(x));
    return true;
  })
  .slice(0, MAX_ITEMS);

const same = JSON.stringify(items) === JSON.stringify(previous);
if (same) {
  console.log('No new headlines.');
} else {
  await writeFile(OUT, `${JSON.stringify({ updated: new Date(now).toISOString(), items }, null, 1)}\n`);
  console.log(`Wrote ${items.length} headlines.`);
}
if (!fresh.length) console.log('::warning::No source could be read this run.');
