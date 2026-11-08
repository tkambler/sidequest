import test from 'node:test';
import assert from 'node:assert/strict';
import { trackPerches } from '../src/perches.js';

test('cached spans follow fractional scroll offsets with one rectangle read per element', () => {
  let reads = 0;
  const rect = { left: 24.5, top: -12.25 };
  const element = { isConnected: true, getBoundingClientRect() { reads++; return { ...rect }; } };
  const geometry = { left: 10, top: 20 };
  const make = offset => ({ element, geometry, left: 12 + offset, right: 80 + offset, y: 30 + offset, originLeft: 10 + offset });
  const first = make(0), second = make(5);
  const movement = trackPerches([first, second]);
  assert.equal(reads, 1);
  assert.deepEqual(movement.get(first), { x: 14.5, y: -32.25 });
  assert.deepEqual(movement.get(second), { x: 14.5, y: -32.25 });
  assert.equal(first.left, 26.5);
  assert.equal(first.right, 94.5);
  assert.equal(first.y, -2.25);
  assert.equal(first.originLeft, 24.5);
  assert.equal(second.y, 2.75);
  assert.equal(trackPerches([first, second]).size, 0, 'an unchanged frame cannot apply the offset twice');
  rect.left = 10; rect.top = 20;
  trackPerches([first, second]);
  assert.equal(first.left, 12);
  assert.equal(first.y, 30);
  assert.equal(first.originLeft, 10);
});

test('viewport floor and removed anchors do not require geometry reads', () => {
  const floor = { element: {}, left: 0, right: 100, y: 100, originLeft: 0 };
  const removed = { element: { isConnected: false, getBoundingClientRect() { throw Error('removed anchor measured'); } }, geometry: { left: 0, top: 0 } };
  assert.equal(trackPerches([floor, removed]).size, 0);
  assert.equal(floor.y, 100);
});
