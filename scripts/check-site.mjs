// Check the site before a change is merged: scripts parse, JSON parses, the
// catalogue loads and points at files that exist, the sitemap matches the
// catalogue, and links between pages lead somewhere. Paths are compared
// letter for letter, because GitHub Pages is case-sensitive even when the
// computer the site is edited on is not.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://longhandresearch.github.io/';
const problems = [];
const fail = (file, message) => problems.push({ file, message });
const read = (file) => readFileSync(join(root, file), 'utf8');

/* Every file the repository tracks, so scratch files on a computer are not checked */
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(Boolean);

/* A path is a file only if every part of it matches a real name exactly,
   and it ends at a file rather than a folder */
const listings = new Map();
function existsExactly(path) {
  let dir = root;
  for (const part of path.split('/').filter(Boolean)) {
    if (!listings.has(dir)) listings.set(dir, existsSync(dir) ? readdirSync(dir) : []);
    if (!listings.get(dir).includes(part)) return false;
    dir = join(dir, part);
  }
  return dir !== root && statSync(dir).isFile();
}

/* 1. Scripts parse */
for (const file of tracked.filter((f) => /\.(m?js)$/.test(f))) {
  try {
    execFileSync(process.execPath, ['--check', join(root, file)], { stdio: 'pipe' });
  } catch (e) {
    fail(file, `does not parse: ${String(e.stderr || e.message).trim().split('\n').slice(0, 5).join(' ')}`);
  }
}

/* 2. JSON parses */
for (const file of tracked.filter((f) => f.endsWith('.json'))) {
  try { JSON.parse(read(file)); } catch (e) { fail(file, `is not valid JSON: ${e.message}`); }
}

/* 3. The catalogue loads and every entry is complete */
const CATEGORIES = ['Initiation', 'Update', 'Sector', 'Macro'];
const RATINGS = ['BUY', 'HOLD', 'SELL'];
let reports = [];
try {
  const sandbox = { window: {} };
  runInNewContext(read('reports/reports.js'), sandbox, { filename: 'reports/reports.js', timeout: 1000 });
  reports = sandbox.window.LONGHAND_REPORTS;
  if (!Array.isArray(reports)) throw new Error('it does not set window.LONGHAND_REPORTS to a list');
} catch (e) {
  fail('reports/reports.js', `could not be loaded: ${e.message}`);
  reports = [];
}

const ids = new Set();
// The same address site.js gives a report
const reportUrl = (r) => (r.page ? r.page : `report.html?id=${encodeURIComponent(r.id)}`);
for (const r of reports) {
  const where = `entry "${r.id || r.title || '?'}"`;
  const bad = (m) => fail('reports/reports.js', `${where}: ${m}`);
  if (!r.id) bad('has no id');
  else if (ids.has(r.id)) bad('uses an id that is already taken');
  else ids.add(r.id);
  if (!String(r.title || '').trim()) bad('has no title');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(r.date || ''));
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!m || d.getUTCMonth() !== +m[2] - 1) bad(`has an invalid date "${r.date}" (use YYYY-MM-DD)`);
  // The site reads these without regard to case, as site.js does
  const same = (list, v) => list.some((x) => x.toLowerCase() === String(v ?? '').trim().toLowerCase());
  if (!same(CATEGORIES, r.category)) bad(`has category "${r.category}"; use one of ${CATEGORIES.join(', ')}`);
  if (r.rating != null && r.rating !== '' && !same(RATINGS, r.rating)) bad(`has rating "${r.rating}"; use ${RATINGS.join(', ')} or null`);
  for (const k of ['price', 'targetPrice', 'upside', 'pages', 'fileSize']) {
    if (r[k] != null && typeof r[k] !== 'number') bad(`has a ${k} that is not a number`);
  }
  if (r.page) {
    if (!/^[\w./-]+\.html$/.test(r.page)) bad(`has page "${r.page}", which is not an .html file in the site`);
    else if (!existsExactly(r.page)) bad(`points to page "${r.page}", which is not a file in the site (check upper and lower case)`);
  } else if (!r.pdfUrl) {
    bad('has neither pdfUrl nor page');
  } else if (!/^[a-z]+:/i.test(r.pdfUrl) && !existsExactly(r.pdfUrl)) {
    bad(`points to "${r.pdfUrl}", which is not a file in the site (check upper and lower case)`);
  }
}

/* 4. The sitemap lists every report, and only pages that exist */
const sitemap = existsSync(join(root, 'sitemap.xml')) ? read('sitemap.xml') : '';
if (!sitemap) fail('sitemap.xml', 'is missing');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1].trim());
const inSitemap = new Set();
for (const loc of locs) {
  if (!loc.startsWith(site)) { fail('sitemap.xml', `lists ${loc}, which is not on ${site}`); continue; }
  const path = loc.slice(site.length).replace(/&amp;/g, '&');
  inSitemap.add(path);
  const id = /^report\.html\?id=(.+)$/.exec(path);
  if (id) { if (!ids.has(decodeURIComponent(id[1]))) fail('sitemap.xml', `lists report "${id[1]}", which is not in the catalogue`); }
  else if (path && !existsExactly(path.split(/[?#]/)[0])) fail('sitemap.xml', `lists ${path}, which does not exist`);
}
for (const r of reports) {
  if (r.id && !inSitemap.has(reportUrl(r))) fail('sitemap.xml', `is missing the report "${r.id}" (${site}${reportUrl(r)})`);
}

/* 5. Links and files named in the pages exist */
const SKIP = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;   // other sites, mailto:, data: and the like
const pages = tracked.filter((f) => f.endsWith('.html'));

/* The ids each page has: those in its markup, and, by prefix, those its own
   scripts write in as it opens, such as id="src-${...}" */
const anchorsOf = new Map(pages.map((file) => {
  const html = read(file);
  const own = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]));
  const prefixes = [...html.matchAll(/<script[^>]*\ssrc="([^"?#]+)/g)]
    .map((x) => x[1].replace(/^\//, ''))
    .filter((p) => !SKIP.test(p) && existsExactly(p))
    .flatMap((p) => [...read(p).matchAll(/id="([\w-]+)\$\{/g)].map((x) => x[1]));
  return [file, (id) => own.has(id) || prefixes.some((prefix) => id.startsWith(prefix))];
}));

for (const file of pages) {
  for (const [, attr, value] of read(file).matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (!value || SKIP.test(value) || /[$'{}]/.test(value)) continue;   // outside links, and addresses built by scripts
    const [address, fragment = ''] = value.split('#');
    const [path, query = ''] = address.split('?');
    let target = !path ? file
      : path.startsWith('/') ? path.slice(1)
      : relative(root, join(root, dirname(file), path)).split(sep).join('/');
    if (target && path.endsWith('/')) target += '/index.html';   // a folder opens its index.html, if it has one
    if (!target) continue;   // the front page, "/"
    if (!existsExactly(target)) { fail(file, `${attr}="${value}" leads to ${target}, which does not exist as a file (check upper and lower case)`); continue; }
    const id = target === 'report.html' && /(?:^|&)id=([^&]+)/.exec(query);
    if (id && !ids.has(decodeURIComponent(id[1]))) fail(file, `links to report "${id[1]}", which is not in the catalogue`);
    const hasId = anchorsOf.get(target);
    if (fragment && hasId && !hasId(decodeURIComponent(fragment))) fail(file, `links to ${value}, but ${target} has no element with id "${fragment}"`);
  }
}

/* Report */
if (problems.length) {
  const inActions = !!process.env.GITHUB_ACTIONS;
  for (const p of problems) {
    console.log(inActions ? `::error file=${p.file}::${p.message}` : `${p.file}: ${p.message}`);
  }
  console.log(`\n${problems.length} ${problems.length === 1 ? 'problem' : 'problems'} found.`);
  process.exit(1);
}
console.log(`All checks passed: ${tracked.filter((f) => /\.(m?js)$/.test(f)).length} scripts, ${tracked.filter((f) => f.endsWith('.json')).length} JSON files, ${reports.length} catalogue entries, ${locs.length} sitemap pages and the links in ${pages.length} pages.`);
