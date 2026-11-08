import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepSantaFlight, santaThrowPose } from '../src/santa-flight.js';
const bounds = { width: 1000, height: 700, size: 120, speed: 320, surfaces: [] };
const body = () => ({ x: 300, y: 350, vx: 0, vy: 0, bank: 0, direction: 1 });

test('manual flight builds momentum, coasts, and brakes before reversing', () => {
  const s = body(); stepSantaFlight(s,{x:1,y:-1},1/60,bounds);
  assert.ok(s.vx>0 && s.vx<=12); assert.ok(s.vy<0 && s.vy>=-10);
  for(let i=0;i<45;i++) stepSantaFlight(s,{x:1,y:0},1/60,bounds);
  const before=s.x, velocity=s.vx;
  stepSantaFlight(s,{x:0,y:0},1/60,bounds);
  assert.ok(s.x>before && s.vx<velocity && s.vx>0);
  stepSantaFlight(s,{x:-1,y:0},1/60,bounds); assert.ok(s.vx>0,'reversing takes time');
  for(let i=0;i<90;i++) stepSantaFlight(s,{x:-1,y:0},1/60,bounds);
  assert.ok(s.vx<0 && s.direction===-1);
});
test('manual flight lands on the first wide ledge, takes off, and clamps viewport bounds', () => {
  const s=body(), ledge={left:100,right:600,y:400}, floor={left:0,right:1000,y:700};
  for(let i=0;i<60;i++) stepSantaFlight(s,{x:0,y:1},1/60,{...bounds,surfaces:[floor,ledge]});
  assert.equal(s.y,400); assert.equal(s.state,'landed'); assert.equal(s.manualSurface,ledge);
  stepSantaFlight(s,{x:0,y:-1},1/60,{...bounds,surfaces:[floor,ledge]});
  assert.ok(s.y<400 && s.vy<0); assert.equal(s.manualSurface,null);
  for(let i=0;i<400;i++) stepSantaFlight(s,{x:1,y:-1},1/60,bounds);
  assert.equal(s.x,880); assert.ok(s.y>=120*90/178); assert.equal(s.vx,0);
  const narrow=body();stepSantaFlight(narrow,{x:1,y:1},.05,{...bounds,width:80,height:40});
  assert.equal(narrow.x,0);assert.ok(narrow.y<=40 && narrow.y>=0);
});
test('a narrow ledge cannot catch only part of the team', () => {
  const s=body(); s.vy=100; s.y=398;
  stepSantaFlight(s,{x:0,y:1},.05,{...bounds,surfaces:[{left:300,right:350,y:400}]});
  assert.ok(s.y>400);assert.equal(s.state,'manual');
});
test('gift origin follows the hands through mirroring and banking, with normalized aim', () => {
  const s=body(), size=178;
  const right=santaThrowPose(s,size,{x:100,y:200});
  assert.equal(right.muzzle.x,358);assert.equal(right.muzzle.y,311);
  assert.ok(Math.abs(Math.hypot(right.dx,right.dy)-1)<1e-9);
  s.direction=-1;const left=santaThrowPose(s,size,right.muzzle);
  assert.equal(left.muzzle.x,420);assert.equal(left.muzzle.y,311);
  s.direction=1;s.bank=90;
  const banked=santaThrowPose(s,size,{x:0,y:0});
  assert.ok(Math.abs(banked.muzzle.x-383.5)<1e-9);
  const coincident=santaThrowPose(s,size,banked.muzzle);
  assert.equal(coincident.dx,1);assert.equal(coincident.dy,0);
});
