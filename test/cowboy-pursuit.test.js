import test from 'node:test';
import assert from 'node:assert/strict';
import { cowboyPursuit } from '../src/cowboy.js';

const choose = (targets, extra = {}) => cowboyPursuit({ x: 700, bottom: 1080, width: 1920, size: 48, targets, ...extra });
const turkey = (id, x, y = 900) => ({ id, x, y, radius: 12 });

test('cowboy pursues the nearest distant turkey in either direction', () => {
  assert.deepEqual(choose([turkey('far', 1900), turkey('near', 1400)]), { id: 'near', direction: 1 });
  assert.deepEqual(choose([turkey('left', 40)]), { id: 'left', direction: -1 });
  assert.equal(choose([turkey('far', 1900), turkey('close', 800)]), null, 'a nearby turkey takes priority over a distant one');
});

test('pursuit continues inside its start range and stops in firing range', () => {
  const target = turkey('target', 1224);
  assert.equal(choose([target]), null);
  assert.deepEqual(choose([target], { targetId: 'target' }), { id: 'target', direction: 1 });
  assert.equal(choose([turkey('target', 1100)], { targetId: 'target' }), null);
});

test('missing, offscreen and vertically unreachable turkeys cannot cause endless pursuit', () => {
  assert.equal(choose([]), null);
  assert.equal(choose([turkey('gone', -100), turkey('outside', 2000), turkey('above', 100, -20)]), null);
  assert.equal(choose([turkey('too-high', 1400, 20)], { bottom: 2400 }), null);
  assert.deepEqual(choose([turkey('replacement', 1500)], { targetId: 'gone' }), { id: 'replacement', direction: 1 });
});
