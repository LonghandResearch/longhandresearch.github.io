// Build the public RSS feed from the same catalogue the site reads.
import { readFile, writeFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const base = 'https://longhandresearch.github.io/';
const catalogueUrl = new URL('../reports/reports.js', import.meta.url);
const feedUrl = new URL('../feed.xml', import.meta.url);

function xml(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
    })[character]);
}

function publicationDate(value, id) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid publication date for ${id}`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid publication date for ${id}`);
  }
  return date.toUTCString();
}

const source = await readFile(catalogueUrl, 'utf8');
const sandbox = { window: {} };
runInNewContext(source, sandbox, { filename: 'reports/reports.js', timeout: 1000 });
const reports = sandbox.window.LONGHAND_REPORTS;
if (!Array.isArray(reports)) throw new Error('reports/reports.js did not provide a report list');

const ids = new Set();
const items = reports.map((report) => {
  const id = String(report.id || '').trim();
  const headline = String(report.title || '').trim();
  const subject = String(report.ticker || report.category || '').trim();
  if (!id || !headline || !subject || ids.has(id)) throw new Error(`Invalid or duplicate report: ${id}`);
  ids.add(id);
  const date = String(report.date || '');
  const pubDate = publicationDate(date, id);
  const page = String(report.page || '').trim();
  if (page && !/^[\w./-]+\.html$/.test(page)) throw new Error(`Invalid page for ${id}`);
  const link = new URL(page || `report.html?id=${encodeURIComponent(id)}`, base).href;
  const description = String(report.blurb || '').trim() || String(report.summary || '').trim();
  return { id, title: `${subject}: ${headline}`, headline, date, link, pubDate, description };
});

items.sort((a, b) => b.date.localeCompare(a.date) || a.headline.localeCompare(b.headline));
const entries = items.map((item) => `  <item>
    <title>${xml(item.title)}</title>
    <link>${xml(item.link)}</link>
    <guid isPermaLink="true">${xml(item.link)}</guid>
    <pubDate>${xml(item.pubDate)}</pubDate>
    <description>${xml(item.description)}</description>
  </item>`);
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Longhand Research</title>
  <link>${base}</link>
  <description>Independent research on companies, sectors and markets.</description>
  <language>en</language>
${entries.join('\n')}
</channel>
</rss>
`;

await writeFile(feedUrl, feed, 'utf8');
console.log(`Built feed.xml with ${items.length} reports`);
