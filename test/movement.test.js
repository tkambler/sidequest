import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stepHorizontalMotion,strideDuration} from '../src/movement.js';
const step=(state,input,dt)=>stepHorizontalMotion(state,input,dt,10000,140);
test('movement accelerates gradually toward a capped running speed',()=>{
  const slow=step({x:100,velocity:0},1,50),fast=step(slow,1,100),full=step(fast,1,500);
  assert.ok(slow.velocity>0&&slow.velocity<fast.velocity);
  assert.ok(fast.velocity<140);
  assert.equal(full.velocity,140);
  assert.ok(slow.x>100&&slow.x<100+140*.05);
});
test('releasing movement coasts briefly, then comes to rest',()=>{
  const coast=step({x:100,velocity:140},0,100);
  assert.ok(coast.x>100&&coast.velocity>0&&coast.velocity<140);
  const stopped=step(coast,0,500);
  assert.equal(stopped.velocity,0);
  assert.equal(step(stopped,0,200).x,stopped.x);
});
test('reversing direction brakes before accelerating the other way',()=>{
  const braking=step({x:100,velocity:140},-1,50);
  assert.ok(braking.velocity>0&&braking.velocity<140&&braking.x>100);
  const reversed=step(braking,-1,250);
  assert.ok(reversed.velocity<0&&reversed.x<braking.x);
});
test('viewport walls absorb movement instead of bouncing or drifting offscreen',()=>{
  assert.deepEqual(stepHorizontalMotion({x:99,velocity:140},1,50,100,140),{x:100,velocity:0});
  assert.deepEqual(stepHorizontalMotion({x:1,velocity:-140},-1,50,100,140),{x:0,velocity:0});
});
test('acceleration, braking, and coasting are consistent across frame rates',()=>{
  for(const [velocity,input] of [[0,1],[140,-1],[140,0]]){
    const once=step({x:100,velocity},input,350);
    let many={x:100,velocity};for(let i=0;i<35;i++)many=step(many,input,10);
    assert.ok(Math.abs(once.x-many.x)<1e-8);
    assert.ok(Math.abs(once.velocity-many.velocity)<1e-8);
  }
});

test('legs speed up with real movement speed up to the animation limit',()=>{
  assert.ok(strideDuration(40)>strideDuration(140));
  assert.ok(strideDuration(140)>strideDuration(420));
  assert.equal(strideDuration(-420),strideDuration(420));
  assert.ok(strideDuration(2000)>=.09);
});
