import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOrcGame,orcSVG} from '../src/turkeys.js';

test('orc game is idle until explicitly started',()=>{
  const game=createOrcGame();
  assert.equal(game.running,false);assert.equal(game.controlled,false);
  assert.equal(game.arrowCount,0);assert.equal(game.fireCount,0);
});
test('orc options reject invalid rates, lifetimes, bounds, and callbacks',()=>{
  for(const options of [{size:0},{speed:NaN},{fireLifetime:-1},{maxFires:0},{maxArrows:1.5},{autoShotInterval:[0,50]},{autoShotInterval:[50,20]},{autoShotInterval:true},{autoShotAccuracy:-.1},{autoShotAccuracy:1.1},{onShot:true},{onElementHit:'fire'}]) assert.throws(()=>createOrcGame(options),TypeError);
  assert.equal(createOrcGame({autoShotInterval:false}).running,false);
});
test('orc pixel artwork has armor, legs, and a bow with no external artwork',()=>{
  const svg=orcSVG();
  assert.match(svg,/class="bow"/);assert.match(svg,/bow-string/);assert.match(svg,/orc-leg/);
  assert.match(svg,/shape-rendering="crispEdges"/);assert.match(svg,/aria-hidden="true"/);
  assert.doesNotMatch(svg,/<image|href=|<script|class="rifle"/);
});
test('distributed ES module exports both independent games',async()=>{
  const library=await import('../dist/turkeys.mjs');
  assert.equal(typeof library.createTurkeys,'function');assert.equal(typeof library.createOrcGame,'function');
  assert.equal(library.orcSVG(),orcSVG());
});
