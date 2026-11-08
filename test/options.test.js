import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTurkeys, turkeySVG, cowboySVG, roastSVG } from '../src/sidequest.js';

test('reject invalid options before touching the page', () => {
  for (const options of [{ size: 0 }, { speed: NaN }, { maxTurkeys: 1.5 }, { maxTurkeys: 0 }, { jumpDistance: -1 }, { jumpHeight: Infinity }, { spawnInterval: [20, 10] }, { lifetime: [0, 100] }, { lifetime: 'fast' }, { poopInterval: [0, 100] }, { poopInterval: true }, { poopInterval: [200, 100] }, { poopLifetime: 0 }, {cowboy:'yes'}, {cowboySize:0}, {cowboySpeed:Infinity}, {roastLifetime:0}, {autoShotInterval:[0,1]}, {autoShotInterval:[20,10]}, {autoShotAccuracy:-.1}, {autoShotAccuracy:1.1}, {onTurkeyHit:true}, {onShot:true}]) {
    assert.throws(() => createTurkeys(options), TypeError);
  }
});
test('can create an idle flock without a browser', () => {
  const flock = createTurkeys();
  assert.equal(flock.count, 0);
  assert.equal(flock.running, false);
  assert.equal(flock.paused, false);
  assert.equal(flock.controlled, false);
  assert.equal(flock.spawn(), false);
});
test('decorative artwork is self-contained', () => {
  for (const svg of [turkeySVG(),cowboySVG(),roastSVG()]) {
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /shape-rendering="crispEdges"/);
    assert.doesNotMatch(svg, /<image|<script|href=/);
  }
  assert.match(cowboySVG(), /class="rifle"/);
  assert.match(cowboySVG(), /cowboy-leg/);
});
test('classic build exposes the same supported public API', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const context = { window: {} };
  runInNewContext(await readFile(new URL('../dist/sidequest.js', import.meta.url), 'utf8'), context);
  assert.deepEqual(Object.keys(context.window.Sidequest).sort(),['childSVG','cowboySVG','createOrcGame','createSantaGame','createTurkeys','giftSVG','orcSVG','roastSVG','santaSVG','start','turkeySVG']);
  assert.equal(context.window.Sidequest.cowboySVG(), cowboySVG());
});
test('spawn only accepts turkeys', () => {
  assert.throws(()=>createTurkeys().spawn('pilgrim'),TypeError);
  assert.throws(()=>createTurkeys().spawn('cowboy'),TypeError);
  assert.equal(createTurkeys().spawn('turkey'),false);
});
test('cowboy and droppings can be disabled', () => {
  assert.equal(createTurkeys({cowboy:false,poopInterval:false}).count,0);
});
