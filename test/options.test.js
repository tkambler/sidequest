import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTurkeys, turkeySVG, pilgrimSVG, roastSVG } from '../src/turkeys.js';

test('reject invalid options before touching the page', () => {
  for (const options of [{ size: 0 }, { speed: NaN }, { maxTurkeys: 1.5 }, { maxTurkeys: 0 }, { jumpDistance: -1 }, { jumpHeight: Infinity }, { spawnInterval: [20, 10] }, { lifetime: [0, 100] }, { lifetime: 'fast' }, { poopInterval: [0, 100] }, { poopInterval: true }, { poopInterval: [200, 100] }, { poopLifetime: 0 }]) {
    assert.throws(() => createTurkeys(options), TypeError);
  }
});
test('can create an idle flock without a browser', () => {
  const flock = createTurkeys();
  assert.equal(flock.count, 0);
  assert.equal(flock.running, false);
  assert.equal(flock.paused, false);
  assert.equal(flock.spawn(), false);
});
test('artwork has no external dependencies or accessible content', () => {
  const svg = turkeySVG();
  assert.match(svg, /aria-hidden="true"/);
  assert.match(svg, /class="wing"/);
  assert.doesNotMatch(svg, /<image|<script|href=/);
});
test('classic build exposes the same public API', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const context = { window: {} };
  runInNewContext(await readFile(new URL('../dist/turkeys.js', import.meta.url), 'utf8'), context);
  assert.equal(typeof context.window.TinyTurkeys.createTurkeys, 'function');
  assert.equal(context.window.TinyTurkeys.turkeySVG(), turkeySVG());
  assert.equal(context.window.TinyTurkeys.pilgrimSVG(), pilgrimSVG());
  assert.equal(context.window.TinyTurkeys.roastSVG(), roastSVG());
});

test('accepts supported characters and rejects invalid character configuration', () => {
  for (const characters of [[], ['duck'], 'pilgrim', null]) {
    assert.throws(() => createTurkeys({ characters }), TypeError);
  }
  const flock = createTurkeys({ characters: ['turkey', 'pilgrim'] });
  assert.equal(flock.spawn('pilgrim'), false);
  assert.throws(() => flock.spawn('duck'), TypeError);
  assert.match(pilgrimSVG(), /class="musket"/);
  assert.match(pilgrimSVG(), /class="foot foot-a"/);
  assert.doesNotMatch(pilgrimSVG(), /<image|<script|href=/);
});

test('turkey droppings can be disabled or configured', () => {
  assert.equal(createTurkeys({poopInterval:false}).count, 0);
  assert.equal(createTurkeys({poopInterval:[1000,2000],poopLifetime:3000}).count, 0);
});

test('roast artwork is self-contained pixel art without animated legs',()=>{
  const svg=roastSVG();
  assert.match(svg,/shape-rendering="crispEdges"/);
  assert.match(svg,/aria-hidden="true"/);
  assert.doesNotMatch(svg,/<image|<script|href=|class="foot|class="wing/);
});
