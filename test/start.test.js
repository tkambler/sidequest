import { test } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../src/sidequest.js';

test('start requires a known mode before touching the document', () => {
  for (const options of [undefined, {}, {mode:'cowboy'}, {mode:'toString'}, {mode:null}]) {
    assert.throws(() => start(options), {name:'TypeError', message:'mode must be "turkeys", "orc", or "santa"'});
  }
});
test('start forwards options to the selected game validation', () => {
  for (const options of [{mode:'turkeys',maxTurkeys:0}, {mode:'orc',maxFires:0}, {mode:'santa',maxChildren:0}]) {
    assert.throws(() => start(options), TypeError);
  }
});
test('distributed builds expose the unified launcher', async () => {
  const library = await import('../dist/sidequest.mjs');
  assert.equal(typeof library.start, 'function');
  assert.throws(() => library.start({mode:'invalid'}), TypeError);
});
