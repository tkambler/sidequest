import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSantaGame, santaSVG, childSVG, giftSVG } from '../src/sidequest.js';
import { stepSleigh } from '../src/sleigh-physics.js';

test('Santa is opt-in and validates timing, sizes, caps and flags before mounting', () => {
  const game = createSantaGame();
  assert.equal(game.running, false); assert.equal(game.count, 0);
  assert.equal(game.giftCount, 0); assert.equal(game.waitingCount, 0);
  assert.equal(game.delivering, false); assert.equal(game.controlled, false); assert.equal(game.deliveredCount, 0); assert.equal(game.airborneGiftCount, 0); assert.equal(game.hitCount,0); assert.equal(game.crashing,false); assert.equal(game.recovering,false); assert.equal(game.cowboyShotCount,0); assert.equal(game.spawn(), false);
  assert.throws(() => game.spawn('turkey'), TypeError);
  for (const options of [{size:0},{sleighSize:NaN},{giftLifetime:0},{respawnDelay:0},{interactive:'yes'},{flightSpeed:0},{cowboy:'yes'},{cowboySize:0},{cowboyShotInterval:true},{cowboyShotInterval:[0,1]},{cowboyShotInterval:[20,10]},{cowboyAccuracy:-.1},{cowboyAccuracy:1.1},{onShot:'bang'},{maxChildren:0},{maxChildren:1.5},
    {spawnInterval:[20,10]},{visitInterval:false},{lifetime:[0,1]},{snow:'yes'},{respectReducedMotion:1}]) {
    assert.throws(() => createSantaGame(options), TypeError);
  }
});
test('Christmas artwork is self-contained and includes distinct boy and girl sprites', () => {
  for (const svg of [santaSVG(), childSVG(), childSVG('girl'), giftSVG()]) {
    assert.match(svg, /shape-rendering="crispEdges"/); assert.match(svg, /aria-hidden="true"/);
    assert.doesNotMatch(svg, /<image|<script|href=/);
  }
  assert.notEqual(childSVG('boy'), childSVG('girl'));
});
test('sleigh acceleration is bounded and landing brakes to a stable rest at different frame rates', () => {
  const endings = [];
  for (const dt of [1/120, 1/60, 1/20]) {
    const body = {x:-120,y:100,vx:120,vy:0};
    const target = {x:550,y:600}; let landed = false, maxSpeed = 0;
    for (let time = 0; time < 20; time += dt) {
      const {vx,vy} = body;
      landed = stepSleigh(body,target,dt,true);
      assert.ok(Math.hypot(body.vx-vx,body.vy-vy) <= 230*dt + 1e-8);
      maxSpeed = Math.max(maxSpeed,Math.hypot(body.vx,body.vy));
      if (landed) break;
    }
    assert.ok(landed, 'must reach the ground and settle');
    assert.ok(Math.hypot(body.x-target.x,body.y-target.y)<1.6);
    assert.ok(Math.hypot(body.vx,body.vy)<5);
    assert.ok(maxSpeed > 150, 'cruises before braking');
    endings.push(body);
  }
  assert.ok(Math.abs(endings[0].x-endings[2].x)<1);
});
test('takeoff gains altitude continuously without teleporting or instantly reversing velocity', () => {
  const body = {x:300,y:600,vx:0,vy:0};
  stepSleigh(body,{x:355,y:470},1/60);
  assert.ok(body.y<600 && body.y>599);
  assert.ok(Math.hypot(body.vx,body.vy)<=330/60+1e-8);
  const before=body.vx;
  stepSleigh(body,{x:-500,y:50},1/60);
  assert.ok(Math.abs(body.vx-before)<=330/60+1e-8);
});
test('distributed module exposes the Santa factory and artwork', async () => {
  const library = await import('../dist/sidequest.mjs');
  assert.equal(typeof library.createSantaGame,'function');
  assert.equal(library.santaSVG(),santaSVG());
  assert.equal(library.childSVG('girl'),childSVG('girl'));
});
