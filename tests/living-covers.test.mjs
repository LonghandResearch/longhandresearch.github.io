import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const scope = { window: {} };
runInNewContext(read('reports/reports.js'), scope);
runInNewContext(read('assets/js/living-covers-data.js'), scope);
const reports = scope.window.LONGHAND_REPORTS;
const living = scope.window.LonghandLiving;
const art = read('assets/js/research-art.js');

test('every living cover belongs to a published report and its own cover artwork', () => {
  assert.ok(Object.keys(living).length >= 15);
  for (const [id, d] of Object.entries(living)) {
    assert.ok(reports.some((r) => r.id === id), id);
    assert.ok(art.includes(`'${id}': ['${d.id}',`), `${id} uses the ${d.id} cover`);
    assert.ok(existsSync(resolve(root, `assets/img/research/covers/${d.id}-art-640.webp`)), d.id);
  }
});

test('every file a living cover asks for exists', () => {
  for (const d of Object.values(living)) {
    const dir = `assets/img/research/living/${d.id}/`;
    const need = [];
    if (d.base) need.push('base.webp');
    if (d.sky) {
      assert.ok(d.base, `${d.id} keeps a still sky under the moving clouds`);
      need.push('sky.png', 'clouds.webp');
    }
    for (const w of d.warps) {
      if (w.type === 'track') need.push('track.webp');
      else need.push(`${w.type}.webp`, `${w.type}-data.png`);
    }
    for (const s of d.sprites) need.push(`sprite-${s.name}.webp`);
    if (d.hoist) need.push('sprite-load.webp');
    for (const f of need) assert.ok(existsSync(resolve(root, dir + f)), dir + f);
  }
});

test('moving regions stay inside the 640 x 960 cover', () => {
  for (const d of Object.values(living)) {
    for (const { box: [x, y, w, h] } of [...d.warps, ...d.sprites]) {
      assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 640 && y + h <= 960, `${d.id} ${x},${y},${w},${h}`);
    }
  }
});
