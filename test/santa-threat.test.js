import { test } from 'node:test';
import assert from 'node:assert/strict';
import { santaHitBoxes, santaShotHit } from '../src/santa-threat.js';
const pose={x:100,y:300,bank:0,direction:1};

test('cowboy collisions cover Santa and the reindeer through facing and banking',()=>{
  const boxes=santaHitBoxes(pose,178);
  assert.deepEqual(boxes[0],{left:106,right:182,top:215,bottom:299});
  assert.deepEqual(boxes[1],{left:190,right:277,top:247,bottom:299});
  const mirrored=santaHitBoxes({...pose,direction:-1},178);
  assert.equal(mirrored[0].left,196);assert.equal(mirrored[0].right,272);
  for(const b of santaHitBoxes({...pose,bank:10},178))assert.ok(b.left<b.right&&b.top<b.bottom);
  assert.notEqual(santaShotHit({x:0,y:260},{x:400,y:260},pose,pose,178),null);
});
test('bullets can pass the empty space between Santa and the team',()=>{
  assert.equal(santaShotHit({x:185,y:200},{x:185,y:310},pose,pose,178),null);
  assert.equal(santaShotHit({x:195,y:235},{x:270,y:235},pose,pose,178),null);
  assert.equal(santaShotHit({x:20,y:100},{x:60,y:150},pose,pose,178),null);
});
test('swept collision catches a fast shot and a sleigh crossing its path',()=>{
  const time=santaShotHit({x:0,y:260},{x:900,y:260},pose,pose,178);
  assert.ok(time>0 && time<.3,'a fast shot cannot tunnel through Santa');
  const crossed=santaShotHit({x:220,y:225},{x:220,y:226},pose,{...pose,x:260},178);
  assert.ok(crossed!==null && crossed>0 && crossed<1,'moving targets are swept too');
});
