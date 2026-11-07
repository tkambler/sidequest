import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aimAt,muzzleAt,segmentHitTime} from '../src/muskets.js';
import {createTurkeys} from '../src/turkeys.js';

test('musket aims upward and downward around the hand',()=>{
  const pilgrim={x:100,y:300};
  const up=aimAt(pilgrim,{x:250,y:150},34);
  const down=aimAt(pilgrim,{x:250,y:450},34);
  assert.ok(up.angle<0 && down.angle>0);
  assert.equal(up.direction,1);
  assert.ok(Number.isFinite(up.angle));
});
test('left-facing aim mirrors the muzzle and still intersects the target',()=>{
  for(const target of [{x:250,y:200},{x:0,y:200},{x:250,y:400},{x:0,y:400}]){
    const aim=aimAt({x:100,y:300},target,34);
    const muzzle=muzzleAt(aim,34,aim.angle);
    const dx=aim.targetX-aim.pivotX,dy=aim.targetY-aim.pivotY;
    assert.ok(Math.abs((muzzle.x-aim.pivotX)*dy-(muzzle.y-aim.pivotY)*dx)<1e-8);
    assert.ok((muzzle.x-aim.pivotX)*dx>0);
    assert.equal(aim.direction,target.x<100?-1:1);
  }
});
test('musket geometry scales with the configured sprite size',()=>{
  const aim=aimAt({x:100,y:300},{x:250,y:200},34);
  const scaled=aimAt({x:200,y:600},{x:500,y:400},68);
  assert.equal(scaled.angle,aim.angle);
  const a=muzzleAt(aim,34,aim.angle),b=muzzleAt(scaled,68,scaled.angle);
  assert.ok(Math.abs(b.x-a.x*2)<1e-8&&Math.abs(b.y-a.y*2)<1e-8);
});
test('shot configuration rejects invalid ranges and permits disabling',()=>{
  for(const options of [{shotInterval:[0,10]},{shotInterval:[30,10]},{shotInterval:true},{musketRange:0},{musketRange:Infinity}]){
    assert.throws(()=>createTurkeys(options),TypeError);
  }
  assert.equal(createTurkeys({shotInterval:false}).count,0);
});

test('swept musket balls detect hits without tunneling',()=>{
  const box={left:40,right:60,top:-5,bottom:5};
  assert.equal(segmentHitTime({x:0,y:0},{x:100,y:0},box),.4);
  assert.equal(segmentHitTime({x:100,y:0},{x:0,y:0},box),.4);
  assert.equal(segmentHitTime({x:50,y:0},{x:80,y:10},box),0);
  assert.equal(segmentHitTime({x:50,y:0},{x:50,y:0},box),0);
  assert.equal(segmentHitTime({x:0,y:10},{x:100,y:10},box),null);
  assert.equal(segmentHitTime({x:0,y:0},{x:20,y:0},box),null);
  assert.equal(segmentHitTime({x:0,y:0},{x:0,y:0},box),null);
});
test('roasting configuration validates probability and lifetime',()=>{
  for(const options of [{shotAccuracy:-.1},{shotAccuracy:1.1},{shotAccuracy:NaN},{roastLifetime:0}]) assert.throws(()=>createTurkeys(options),TypeError);
  assert.equal(createTurkeys({shotAccuracy:0}).count,0);
  assert.equal(createTurkeys({shotAccuracy:1}).count,0);
});
