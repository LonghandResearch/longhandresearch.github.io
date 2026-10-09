import test from 'node:test';
import assert from 'node:assert/strict';
import { decode, cleanHeadline } from '../scripts/wire-text.mjs';

test('repairs observed Okezone spaces and ampersands in fresh or retained titles', () => {
  assert.equal(cleanHeadline('Mendag untukamp;nbsp;Gaet Konsumen', 'Okezone'), 'Mendag untuk Gaet Konsumen');
  assert.equal(cleanHeadline('Orange Sukukamp;nbsp;', 'Okezone'), 'Orange Sukuk');
  assert.equal(cleanHeadline('Strategi Famp;B', 'Okezone'), 'Strategi F&B');
});

test('decodes nested entities, numeric Unicode, CDATA and title markup', () => {
  assert.equal(cleanHeadline('<![CDATA[<b>Oil</b> &amp;amp; gas &amp;nbsp; &#x1F4C8;]]>', 'CNBC'), 'Oil & gas 📈');
  assert.equal(cleanHeadline('&lt;b&gt;Market&lt;/b&gt; &#39;news&#39;', 'CNBC'), "Market 'news'");
  assert.equal(cleanHeadline('&#99999999; &unknown;', 'CNBC'), '&#99999999; &unknown;');
});

test('keeps the malformed publisher repair scoped and URL decoding single-pass', () => {
  assert.equal(cleanHeadline('Famp;B', 'CNBC'), 'Famp;B');
  assert.equal(decode('https://example.com/?q=amp;nbsp;&amp;next=%26amp%3B'), 'https://example.com/?q=amp;nbsp;&next=%26amp%3B');
  const title = cleanHeadline('Famp;B &amp;nbsp; berita', 'Okezone');
  assert.equal(cleanHeadline(title, 'Okezone'), title);
});
